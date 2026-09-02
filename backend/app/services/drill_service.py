from typing import Any, List, Optional
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from ..core.exceptions import NotFoundError
from ..models.drill import Drill, DrillAttempt
from ..models.user import User
from ..schemas.drill import (
    DrillResponse,
    DrillAttemptCreate,
    DrillAttemptUpdate,
    DrillAttemptResponse,
)
from ..utils.enums import AttemptStatus
from ..utils.helpers import update_model_fields


class DrillService:
    def __init__(self, db: Session):
        self.db = db

    def list_active(self) -> List[DrillResponse]:
        drills = (
            self.db.query(Drill)
            .filter(Drill.is_active.is_(True))
            .order_by(Drill.created_at.desc())
            .all()
        )
        return [DrillResponse.model_validate(d) for d in drills]

    def get(self, drill_id: str) -> DrillResponse:
        drill = self.db.query(Drill).filter(Drill.id == drill_id).first()
        if not drill:
            raise NotFoundError("Drill")
        return DrillResponse.model_validate(drill)

    def create_attempt(self, user_id: str, drill_id: str) -> DrillAttemptResponse:
        drill = self.db.query(Drill).filter(Drill.id == drill_id).first()
        if not drill:
            raise NotFoundError("Drill")

        attempt = DrillAttempt(
            user_id=user_id,
            drill_id=drill_id,
            status=AttemptStatus.IN_PROGRESS.value,
            total_questions=drill.total_questions,
            correct_count=0,
            time_spent_seconds=0,
        )
        self.db.add(attempt)
        self.db.commit()
        self.db.refresh(attempt)
        return DrillAttemptResponse.model_validate(attempt)

    def save_attempt(
        self, attempt_id: str, user_id: str, result: dict[str, Any]
    ) -> DrillAttemptResponse:
        attempt = self.db.query(DrillAttempt).filter(DrillAttempt.id == attempt_id).first()
        if not attempt:
            raise NotFoundError("Drill attempt")
        if str(attempt.user_id) != str(user_id):
            raise NotFoundError("Drill attempt")

        drill_id = attempt.drill_id
        existing = (
            self.db.query(DrillAttempt)
            .filter(
                DrillAttempt.user_id == user_id,
                DrillAttempt.drill_id == drill_id,
                DrillAttempt.status == AttemptStatus.IN_PROGRESS.value,
            )
            .first()
        )

        if existing and str(existing.id) == str(attempt_id):
            update_model_fields(existing, result)
            if result.get("status") == AttemptStatus.COMPLETED.value and not existing.completed_at:
                existing.completed_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(existing)
            return DrillAttemptResponse.model_validate(existing)

        update_model_fields(attempt, result)
        if result.get("status") == AttemptStatus.COMPLETED.value and not attempt.completed_at:
            attempt.completed_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(attempt)
        return DrillAttemptResponse.model_validate(attempt)

    def list_attempts(self, user_id: str) -> List[DrillAttemptResponse]:
        attempts = (
            self.db.query(DrillAttempt)
            .filter(DrillAttempt.user_id == user_id)
            .order_by(DrillAttempt.created_at.desc())
            .all()
        )
        return [DrillAttemptResponse.model_validate(a) for a in attempts]

    def get_attempt(self, attempt_id: str, user_id: str) -> DrillAttemptResponse:
        attempt = self.db.query(DrillAttempt).filter(DrillAttempt.id == attempt_id).first()
        if not attempt:
            raise NotFoundError("Drill attempt")
        if str(attempt.user_id) != str(user_id):
            raise NotFoundError("Drill attempt")
        return DrillAttemptResponse.model_validate(attempt)
