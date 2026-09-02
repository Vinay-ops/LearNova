from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Optional, Protocol

from pydantic import BaseModel, ValidationError

from ..core.config import settings
from ..core.exceptions import AIError, AIValidationError
from ..core.logging import log_ai_request


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
    def __init__(self) -> None:
        self.default_model = getattr(settings, "LLM_MODEL", "gpt-4o")
        self.default_temperature = 0.7

    def _is_configured(self) -> bool:
        api_key = getattr(settings, "OPENAI_API_KEY", None)
        return bool(api_key)

    def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        response_format: Optional[Any] = None,
    ) -> LLMResponse:
        if not self._is_configured():
            raise AIError(
                "LLM client is not configured. Set OPENAI_API_KEY in environment.",
                retryable=False,
            )
        raise AIError(
            "LLM client placeholder: install and configure the desired provider SDK.",
            retryable=False,
        )


class StubLLMClient(BaseLLMClient):
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
            "Configure OPENAI_API_KEY and install the provider SDK to enable AI features."
        )
        latency_ms = int((time.perf_counter() - start) * 1000)
        return LLMResponse(
            content=content,
            model=model or self.default_model,
            tokens_used=0,
            latency_ms=latency_ms,
        )


def get_llm_client() -> LLMClientProtocol:
    return StubLLMClient()


def validate_structured_output(
    raw_content: str,
    schema_model: type[BaseModel],
    max_retries: int = 2,
    prompt_name: Optional[str] = None,
) -> Any:
    import json

    last_error: Optional[Exception] = None
    for attempt in range(max_retries + 1):
        try:
            parsed = json.loads(raw_content)
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
