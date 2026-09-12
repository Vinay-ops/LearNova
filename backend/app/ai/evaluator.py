from __future__ import annotations

from typing import Any, Optional

from .prompts.base import prompt_registry, build_context
from .client import LLMClientProtocol, get_llm_client, validate_structured_output
from ..schemas.ai import StructuredEvaluation
from ..core.logging import log_ai_request
from ..core.exceptions import AIError


def build_evaluator_context(
    case_data: dict[str, Any],
    transcript: str,
    answers: list[dict[str, Any]],
    candidate_profile: dict[str, Any],
) -> dict[str, Any]:
    model_answers_lines = []
    for idx, a in enumerate(answers, 1):
        model = a.get("model_answer") or "N/A"
        model_answers_lines.append(f"Q{idx} model answer: {model}")

    answers_lines = []
    for idx, a in enumerate(answers, 1):
        given = a.get("answer_text") or "(no answer provided)"
        answers_lines.append(f"Q{idx}: {given}")

    return {
        "case_title": case_data.get("title", ""),
        "case_type": case_data.get("case_type", ""),
        "case_rubric": case_data.get("rubric", "Standard case rubric applies."),
        "model_answers": "\n".join(model_answers_lines),
        "transcript": transcript,
        "answers_list": "\n".join(answers_lines),
        "experience_level": candidate_profile.get("experience_level", "Unknown"),
        "target_firms": ", ".join(candidate_profile.get("target_firms") or []) or "Not specified",
    }


class EvaluatorService:
    def __init__(self, client: Optional[LLMClientProtocol] = None):
        self.client = client or get_llm_client()

    def evaluate_attempt(
        self,
        case_data: dict[str, Any],
        transcript: str,
        answers: list[dict[str, Any]],
        candidate_profile: dict[str, Any],
        prompt_version: str = "v1",
        prompt_name: str = "evaluator",
    ) -> StructuredEvaluation:
        from .__init__ import bootstrap_prompts
        bootstrap_prompts()

        template = prompt_registry.get(prompt_name, prompt_version)
        context = build_evaluator_context(case_data, transcript, answers, candidate_profile)
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
                max_tokens=template.max_tokens,
            )
            latency_ms = int((time.perf_counter() - start) * 1000)
            log_ai_request(
                "evaluate",
                prompt_name=template.name,
                prompt_version=template.version,
                model=response.model,
                latency_ms=latency_ms,
                tokens_used=response.tokens_used,
                success=True,
            )
            evaluated = validate_structured_output(
                response.content,
                StructuredEvaluation,
                max_retries=1,
                prompt_name=template.prompt_id,
            )
            return evaluated
        except Exception as e:
            latency_ms = int((time.perf_counter() - start) * 1000)
            log_ai_request(
                "evaluate",
                prompt_name=getattr(template, "name", prompt_name),
                prompt_version=prompt_version,
                latency_ms=latency_ms,
                success=False,
                error=str(e),
            )
            raise
