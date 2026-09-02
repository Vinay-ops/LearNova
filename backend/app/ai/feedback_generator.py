from __future__ import annotations

from typing import Any, Optional

from .prompts.base import prompt_registry
from .client import LLMClientProtocol, get_llm_client
from ..core.logging import log_ai_request
from ..core.exceptions import AIError


class FeedbackGeneratorService:
    def __init__(self, client: Optional[LLMClientProtocol] = None):
        self.client = client or get_llm_client()

    def generate_feedback(
        self,
        profile: dict[str, Any],
        case_results: dict[str, Any],
        drills_catalog: list[dict[str, Any]],
        prompt_version: str = "v1",
    ) -> dict[str, Any]:
        from .__init__ import bootstrap_prompts
        bootstrap_prompts()
        try:
            prompt_registry.get("feedback", prompt_version)
        except KeyError:
            raise AIError("Feedback prompt not yet registered. Phase 8.")
        return {
            "overall_score": case_results.get("overall_score", 0),
            "max_score": 100,
            "skill_breakdown": case_results.get("skills", []),
            "strengths": case_results.get("strengths", []),
            "biggest_opportunity": None,
            "better_approach": None,
            "recommended_drill": None,
        }
