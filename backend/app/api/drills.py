from typing import List

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from ..core.security import get_current_user, get_db
from ..models.user import User
from ..schemas.drill import (
    DrillResponse,
    DrillAttemptCreate,
    DrillAttemptUpdate,
    DrillAttemptResponse,
)
from ..services.drill_service import DrillService

router = APIRouter(prefix="/api/drills", tags=["drills"])


@router.get("", response_model=List[DrillResponse])
def list_drills(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DrillService(db)
    return service.list_active()


@router.get("/{drill_id}", response_model=DrillResponse)
def get_drill(
    drill_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DrillService(db)
    return service.get(drill_id)


@router.get("/attempts", response_model=List[DrillAttemptResponse])
def list_drill_attempts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DrillService(db)
    return service.list_attempts(current_user.id)


@router.post("/attempts", response_model=DrillAttemptResponse, status_code=status.HTTP_201_CREATED)
def create_drill_attempt(
    payload: DrillAttemptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DrillService(db)
    return service.create_attempt(current_user.id, payload.drill_id)


@router.put("/attempts/{attempt_id}", response_model=DrillAttemptResponse)
def update_drill_attempt(
    attempt_id: str,
    payload: DrillAttemptUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DrillService(db)
    return service.save_attempt(attempt_id, current_user.id, payload.model_dump(exclude_unset=True))
