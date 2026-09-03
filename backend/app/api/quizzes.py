from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..core.security import get_current_user, get_db
from ..models.user import User
from ..schemas.quiz import (
    QuizAnalysisResponse,
    QuizGenerateRequest,
    QuizGenerateResponse,
)
from ..services.quiz_service import QuizService

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])


@router.post("/generate", response_model=QuizGenerateResponse)
def generate_quiz(
    payload: QuizGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate an AI quiz on any topic and persist it as an Assessment.

    The LLM output is validated (structure + quality) and regenerated per
    invalid question before anything is stored.
    """
    service = QuizService(db)
    return service.generate(
        user_id=current_user.id,
        topic=payload.topic,
        difficulty=payload.difficulty,
        question_count=payload.question_count,
        focus_subtopics=payload.focus_subtopics,
    )


@router.get("/attempts/{attempt_id}/analysis", response_model=QuizAnalysisResponse)
def analyze_attempt(
    attempt_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deterministic per-subtopic performance analysis of a completed attempt."""
    service = QuizService(db)
    return service.analyze_attempt(attempt_id, current_user.id)
