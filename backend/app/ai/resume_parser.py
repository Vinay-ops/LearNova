from __future__ import annotations

import time
from typing import Any, Optional

from .client import LLMClientProtocol, StubLLMClient, get_llm_client, validate_structured_output
from .prompts.base import prompt_registry
from ..core.exceptions import AIError
from ..core.logging import log_ai_request
from ..schemas.ai import ResumeData


class ResumeParserService:
    """Structured resume extraction (name, skills, projects, experience...).

    Runs the resume_parser_v1 prompt (Prompt Registry) through the LLM
    abstraction and validates the output against the ResumeData schema. When
    the provider is not configured the caller gets an explicit error — resume
    structure is never fabricated locally.
    """

    def __init__(self, client: Optional[LLMClientProtocol] = None):
        self.client = client or get_llm_client()

    def parse(
        self,
        resume_text: str,
        role: Optional[str] = None,
        prompt_version: str = "v1",
    ) -> ResumeData:
        from .__init__ import bootstrap_prompts
        bootstrap_prompts()

        resolved = self.client or get_llm_client()
        if isinstance(resolved, StubLLMClient):
            raise AIError(
                "AI provider is not configured. Set GROQ_API_KEY to enable resume parsing.",
                retryable=False,
            )

        template = prompt_registry.get("resume_parser", prompt_version)
        context: dict[str, Any] = {
            "resume_text": (resume_text or "").strip()[:12000] or "(resume text is empty)",
            "role": (role or "").strip() or "Not specified",
        }
        is_valid, errors = template.validate_context(context)
        if not is_valid:
            raise AIError(f"Prompt context invalid: {'; '.join(errors)}")

        start = time.perf_counter()
        try:
            response = self.client.chat(
                system_prompt=template.render_system(context),
                user_prompt=template.render_user(context) or "",
                model=template.model or None,
                temperature=template.temperature,
                max_tokens=template.max_tokens,
            )
            latency_ms = int((time.perf_counter() - start) * 1000)
            log_ai_request(
                "resume_parse",
                prompt_name=template.name,
                prompt_version=template.version,
                model=response.model,
                latency_ms=latency_ms,
                tokens_used=response.tokens_used,
                success=True,
            )
            parsed = validate_structured_output(
                response.content,
                ResumeData,
                max_retries=1,
                prompt_name=template.prompt_id,
            )
            return parsed
        except Exception as e:
            latency_ms = int((time.perf_counter() - start) * 1000)
            log_ai_request(
                "resume_parse",
                prompt_name=template.name,
                prompt_version=prompt_version,
                latency_ms=latency_ms,
                success=False,
                error=str(e),
            )
            raise
