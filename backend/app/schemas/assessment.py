from datetime import datetime
from decimal import Decimal
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class AssessmentBase(BaseModel):
    title: str
    category: str
    description: Optional[str] = None
    difficulty: str = "Medium"
    total_questions: int = 0
    time_limit_minutes: int = 25
    skills: List[str] = Field(default_factory=list)


class AssessmentCreate(AssessmentBase):
    pass


class AssessmentUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[str] = None
    total_questions: Optional[int] = None
    time_limit_minutes: Optional[int] = None
    skills: Optional[List[str]] = None
    is_active: Optional[bool] = None


class AssessmentResponse(AssessmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


class AssessmentQuestionBase(BaseModel):
    question_type: str = "mcq"
    question_text: str
    options: Optional[Any] = None
    correct_option_index: Optional[int] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    display_order: int = 0
    points: int = 1
    difficulty: str = "Medium"
    skill_tag: Optional[str] = None


class AssessmentQuestionCreate(AssessmentQuestionBase):
    assessment_id: str


class AssessmentQuestionUpdate(BaseModel):
    question_type: Optional[str] = None
    question_text: Optional[str] = None
    options: Optional[Any] = None
    correct_option_index: Optional[int] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    display_order: Optional[int] = None
    points: Optional[int] = None
    difficulty: Optional[str] = None
    skill_tag: Optional[str] = None


class AssessmentQuestionResponse(AssessmentQuestionBase):
    """Question as served during ACTIVE quiz taking.

    The answer key fields (correct_option_index, correct_answer, explanation)
    are intentionally nulled by the service for this representation so the
    client can never see them before the attempt is completed.
    """

    model_config = ConfigDict(from_attributes=True)

    id: str
    assessment_id: str
    created_at: datetime
    updated_at: datetime


class AssessmentQuestionReviewItem(BaseModel):
    """Per-question review row for a COMPLETED, owned attempt.

    Only returned by GET /api/assessments/attempts/{id}/review, which the
    service gates on attempt.status == completed and user ownership.
    Includes the answer key + explanation plus the user's own answer.
    """

    model_config = ConfigDict(from_attributes=True)

    question_id: str
    assessment_id: str
    question_type: str = "mcq"
    question_text: str
    options: Optional[Any] = None
    correct_option_index: Optional[int] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    display_order: int = 0
    points: int = 1
    difficulty: str = "Medium"
    skill_tag: Optional[str] = None
    # attempt-specific
    selected_option_index: Optional[int] = None
    free_text_answer: Optional[str] = None
    is_correct: Optional[bool] = None
    answered: bool = False


class AssessmentAttemptCreate(BaseModel):
    assessment_id: str


class AssessmentAttemptUpdate(BaseModel):
    status: Optional[str] = None
    completed_at: Optional[datetime] = None
    time_spent_seconds: Optional[int] = None
    total_questions: Optional[int] = None
    correct_count: Optional[int] = None
    score: Optional[Decimal] = None
    percentile: Optional[Decimal] = None


class AssessmentAttemptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    assessment_id: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    time_spent_seconds: int
    total_questions: int
    correct_count: int
    score: Optional[Decimal] = None
    percentile: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime


class AssessmentAnswerCreate(BaseModel):
    attempt_id: str
    question_id: str
    selected_option_index: Optional[int] = None
    free_text_answer: Optional[str] = None
    is_correct: Optional[bool] = None
    points_earned: int = 0
    time_spent_seconds: Optional[int] = None


class AssessmentAnswerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    attempt_id: str
    question_id: str
    selected_option_index: Optional[int] = None
    free_text_answer: Optional[str] = None
    is_correct: Optional[bool] = None
    points_earned: int
    time_spent_seconds: Optional[int] = None
    created_at: datetime
    updated_at: datetime
