from typing import Any, List, Optional
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from ..core.exceptions import AuthorizationError, NotFoundError, ValidationError
from ..models.assessment import Assessment, AssessmentQuestion, AssessmentAttempt, AssessmentAnswer
from ..models.user import User
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
from ..utils.enums import AttemptStatus, QuestionType
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
        self,
        attempt_id: str,
        question_id: str,
        payload: AssessmentAnswerCreate,
        user_id: str,
    ) -> AssessmentAnswerResponse:
        """Store one answer, strictly for the caller's OWN attempt.

        Ownership is enforced here (not just in the router) and correctness is
        ALWAYS derived server-side: the client's ``is_correct``/``points_earned``
        fields are ignored outright so a fake score can never be submitted.
        Non-MCQ answers stay ungraded (``is_correct = None``) until a server-side
        evaluator grades them.
        """
        attempt = self.db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
        if not attempt:
            raise NotFoundError("Assessment attempt")
        if str(attempt.user_id) != str(user_id):
            raise AuthorizationError()

        question = (
            self.db.query(AssessmentQuestion)
            .filter(AssessmentQuestion.id == question_id)
            .first()
        )
        if not question:
            raise NotFoundError("Assessment question")
        if str(question.assessment_id) != str(attempt.assessment_id):
            raise ValidationError("Question does not belong to this assessment")

        existing = (
            self.db.query(AssessmentAnswer)
            .filter(
                AssessmentAnswer.attempt_id == attempt_id,
                AssessmentAnswer.question_id == question_id,
            )
            .first()
        )

        # Server-authoritative grading for MCQ; everything else stays ungraded.
        if (
            payload.selected_option_index is not None
            and question.question_type == QuestionType.MCQ.value
        ):
            if question.correct_option_index is None:
                raise ValidationError("This question has no answer key")
            is_correct = payload.selected_option_index == question.correct_option_index
            points_earned = (question.points or 0) if is_correct else 0
        else:
            is_correct = None
            points_earned = 0

        if existing:
            existing.selected_option_index = payload.selected_option_index
            existing.free_text_answer = payload.free_text_answer
            existing.is_correct = is_correct
            existing.points_earned = points_earned
            if payload.time_spent_seconds is not None:
                existing.time_spent_seconds = payload.time_spent_seconds
            self.db.commit()
            self.db.refresh(existing)
            return AssessmentAnswerResponse.model_validate(existing)

        answer = AssessmentAnswer(
            attempt_id=attempt_id,
            question_id=question_id,
            selected_option_index=payload.selected_option_index,
            free_text_answer=payload.free_text_answer,
            is_correct=is_correct,
            points_earned=points_earned,
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

        # Score the attempt from stored answers (server-authoritative).
        # Unanswered questions count as incorrect (standard test semantics).
        answers = (
            self.db.query(AssessmentAnswer)
            .filter(AssessmentAnswer.attempt_id == attempt_id)
            .all()
        )
        answered = [a for a in answers if a.is_correct is not None]
        total_questions = (
            self.db.query(AssessmentQuestion)
            .filter(AssessmentQuestion.assessment_id == attempt.assessment_id)
            .count()
        )
        if not total_questions:
            total_questions = attempt.total_questions or len(answered)
        if answered:
            correct = sum(1 for a in answered if a.is_correct)
            attempt.correct_count = correct
            attempt.total_questions = total_questions
            attempt.score = round((correct / total_questions) * 100, 2)

        attempt.status = AttemptStatus.COMPLETED.value
        attempt.completed_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(attempt)
        return AssessmentAttemptResponse.model_validate(attempt)

    def list_questions(self, assessment_id: str) -> List[AssessmentQuestionResponse]:
        """Questions WITHOUT the answer key — safe to serve before/during an attempt.

        correct_option_index / correct_answer / explanation are stripped so a
        quiz taker can never trivially read the key from this endpoint. The
        full key is only revealed by review_attempt() once the attempt is
        completed.
        """
        questions = (
            self.db.query(AssessmentQuestion)
            .filter(AssessmentQuestion.assessment_id == assessment_id)
            .order_by(AssessmentQuestion.display_order.asc())
            .all()
        )
        safe = []
        for q in questions:
            item = AssessmentQuestionResponse.model_validate(q)
            item.correct_option_index = None
            item.correct_answer = None
            item.explanation = None
            safe.append(item)
        return safe

    def review_attempt(
        self, attempt_id: str, user_id: str
    ) -> List[AssessmentQuestionReviewItem]:
        """Question-by-question review of a COMPLETED attempt (owned by user).

        This is the ONLY endpoint that reveals correct answers + explanations.
        It is gated on ownership AND completion, so the key is never exposed
        while the attempt is still in progress.
        """
        attempt = (
            self.db.query(AssessmentAttempt)
            .filter(AssessmentAttempt.id == attempt_id)
            .first()
        )
        if not attempt:
            raise NotFoundError("Assessment attempt")
        if str(attempt.user_id) != str(user_id):
            raise AuthorizationError()
        if attempt.status != AttemptStatus.COMPLETED.value:
            raise ValidationError(
                "Answers are revealed only after the attempt is completed"
            )

        questions = (
            self.db.query(AssessmentQuestion)
            .filter(AssessmentQuestion.assessment_id == attempt.assessment_id)
            .order_by(AssessmentQuestion.display_order.asc())
            .all()
        )
        answers = (
            self.db.query(AssessmentAnswer)
            .filter(AssessmentAnswer.attempt_id == attempt_id)
            .all()
        )
        answer_by_question = {a.question_id: a for a in answers}

        rows = []
        for q in questions:
            a = answer_by_question.get(q.id)
            answered = a is not None and a.is_correct is not None
            rows.append(
                AssessmentQuestionReviewItem(
                    question_id=q.id,
                    assessment_id=q.assessment_id,
                    question_type=q.question_type,
                    question_text=q.question_text,
                    options=q.options,
                    correct_option_index=q.correct_option_index,
                    correct_answer=q.correct_answer,
                    explanation=q.explanation,
                    display_order=q.display_order,
                    points=q.points,
                    difficulty=q.difficulty,
                    skill_tag=q.skill_tag,
                    selected_option_index=a.selected_option_index if a else None,
                    free_text_answer=a.free_text_answer if a else None,
                    is_correct=a.is_correct if a else None,
                    answered=answered,
                )
            )
        return rows

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
