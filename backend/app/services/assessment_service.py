from typing import Any, List, Optional
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from ..core.exceptions import AuthorizationError, NotFoundError
from ..models.assessment import Assessment, AssessmentQuestion, AssessmentAttempt, AssessmentAnswer
from ..models.user import User
from ..schemas.assessment import (
    AssessmentResponse,
    AssessmentQuestionResponse,
    AssessmentAttemptCreate,
    AssessmentAttemptUpdate,
    AssessmentAttemptResponse,
    AssessmentAnswerCreate,
    AssessmentAnswerResponse,
)
from ..utils.enums import AttemptStatus
from ..utils.helpers import update_model_fields


class AssessmentService:
    def __init__(self, db: Session):
        self.db = db

    def list_active(self) -> List[AssessmentResponse]:
        assessments = (
            self.db.query(Assessment)
            .filter(Assessment.is_active.is_(True))
            .order_by(Assessment.created_at.desc())
            .all()
        )
        return [AssessmentResponse.model_validate(a) for a in assessments]

    def get(self, assessment_id: str) -> AssessmentResponse:
        assessment = self.db.query(Assessment).filter(Assessment.id == assessment_id).first()
        if not assessment:
            raise NotFoundError("Assessment")
        return AssessmentResponse.model_validate(assessment)

    def get_with_questions(self, assessment_id: str) -> Assessment:
        assessment = self.db.query(Assessment).filter(Assessment.id == assessment_id).first()
        if not assessment:
            raise NotFoundError("Assessment")
        return assessment

    def create_attempt(self, user_id: str, assessment_id: str) -> AssessmentAttemptResponse:
        assessment = self.db.query(Assessment).filter(Assessment.id == assessment_id).first()
        if not assessment:
            raise NotFoundError("Assessment")

        attempt = AssessmentAttempt(
            user_id=user_id,
            assessment_id=assessment_id,
            status=AttemptStatus.IN_PROGRESS.value,
            total_questions=assessment.total_questions,
            correct_count=0,
            time_spent_seconds=0,
        )
        self.db.add(attempt)
        self.db.commit()
        self.db.refresh(attempt)
        return AssessmentAttemptResponse.model_validate(attempt)

    def get_attempt(self, attempt_id: str, user_id: str) -> AssessmentAttemptResponse:
        attempt = self.db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
        if not attempt:
            raise NotFoundError("Assessment attempt")
        if str(attempt.user_id) != str(user_id):
            raise AuthorizationError()
        return AssessmentAttemptResponse.model_validate(attempt)

    def update_attempt(
        self, attempt_id: str, user_id: str, payload: AssessmentAttemptUpdate
    ) -> AssessmentAttemptResponse:
        attempt = self.db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
        if not attempt:
            raise NotFoundError("Assessment attempt")
        if str(attempt.user_id) != str(user_id):
            raise AuthorizationError()

        data = payload.model_dump(exclude_unset=True)
        update_model_fields(attempt, data)
        self.db.commit()
        self.db.refresh(attempt)
        return AssessmentAttemptResponse.model_validate(attempt)

    def save_answer(
        self, attempt_id: str, question_id: str, payload: AssessmentAnswerCreate
    ) -> AssessmentAnswerResponse:
        attempt = self.db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
        if not attempt:
            raise NotFoundError("Assessment attempt")

        question = (
            self.db.query(AssessmentQuestion)
            .filter(AssessmentQuestion.id == question_id)
            .first()
        )
        if not question:
            raise NotFoundError("Assessment question")

        existing = (
            self.db.query(AssessmentAnswer)
            .filter(
                AssessmentAnswer.attempt_id == attempt_id,
                AssessmentAnswer.question_id == question_id,
            )
            .first()
        )

        if existing:
            data = payload.model_dump(exclude_unset=True)
            update_model_fields(existing, data)
            self.db.commit()
            self.db.refresh(existing)
            return AssessmentAnswerResponse.model_validate(existing)

        answer = AssessmentAnswer(
            attempt_id=attempt_id,
            question_id=question_id,
            selected_option_index=payload.selected_option_index,
            free_text_answer=payload.free_text_answer,
            is_correct=payload.is_correct,
            points_earned=payload.points_earned or 0,
            time_spent_seconds=payload.time_spent_seconds,
        )
        self.db.add(answer)
        self.db.commit()
        self.db.refresh(answer)
        return AssessmentAnswerResponse.model_validate(answer)

    def complete_attempt(self, attempt_id: str, user_id: str) -> AssessmentAttemptResponse:
        attempt = self.db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
        if not attempt:
            raise NotFoundError("Assessment attempt")
        if str(attempt.user_id) != str(user_id):
            raise AuthorizationError()

        attempt.status = AttemptStatus.COMPLETED.value
        attempt.completed_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(attempt)
        return AssessmentAttemptResponse.model_validate(attempt)

    def list_questions(self, assessment_id: str) -> List[AssessmentQuestionResponse]:
        questions = (
            self.db.query(AssessmentQuestion)
            .filter(AssessmentQuestion.assessment_id == assessment_id)
            .order_by(AssessmentQuestion.display_order.asc())
            .all()
        )
        return [AssessmentQuestionResponse.model_validate(q) for q in questions]

    def list_answers(self, attempt_id: str, user_id: str) -> List[AssessmentAnswerResponse]:
        attempt = self.db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
        if not attempt:
            raise NotFoundError("Assessment attempt")
        if str(attempt.user_id) != str(user_id):
            raise AuthorizationError()

        answers = (
            self.db.query(AssessmentAnswer)
            .filter(AssessmentAnswer.attempt_id == attempt_id)
            .order_by(AssessmentAnswer.created_at.asc())
            .all()
        )
        return [AssessmentAnswerResponse.model_validate(a) for a in answers]
