from typing import Any

from sqlalchemy.orm import Session


class RecommendationService:
    def __init__(self, db: Session):
        self.db = db

    def get_next_best_actions(self, user_id: str) -> dict[str, Any]:
        raise NotImplementedError("Recommendations AI integration in Phase 9")

    def recommend_cases(self, user_id: str, limit: int = 3) -> list[Any]:
        return []

    def recommend_drills(self, user_id: str, limit: int = 3) -> list[Any]:
        return []

    def estimate_readiness_gap(self, user_id: str) -> dict[str, Any]:
        return {
            "target_score": 90,
            "current_score": 0,
            "gap": 90,
            "focus_areas": [],
        }
