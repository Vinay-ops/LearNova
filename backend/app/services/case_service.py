from typing import Any, List, Optional

from sqlalchemy.orm import Session

from ..core.exceptions import AuthorizationError, NotFoundError
from ..models.case import Case, CaseQuestion, CaseAttempt, CaseAnswer
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
from ..utils.enums import AttemptStatus
from ..utils.helpers import update_model_fields


class CaseService:
    def __init__(self, db: Session):
        self.db = db

    def list_active(self) -> List[CaseResponse]:
        cases = (
            self.db.query(Case)
            .filter(Case.is_active.is_(True))
            .order_by(Case.created_at.desc())
            .all()
        )
        return [CaseResponse.model_validate(c) for c in cases]

    def get(self, case_id: str) -> CaseResponse:
        case = self.db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise NotFoundError("Case")
        return CaseResponse.model_validate(case)

    def get_with_questions(self, case_id: str) -> Case:
        case = self.db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise NotFoundError("Case")
        return case

    def create_attempt(self, user_id: str, case_id: str) -> CaseAttemptResponse:
        case = self.db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise NotFoundError("Case")

        attempt = CaseAttempt(
            user_id=user_id,
            case_id=case_id,
            status=AttemptStatus.IN_PROGRESS.value,
            current_question_index=0,
            elapsed_seconds=0,
            strengths=[],
            weaknesses=[],
        )
        self.db.add(attempt)
        self.db.commit()
        self.db.refresh(attempt)
        return CaseAttemptResponse.model_validate(attempt)

    def get_attempt(self, attempt_id: str, user_id: str) -> CaseAttemptResponse:
        attempt = self.db.query(CaseAttempt).filter(CaseAttempt.id == attempt_id).first()
        if not attempt:
            raise NotFoundError("Case attempt")
        if str(attempt.user_id) != str(user_id):
            raise AuthorizationError()
        return CaseAttemptResponse.model_validate(attempt)

    # Scoring/evaluation fields that only the server-side AI evaluation may
    # write. Client-supplied values are ignored so fake scores can never be
    # persisted (the evaluation endpoint is the single authoritative writer).
    _EVALUATION_OWNED_FIELDS = {
        "overall_score",
        "structuring_score",
        "quantitative_score",
        "business_judgment_score",
        "communication_score",
        "synthesis_score",
        "ai_feedback",
        "strengths",
        "weaknesses",
        "recommendations",
        "evaluated_by_prompt_id",
    }

    def update_attempt(
        self, attempt_id: str, user_id: str, payload: CaseAttemptUpdate
    ) -> CaseAttemptResponse:
        attempt = self.db.query(CaseAttempt).filter(CaseAttempt.id == attempt_id).first()
        if not attempt:
            raise NotFoundError("Case attempt")
        if str(attempt.user_id) != str(user_id):
            raise AuthorizationError()

        data = payload.model_dump(exclude_unset=True)
        # Never let the client write evaluation-owned fields.
        for field in self._EVALUATION_OWNED_FIELDS:
            data.pop(field, None)
        update_model_fields(attempt, data)
        self.db.commit()
        self.db.refresh(attempt)
        return CaseAttemptResponse.model_validate(attempt)

    def save_answer(
        self, attempt_id: str, question_id: str, payload: CaseAnswerCreate, user_id: str
    ) -> CaseAnswerResponse:
        attempt = self.db.query(CaseAttempt).filter(CaseAttempt.id == attempt_id).first()
        if not attempt:
            raise NotFoundError("Case attempt")
        if str(attempt.user_id) != str(user_id):
            raise AuthorizationError()

        question = (
            self.db.query(CaseQuestion)
            .filter(CaseQuestion.id == question_id)
            .first()
        )
        if not question:
            raise NotFoundError("Case question")

        existing = (
            self.db.query(CaseAnswer)
            .filter(
                CaseAnswer.attempt_id == attempt_id,
                CaseAnswer.question_id == question_id,
            )
            .first()
        )

        # The AI evaluation owns score/ai_feedback — client-supplied values are
        # never persisted. Answers are stored as raw text only.
        if existing:
            data = payload.model_dump(exclude_unset=True)
            data.pop("score", None)
            data.pop("ai_feedback", None)
            update_model_fields(existing, data)
            self.db.commit()
            self.db.refresh(existing)
            return CaseAnswerResponse.model_validate(existing)

        answer = CaseAnswer(
            attempt_id=attempt_id,
            question_id=question_id,
            answer_text=payload.answer_text,
            score=None,
            ai_feedback=None,
            duration_seconds=payload.duration_seconds,
        )
        self.db.add(answer)
        self.db.commit()
        self.db.refresh(answer)
        return CaseAnswerResponse.model_validate(answer)

    def complete_attempt(self, attempt_id: str, user_id: str) -> CaseAttemptResponse:
        attempt = self.db.query(CaseAttempt).filter(CaseAttempt.id == attempt_id).first()
        if not attempt:
            raise NotFoundError("Case attempt")
        if str(attempt.user_id) != str(user_id):
            raise AuthorizationError()

        attempt.status = AttemptStatus.COMPLETED.value
        attempt.completed_at = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
        self.db.commit()
        self.db.refresh(attempt)
        return CaseAttemptResponse.model_validate(attempt)

    def list_questions(self, case_id: str) -> List[CaseQuestionResponse]:
        questions = (
            self.db.query(CaseQuestion)
            .filter(CaseQuestion.case_id == case_id)
            .order_by(CaseQuestion.display_order.asc())
            .all()
        )
        return [CaseQuestionResponse.model_validate(q) for q in questions]

    def list_answers(self, attempt_id: str, user_id: str) -> List[CaseAnswerResponse]:
        attempt = self.db.query(CaseAttempt).filter(CaseAttempt.id == attempt_id).first()
        if not attempt:
            raise NotFoundError("Case attempt")
        if str(attempt.user_id) != str(user_id):
            raise AuthorizationError()

        answers = (
            self.db.query(CaseAnswer)
            .filter(CaseAnswer.attempt_id == attempt_id)
            .order_by(CaseAnswer.created_at.asc())
            .all()
        )
        return [CaseAnswerResponse.model_validate(a) for a in answers]
