from __future__ import annotations

from typing import Any, Optional

from .prompts.base import prompt_registry
from .client import LLMClientProtocol, get_llm_client
from ..core.exceptions import AIError


class RecommenderService:
    def __init__(self, client: Optional[LLMClientProtocol] = None):
        self.client = client or get_llm_client()

    def get_personalized_recommendations(
        self,
        progress_summary: dict[str, Any],
        applications: list[dict[str, Any]],
        prompt_version: str = "v1",
    ) -> dict[str, Any]:
        from .__init__ import bootstrap_prompts
        bootstrap_prompts()
        try:
            prompt_registry.get("recommendations", prompt_version)
        except KeyError:
            raise AIError("Recommendations prompt not yet registered. Phase 9.")
        return {
            "recommended_cases": [],
            "recommended_drills": [],
            "next_best_action": "Continue practicing cases and drills to build consistency.",
            "reasoning": "Recommendations engine will be integrated in Phase 9.",
        }
