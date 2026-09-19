from typing import List

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from ..core.security import get_current_user, get_db
from ..models.user import User
from ..models.assessment import AssessmentAttempt
from ..schemas.assessment import (
    AssessmentResponse,
    AssessmentQuestionResponse,
    AssessmentQuestionReviewItem,
    AssessmentAttemptCreate,
    AssessmentAttemptUpdate,
    AssessmentAttemptResponse,
    AssessmentAnswerCreate,
    AssessmentAnswerResponse,
)
from ..services.assessment_service import AssessmentService

router = APIRouter(prefix="/api/assessments", tags=["assessments"])


@router.get("", response_model=List[AssessmentResponse])
def list_assessments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AssessmentService(db)
    return service.list_active()


@router.get("/attempts/{attempt_id}/review", response_model=List[AssessmentQuestionReviewItem])
def review_assessment_attempt(
    attempt_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Full question review (answer key included) for a COMPLETED attempt.

    Gated on ownership + completion so the correct answers stay hidden while
    the quiz is being taken.
    """
    service = AssessmentService(db)
    return service.review_attempt(attempt_id, current_user.id)


@router.get("/attempts", response_model=List[AssessmentAttemptResponse])
def list_assessment_attempts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AssessmentService(db)
    attempts = (
        db.query(AssessmentAttempt)
        .filter(AssessmentAttempt.user_id == current_user.id)
        .order_by(AssessmentAttempt.created_at.desc())
        .all()
    )
    return [AssessmentAttemptResponse.model_validate(a) for a in attempts]


@router.get("/{assessment_id}", response_model=AssessmentResponse)
def get_assessment(
    assessment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AssessmentService(db)
    return service.get(assessment_id)


@router.get("/{assessment_id}/questions", response_model=List[AssessmentQuestionResponse])
def list_assessment_questions(
    assessment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AssessmentService(db)
    return service.list_questions(assessment_id)


@router.post("/attempts", response_model=AssessmentAttemptResponse, status_code=status.HTTP_201_CREATED)
def create_assessment_attempt(
    payload: AssessmentAttemptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AssessmentService(db)
    return service.create_attempt(current_user.id, payload.assessment_id)


@router.get("/attempts/{attempt_id}", response_model=AssessmentAttemptResponse)
def get_assessment_attempt(
    attempt_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AssessmentService(db)
    return service.get_attempt(attempt_id, current_user.id)


@router.put("/attempts/{attempt_id}", response_model=AssessmentAttemptResponse)
def update_assessment_attempt(
    attempt_id: str,
    payload: AssessmentAttemptUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AssessmentService(db)
    return service.update_attempt(attempt_id, current_user.id, payload)


@router.post("/attempts/{attempt_id}/complete", response_model=AssessmentAttemptResponse)
def complete_assessment_attempt(
    attempt_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AssessmentService(db)
    return service.complete_attempt(attempt_id, current_user.id)


@router.get("/attempts/{attempt_id}/answers", response_model=List[AssessmentAnswerResponse])
def list_assessment_answers(
    attempt_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AssessmentService(db)
    return service.list_answers(attempt_id, current_user.id)


@router.post("/answers", response_model=AssessmentAnswerResponse, status_code=status.HTTP_201_CREATED)
def save_assessment_answer(
    payload: AssessmentAnswerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Store one answer for the caller's OWN attempt.

    The attempt is loaded and ownership-verified in the service, and
    correctness/points are always computed server-side — never taken from the
    request body.
    """
    service = AssessmentService(db)
    return service.save_answer(
        payload.attempt_id, payload.question_id, payload, current_user.id
    )
