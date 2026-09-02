from __future__ import annotations

from typing import Any, Optional

from .prompts.base import prompt_registry, build_context
from .client import LLMClientProtocol, get_llm_client, validate_structured_output
from ..core.logging import log_ai_request
from ..core.exceptions import AIError


def build_case_generation_context(
    case_type: str = "any",
    difficulty: str = "Medium",
    industry: str = "any",
    focus_skills: list[str] | None = None,
    experience_level: str = "Intermediate",
    duration_minutes: int = 25,
) -> dict[str, Any]:
    return {
        "case_type": case_type or "any",
        "difficulty": difficulty or "Medium",
        "industry": industry or "any",
        "focus_skills": ", ".join(focus_skills or []),
        "experience_level": experience_level or "Intermediate",
        "duration_minutes": str(duration_minutes),
    }


class CaseGeneratorService:
    def __init__(self, client: Optional[LLMClientProtocol] = None):
        self.client = client or get_llm_client()

    def generate_case(
        self,
        case_type: str = "any",
        difficulty: str = "Medium",
        industry: str = "any",
        focus_skills: list[str] | None = None,
        experience_level: str = "Intermediate",
        duration_minutes: int = 25,
        prompt_version: str = "v1",
    ) -> dict[str, Any]:
        from .__init__ import bootstrap_prompts
        bootstrap_prompts()

        template = prompt_registry.get("case_generation", prompt_version)
        context = build_case_generation_context(
            case_type=case_type,
            difficulty=difficulty,
            industry=industry,
            focus_skills=focus_skills,
            experience_level=experience_level,
            duration_minutes=duration_minutes,
        )
        is_valid, errors = template.validate_context(context)
        if not is_valid:
            raise AIError(f"Prompt context invalid: {'; '.join(errors)}")

        import time
        start = time.perf_counter()
        try:
            system_prompt = template.render_system(context)
            user_prompt = template.render_user(context) or ""
            response = self.client.chat(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                model=template.model or None,
                temperature=template.temperature,
            )
            latency_ms = int((time.perf_counter() - start) * 1000)
            log_ai_request(
                "case_generation",
                prompt_name=template.name,
                prompt_version=template.version,
                model=response.model,
                latency_ms=latency_ms,
                tokens_used=response.tokens_used,
                success=True,
            )
            import json
            return json.loads(response.content)
        except Exception as e:
            latency_ms = int((time.perf_counter() - start) * 1000)
            log_ai_request(
                "case_generation",
                prompt_name="case_generation",
                prompt_version=prompt_version,
                latency_ms=latency_ms,
                success=False,
                error=str(e),
            )
            raise
