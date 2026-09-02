from __future__ import annotations

from typing import Any, Optional

from .prompts.base import prompt_registry, build_context
from .client import LLMClientProtocol, get_llm_client
from ..core.logging import log_ai_request
from ..core.exceptions import AIError


def build_interviewer_context(
    profile: dict[str, Any],
    case_data: dict[str, Any],
    questions: list[dict[str, Any]],
    conversation_history: list[dict[str, Any]],
    question_index: int,
    total_questions: int,
    current_performance: str = "No prior attempts",
) -> dict[str, Any]:
    q_summary_lines = []
    for i, q in enumerate(questions, 1):
        qtype = q.get("question_type", "structuring")
        qtext = (q.get("question_text") or "")[:80]
        q_summary_lines.append(f"{i}. [{qtype}] {qtext}")

    history_lines = []
    for msg in conversation_history[-12:]:
        role = msg.get("role", "interviewer")
        content = (msg.get("content") or "")[:300]
        history_lines.append(f"{role.upper()}: {content}")

    return {
        "experience_level": profile.get("experience_level", "Unknown"),
        "target_firms": ", ".join(profile.get("target_firms") or []) or "Not specified",
        "interview_date": str(profile.get("interview_date", "not set")),
        "current_performance": current_performance,
        "case_title": case_data.get("title", ""),
        "case_company": case_data.get("company", ""),
        "case_type": case_data.get("case_type", ""),
        "case_difficulty": case_data.get("difficulty", "Medium"),
        "case_background": case_data.get("background") or case_data.get("prompt") or "",
        "questions_summary": "\n".join(q_summary_lines) or "Questions TBD",
        "conversation_history": "\n".join(history_lines) or "(no prior messages)",
        "question_index": int(question_index),
        "total_questions": int(total_questions),
    }


class InterviewerService:
    def __init__(self, client: Optional[LLMClientProtocol] = None):
        self.client = client or get_llm_client()

    def next_question(
        self,
        profile: dict[str, Any],
        case_data: dict[str, Any],
        questions: list[dict[str, Any]],
        conversation_history: list[dict[str, Any]],
        question_index: int,
        total_questions: int,
        prompt_version: str = "v1",
    ) -> dict[str, Any]:
        from .__init__ import bootstrap_prompts
        bootstrap_prompts()

        template = prompt_registry.get("interviewer", prompt_version)
        context = build_interviewer_context(
            profile=profile,
            case_data=case_data,
            questions=questions,
            conversation_history=conversation_history,
            question_index=question_index,
            total_questions=total_questions,
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
                model=template.model,
                temperature=template.temperature,
            )
            latency_ms = int((time.perf_counter() - start) * 1000)
            log_ai_request(
                "interviewer_next_question",
                prompt_name=template.name,
                prompt_version=template.version,
                model=response.model,
                latency_ms=latency_ms,
                tokens_used=response.tokens_used,
                success=True,
            )
            import json
            try:
                structured = json.loads(response.content)
            except Exception:
                structured = {
                    "question": response.content,
                    "question_type": "probe",
                    "display_hint": "",
                    "expected_duration_seconds": 120,
                    "notes": "fallback parse",
                }
            return {
                "message": structured.get("question", response.content),
                "structured_output": structured,
            }
        except Exception as e:
            latency_ms = int((time.perf_counter() - start) * 1000)
            log_ai_request(
                "interviewer_next_question",
                prompt_name="interviewer",
                prompt_version=prompt_version,
                latency_ms=latency_ms,
                success=False,
                error=str(e),
            )
            raise
