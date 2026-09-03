from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from typing import Any, Optional, Protocol

from pydantic import BaseModel, ValidationError

from ..core.config import settings
from ..core.exceptions import AIError, AIValidationError
from ..core.logging import log_ai_request

logger = logging.getLogger("learnova.ai.client")


@dataclass
class LLMResponse:
    content: str
    structured: Optional[Any] = None
    model: Optional[str] = None
    tokens_used: int = 0
    latency_ms: int = 0
    raw_response: Any = None


class LLMClientProtocol(Protocol):
    def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        response_format: Optional[Any] = None,
    ) -> LLMResponse: ...


class BaseLLMClient:
    """Shared defaults for all LLM clients.

    The rest of Learnova talks only to LLMClientProtocol, so switching the
    provider (Groq today) never touches services, prompts, or routes.
    """

    DEFAULT_MODEL = "openai/gpt-oss-120b"

    def __init__(self) -> None:
        self.default_model = (
            (getattr(settings, "GROQ_MODEL", "") or "").strip() or self.DEFAULT_MODEL
        )
        self.default_temperature = getattr(settings, "LLM_TEMPERATURE", 0.7)

    def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        response_format: Optional[Any] = None,
    ) -> LLMResponse:
        raise AIError(
            "LLM client is not configured. Set GROQ_API_KEY in environment.",
            retryable=False,
        )


class StubLLMClient(BaseLLMClient):
    """Returns deterministic stub responses for testing and development."""

    def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        response_format: Optional[Any] = None,
    ) -> LLMResponse:
        start = time.perf_counter()
        content = (
            "STUB RESPONSE: LLM client is not fully integrated. "
            "Configure GROQ_API_KEY to enable AI features."
        )
        latency_ms = int((time.perf_counter() - start) * 1000)
        return LLMResponse(
            content=content,
            model=model or self.default_model,
            tokens_used=0,
            latency_ms=latency_ms,
        )


