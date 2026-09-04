from __future__ import annotations

import time
from typing import Any, Optional

from .prompts.base import prompt_registry
from .client import LLMClientProtocol, get_llm_client, validate_structured_output
from ..schemas.ai import RecommendationsLLMResult
from ..core.logging import log_ai_request
from ..core.exceptions import AIError


class RecommenderService:
    """Personalized next-step recommendations.

    Deterministic core: weak skills (from real progress/skill data) are mapped
    to matching drills and cases from the actual catalog. When the LLM provider
    is available, the recommendations_v1 prompt enriches the reasoning; on
    provider failure the deterministic result (derived from real data) is kept.
    """

    def __init__(self, client: Optional[LLMClientProtocol] = None):
        self.client = client or get_llm_client()

    # -- deterministic engine -------------------------------------------------

    def _deterministic(
        self,
        progress_summary: dict[str, Any],
        drills: list[dict[str, Any]],
        cases: list[dict[str, Any]],
        evaluation: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        skills = progress_summary.get("skill_scores") or []
        # Weakest = lowest-scoring skills that have been measured at least once.
        measured = [s for s in skills if s.get("score", 0) > 0]
        weak_skills = sorted(measured, key=lambda s: s.get("score", 0))[:3] if measured else []

        if evaluation:
            eval_skills = evaluation.get("skills") or []
            weak_skills = sorted(eval_skills, key=lambda s: s.get("score", 0))[:3] or weak_skills

        weak_names = [s.get("skill", "").lower() for s in weak_skills]
        weak_names = [n for n in weak_names if n]

        def match(item: dict[str, Any]) -> bool:
            item_skills = " ".join(item.get("skills") or []).lower()
            return any(name in item_skills for name in weak_names)

        recommended_drills = [
            {"id": d.get("id"), "title": d.get("title"), "reason": f"Targets your weak area: {s.get('skill')}"}
            for s in weak_skills
            for d in drills
            if match(d) and d.get("id") == d.get("id")
        ]
        # De-duplicate by id, keep the first reason.
        seen_drills: dict[str, dict[str, Any]] = {}
        for s in weak_skills:
            for d in drills:
                if match(d) and d.get("id") not in seen_drills:
                    seen_drills[d["id"]] = {
                        "id": d.get("id"),
                        "title": d.get("title"),
                        "reason": f"Targets your weak area: {s.get('skill')}",
                    }
        recommended_cases = {}
        for s in weak_skills:
            for c in cases:
                if match(c) and c.get("id") not in recommended_cases:
                    recommended_cases[c["id"]] = {
                        "id": c.get("id"),
                        "title": c.get("title"),
                        "reason": f"Practice applying {s.get('skill')} in a realistic scenario",
                    }

        if not weak_names:
            next_action = "Keep building consistency — complete a case and an assessment this week."
            reasoning = "No weak skills detected yet; complete more practice to surface targeted recommendations."
        else:
            focus = ", ".join(s.get("skill", "") for s in weak_skills[:2])
            next_action = f"Focus next on {focus} — start with the recommended drill above."
            reasoning = (
                "Recommendations are derived from your actual skill scores"
                + (f" (weakest: {focus})." if focus else ".")
            )

        return {
            "recommended_cases": list(recommended_cases.values())[:3],
            "recommended_drills": list(seen_drills.values())[:3],
            "next_best_action": next_action,
            "reasoning": reasoning,
        }

    # -- public API -----------------------------------------------------------

    def get_personalized_recommendations(
        self,
        progress_summary: dict[str, Any],
        applications: list[dict[str, Any]],
        prompt_version: str = "v1",
        drills: Optional[list[dict[str, Any]]] = None,
        cases: Optional[list[dict[str, Any]]] = None,
        evaluation: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        drills = drills or []
        cases = cases or []
        deterministic = self._deterministic(progress_summary, drills, cases, evaluation)

        from .__init__ import bootstrap_prompts
        bootstrap_prompts()
        try:
            template = prompt_registry.get("recommendations", prompt_version)
        except KeyError:
            return deterministic

        skills = progress_summary.get("skill_scores") or []
        skill_text = "\n".join(
            f"- {s.get('skill') or s.get('name')}: {s.get('score')}/100" for s in skills
        ) or "(no skill scores yet)"
        case_history = progress_summary.get("total_cases_completed", 0)
        assessment_history = progress_summary.get("total_assessments_completed", 0)
        upcoming = applications and [
            f"{a.get('company')} — {a.get('role')} ({a.get('deadline') or 'no deadline'})"
            for a in applications
        ]
        context = {
            "readiness_score": str(progress_summary.get("readiness_score", 0)),
            "skill_scores": skill_text,
            "case_history": f"{case_history} cases completed",
            "assessment_history": f"{assessment_history} assessments completed",
            "upcoming_deadlines": "; ".join(upcoming) if upcoming else "None",
        }
        ok, errors = template.validate_context(context)
        if not ok:
            return deterministic

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
                "recommendations",
                prompt_name=template.name,
                prompt_version=template.version,
                model=response.model,
                latency_ms=latency_ms,
                tokens_used=response.tokens_used,
                success=True,
            )
            parsed = validate_structured_output(
                response.content,
                RecommendationsLLMResult,
                max_retries=1,
                prompt_name=template.prompt_id,
            )
            enriched = parsed.model_dump()
            # Keep real catalog items when the LLM returns empty lists.
            if not enriched.get("recommended_cases"):
                enriched["recommended_cases"] = deterministic["recommended_cases"]
            if not enriched.get("recommended_drills"):
                enriched["recommended_drills"] = deterministic["recommended_drills"]
            if not enriched.get("next_best_action"):
                enriched["next_best_action"] = deterministic["next_best_action"]
            return enriched
        except AIError as e:
            log_ai_request(
                "recommendations",
                prompt_name="recommendations",
                prompt_version=prompt_version,
                latency_ms=int((time.perf_counter() - start) * 1000),
                success=False,
                error=str(e),
                fallback="deterministic",
            )
            return deterministic