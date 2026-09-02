from typing import Any

from sqlalchemy.orm import Session

from ..schemas.ai import StructuredEvaluation


class ScoringService:
    def __init__(self, db: Session):
        self.db = db

    def score_case_answer(
        self,
        attempt_id: str,
        question_id: str,
        answer_text: str,
        rubric: str | None = None,
    ) -> tuple[int, str | None]:
        return (0, None)

    def validate_evaluation(self, evaluation: Any) -> StructuredEvaluation:
        raise NotImplementedError("Scoring service AI integration in Phase 8")

    def compute_overall_score(self, component_scores: dict[str, int]) -> int:
        weights = {
            "structuring": 0.25,
            "quantitative": 0.25,
            "business_judgment": 0.20,
            "communication": 0.15,
            "synthesis": 0.15,
        }
        score = sum(
            component_scores.get(k, 0) * w
            for k, w in weights.items()
        )
        return max(0, min(100, int(score)))
