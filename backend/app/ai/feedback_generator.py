from __future__ import annotations

import time
from typing import Any, Optional

from .prompts.base import prompt_registry
from .client import LLMClientProtocol, get_llm_client, validate_structured_output
from ..schemas.ai import FeedbackLLMResult, SkillBreakdown
from ..core.logging import log_ai_request
from ..core.exceptions import AIError


class FeedbackGeneratorService:
    """Personalized post-interview feedback.

    Primary path: feedback_v1 prompt through the LLM abstraction (Prompt
    Registry, structured JSON output). If the provider is unavailable or
    returns invalid output, a deterministic summary derived from the real
    stored evaluation is returned instead — never random/fabricated numbers.
    """

    def __init__(self, client: Optional[LLMClientProtocol] = None):
        self.client = client or get_llm_client()

    @staticmethod
    def _skills_text(skills: list[dict[str, Any]]) -> str:
        if not skills:
            return "(no skill scores yet)"
        return "\n".join(
            f"- {s.get('skill')}: {s.get('score')}/100"
            + (f" — {s['evidence']}" if s.get("evidence") else "")
            for s in skills
        )

    @staticmethod
    def _drills_text(drills: list[dict[str, Any]]) -> str:
        if not drills:
            return "(no drills available)"
        return "\n".join(
            f"- {d.get('title')} [{d.get('category') or d.get('skill') or 'General'}]"
            for d in drills
        )

    def _deterministic_fallback(
        self, case_results: dict[str, Any], drills: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """Feedback assembled from the real evaluation data (no LLM)."""
        skills = case_results.get("skills") or []
        weakest = min(skills, key=lambda s: s.get("score", 0)) if skills else None
        improvements = case_results.get("improvements") or []

        recommended_drill = None
        if weakest and drills:
            matched = next(
                (
                    d
                    for d in drills
                    if weakest.get("skill", "").lower()
                    in " ".join(d.get("skills") or []).lower()
                ),
                None,
            )
            if matched:
                recommended_drill = {
                    "title": matched.get("title"),
                    "duration": matched.get("duration_minutes") or 10,
                    "skill": weakest.get("skill"),
                }

        return {
            "overall_score": case_results.get("overall_score", 0),
            "max_score": 100,
            "skill_breakdown": [
                SkillBreakdown(
                    skill=s.get("skill", "Unknown"),
                    score=int(s.get("score", 0)),
                    evidence=s.get("evidence"),
                )
                for s in skills
            ],
            "strengths": case_results.get("strengths") or [],
            "biggest_opportunity": (
                SkillBreakdown(
                    skill=weakest["skill"],
                    score=int(weakest.get("score", 0)),
                    evidence=weakest.get("evidence"),
                )
                if weakest
                else None
            ),
            "better_approach": improvements[0] if improvements else None,
            "recommended_drill": recommended_drill,
        }

    def generate_feedback(
        self,
        profile: dict[str, Any],
        case_results: dict[str, Any],
        drills_catalog: list[dict[str, Any]],
        prompt_version: str = "v1",
    ) -> dict[str, Any]:
        from .__init__ import bootstrap_prompts
        bootstrap_prompts()

        template = prompt_registry.get("feedback", prompt_version)
        context = {
            "experience_level": profile.get("experience_level") or "Intermediate",
            "target_firms": ", ".join(profile.get("target_firms") or []) or "Not specified",
            "case_title": case_results.get("case_title") or "the interview",
            "overall_score": str(case_results.get("overall_score", 0)),
            "skill_scores": self._skills_text(case_results.get("skills") or []),
            "transcript_excerpts": case_results.get("transcript_excerpts")
            or "(no transcript excerpt)",
            "drill_catalog": self._drills_text(drills_catalog),
        }
        ok, errors = template.validate_context(context)
        if not ok:
            raise AIError(f"Feedback prompt context invalid: {'; '.join(errors)}")

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
                "feedback",
                prompt_name=template.name,
                prompt_version=template.version,
                model=response.model,
                latency_ms=latency_ms,
                tokens_used=response.tokens_used,
                success=True,
            )
            parsed = validate_structured_output(
                response.content,
                FeedbackLLMResult,
                max_retries=1,
                prompt_name=template.prompt_id,
            )
            result = parsed.model_dump()
            if parsed.biggest_opportunity:
                result["biggest_opportunity"] = SkillBreakdown(
                    skill=parsed.biggest_opportunity.skill,
                    score=parsed.biggest_opportunity.score,
                    evidence=parsed.biggest_opportunity.feedback,
                ).model_dump()
            else:
                result["biggest_opportunity"] = None
            return result
        except AIError as e:
            # Provider unavailable or invalid output → deterministic summary
            # from the real stored evaluation. Never fabricate scores.
            log_ai_request(
                "feedback",
                prompt_name="feedback",
                prompt_version=prompt_version,
                latency_ms=int((time.perf_counter() - start) * 1000),
                success=False,
                error=str(e),
                fallback="deterministic",
            )
            return self._deterministic_fallback(case_results, drills_catalog)