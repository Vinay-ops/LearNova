from typing import List

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from ..core.security import get_current_user, get_db
from ..models.user import User
from ..schemas.case import (
    CaseResponse,
    CaseQuestionResponse,
    CaseAttemptCreate,
    CaseAttemptUpdate,
    CaseAttemptResponse,
    CaseAnswerCreate,
    CaseAnswerResponse,
)
from ..services.case_service import CaseService

router = APIRouter(prefix="/api/cases", tags=["cases"])


@router.get("", response_model=List[CaseResponse])
def list_cases(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CaseService(db)
    return service.list_active()


@router.get("/{case_id}", response_model=CaseResponse)
def get_case(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CaseService(db)
    return service.get(case_id)


@router.get("/{case_id}/questions", response_model=List[CaseQuestionResponse])
def list_case_questions(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CaseService(db)
    return service.list_questions(case_id)


@router.post("/attempts", response_model=CaseAttemptResponse, status_code=status.HTTP_201_CREATED)
def create_case_attempt(
    payload: CaseAttemptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CaseService(db)
    return service.create_attempt(current_user.id, payload.case_id)


@router.get("/attempts", response_model=List[CaseAttemptResponse])
def list_case_attempts(
    case_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CaseService(db)
    query = db.query(CaseAttempt).filter(CaseAttempt.user_id == current_user.id)
    if case_id:
        query = query.filter(CaseAttempt.case_id == case_id)
    attempts = query.order_by(CaseAttempt.created_at.desc()).all()
    return [CaseAttemptResponse.model_validate(a) for a in attempts]


@router.get("/attempts/{attempt_id}", response_model=CaseAttemptResponse)
def get_case_attempt(
    attempt_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CaseService(db)
    return service.get_attempt(attempt_id, current_user.id)


@router.put("/attempts/{attempt_id}", response_model=CaseAttemptResponse)
def update_case_attempt(
    attempt_id: str,
    payload: CaseAttemptUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CaseService(db)
    return service.update_attempt(attempt_id, current_user.id, payload)


@router.post("/attempts/{attempt_id}/complete", response_model=CaseAttemptResponse)
def complete_case_attempt(
    attempt_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CaseService(db)
    return service.complete_attempt(attempt_id, current_user.id)


@router.get("/attempts/{attempt_id}/answers", response_model=List[CaseAnswerResponse])
def list_case_answers(
    attempt_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CaseService(db)
    return service.list_answers(attempt_id, current_user.id)


@router.post("/answers", response_model=CaseAnswerResponse, status_code=status.HTTP_201_CREATED)
def save_case_answer(
    payload: CaseAnswerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CaseService(db)
    return service.save_answer(payload.attempt_id, payload.question_id, payload)