class GroqLLMClient(BaseLLMClient):
    """Production LLM client that talks to Groq via its OpenAI-compatible API.

    Groq exposes an OpenAI-compatible endpoint, so we reuse the `openai` SDK
    pointed at https://api.groq.com/openai/v1 — no separate Groq SDK needed.
    """

    # Hard fallback so a request is never sent without a model — the provider
    # rejects model-less requests with a 400. A blank GROQ_MODEL env value
    # ("") must NOT disable model resolution.
    DEFAULT_MODEL_FALLBACK = "openai/gpt-oss-120b"

    @staticmethod
    def _normalize_base_url(raw: Optional[str]) -> str:
        """Sanitize GROQ_BASE_URL before the SDK appends its route paths.

        The OpenAI-compatible endpoint is https://api.groq.com/openai/v1 and
        the SDK appends 'chat/completions' etc. A trailing slash or a mistaken
        '/models' suffix (the model-list URL) must not corrupt request paths
        (would 404 as /openai/v1/models/chat/completions).
        """
        url = ((raw or "").strip().rstrip("/")) or "https://api.groq.com/openai/v1"
        if url.endswith("/models"):
            url = url[: -len("/models")]
        return url.rstrip("/") or "https://api.groq.com/openai/v1"

    def __init__(self) -> None:
        self.api_key = settings.GROQ_API_KEY or ""
        self.base_url = self._normalize_base_url(settings.GROQ_BASE_URL)
        self.default_model = (
            (settings.GROQ_MODEL or "").strip() or self.DEFAULT_MODEL_FALLBACK
        )
        self.default_temperature = settings.LLM_TEMPERATURE
        self._client = None

    @classmethod
    def _resolve_model(cls, model: Optional[str]) -> str:
        """Pick a non-empty model: explicit arg → configured default → fallback."""
        return (
            (model or "").strip()
            or (getattr(settings, "GROQ_MODEL", "") or "").strip()
            or cls.DEFAULT_MODEL_FALLBACK
        )

    def _get_client(self):
        """Lazy-init the OpenAI-compatible client pointed at Groq."""
        if self._client is None:
            if not self.api_key:
                raise AIError(
                    "GROQ_API_KEY is not configured. AI features are unavailable.",
                    retryable=False,
                )
            try:
                from openai import OpenAI
            except ImportError:
                raise AIError(
                    "openai package is not installed. "
                    "Run: pip install openai",
                    retryable=False,
                )

            self._client = OpenAI(
                api_key=self.api_key,
                base_url=self.base_url,
            )
        return self._client

    def _is_configured(self) -> bool:
        return bool(self.api_key)

    def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        response_format: Optional[Any] = None,
    ) -> LLMResponse:
        start = time.perf_counter()
        client = self._get_client()

        resolved_model = self._resolve_model(model)
        resolved_temp = temperature if temperature is not None else self.default_temperature

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": user_prompt})

        kwargs: dict[str, Any] = {
            "model": resolved_model,
            "messages": messages,
            "temperature": resolved_temp,
        }
        if max_tokens is not None:
            kwargs["max_tokens"] = max_tokens
        if response_format is not None:
            kwargs["response_format"] = response_format

        try:
            raw_response = client.chat.completions.create(**kwargs)
        except Exception as e:
            latency_ms = int((time.perf_counter() - start) * 1000)
            error_msg = str(e)
            # Never log the API key
            safe_msg = error_msg.replace(self.api_key, "***REDACTED***") if self.api_key else error_msg

            if "timeout" in safe_msg.lower() or "timed out" in safe_msg.lower():
                log_ai_request(
                    "groq_chat",
                    model=resolved_model,
                    latency_ms=latency_ms,
                    success=False,
                    error="timeout",
                )
                raise AIError("Groq request timed out. Please try again.", retryable=True)
            elif "rate" in safe_msg.lower() and "limit" in safe_msg.lower():
                log_ai_request(
                    "groq_chat",
                    model=resolved_model,
                    latency_ms=latency_ms,
                    success=False,
                    error="rate_limited",
                )
                raise AIError("Rate limit exceeded. Please wait before retrying.", retryable=True)
            elif "invalid" in safe_msg.lower() and ("key" in safe_msg.lower() or "api" in safe_msg.lower()):
                log_ai_request(
                    "groq_chat",
                    model=resolved_model,
                    latency_ms=latency_ms,
                    success=False,
                    error="invalid_key",
                )
                raise AIError(
                    "Invalid API key. Please check your GROQ_API_KEY configuration.",
                    retryable=False,
                )
            elif "model" in safe_msg.lower() and ("not found" in safe_msg.lower() or "does not exist" in safe_msg.lower()):
                log_ai_request(
                    "groq_chat",
                    model=resolved_model,
                    latency_ms=latency_ms,
                    success=False,
                    error="invalid_model",
                )
                raise AIError(
                    f"Model '{resolved_model}' is not available on Groq.",
                    retryable=False,
                )
            else:
                log_ai_request(
                    "groq_chat",
                    model=resolved_model,
                    latency_ms=latency_ms,
                    success=False,
                    error=safe_msg[:200],
                )
                raise AIError(
                    f"Groq API error: {safe_msg[:200]}",
                    retryable=True,
                )

        latency_ms = int((time.perf_counter() - start) * 1000)

        # Extract response content
        content = ""
        tokens_used = 0
        if raw_response.choices:
            choice = raw_response.choices[0]
            if choice.message and choice.message.content:
                content = choice.message.content
        if raw_response.usage:
            tokens_used = raw_response.usage.total_tokens or 0

        if not content:
            log_ai_request(
                "groq_chat",
                model=resolved_model,
                latency_ms=latency_ms,
                tokens_used=tokens_used,
                success=False,
                error="empty_response",
            )
            raise AIError(
                "Groq returned an empty response. The model may not support this request.",
                retryable=True,
            )

        log_ai_request(
            "groq_chat",
            model=resolved_model,
            latency_ms=latency_ms,
            tokens_used=tokens_used,
            success=True,
        )

        return LLMResponse(
            content=content,
            model=resolved_model,
            tokens_used=tokens_used,
            latency_ms=latency_ms,
            raw_response=raw_response,
        )


def get_llm_client() -> LLMClientProtocol:
    """Factory that returns the appropriate LLM client based on configuration.

    Priority:
    1. If GROQ_API_KEY is set → GroqLLMClient
    2. Otherwise → StubLLMClient (safe for tests/development)
    """
    if getattr(settings, "GROQ_API_KEY", None):
        return GroqLLMClient()
    # Fallback to stub for tests and development without API key
    return StubLLMClient()


def validate_structured_output(
    raw_content: str,
    schema_model: type[BaseModel],
    max_retries: int = 2,
    prompt_name: Optional[str] = None,
) -> Any:
    """Parse and validate LLM output against a Pydantic schema.

    Retries up to max_retries times if JSON parsing or validation fails.
    Raises AIValidationError if all attempts fail.
    """
    last_error: Optional[Exception] = None
    for attempt in range(max_retries + 1):
        try:
            # Strip markdown code fences if present
            cleaned = raw_content.strip()
            if cleaned.startswith("```"):
                # Remove opening fence (```json or ```)
                first_newline = cleaned.index("\n")
                cleaned = cleaned[first_newline + 1 :]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            parsed = json.loads(cleaned)
            validated = schema_model.model_validate(parsed)
            log_ai_request(
                "validate_output",
                prompt_name=prompt_name,
                success=True,
            )
            return validated
        except (json.JSONDecodeError, ValidationError) as e:
            last_error = e
            log_ai_request(
                "validate_output",
                prompt_name=prompt_name,
                success=False,
                error=str(e),
            )
    raise AIValidationError(
        f"Failed to validate AI output after {max_retries + 1} attempts: {last_error}"
    )
