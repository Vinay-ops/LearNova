from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class CaseBase(BaseModel):
    title: str
    company: str
    case_type: str = "Profitability"
    difficulty: str = "Medium"
    duration_minutes: int = 25
    description: Optional[str] = None
    prompt: Optional[str] = None
    background: Optional[str] = None
    skills: List[str] = Field(default_factory=list)


class CaseCreate(CaseBase):
    pass


class CaseUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    case_type: Optional[str] = None
    difficulty: Optional[str] = None
    duration_minutes: Optional[int] = None
    description: Optional[str] = None
    prompt: Optional[str] = None
    background: Optional[str] = None
    skills: Optional[List[str]] = None
    is_active: Optional[bool] = None


class CaseResponse(CaseBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    is_active: bool = True
    is_ai_generated: bool = False
    created_at: datetime
    updated_at: datetime


class CaseQuestionBase(BaseModel):
    question_type: str = "structuring"
    question_text: str
    model_answer: Optional[str] = None
    display_order: int = 0
    time_limit_seconds: Optional[int] = None
    rubric: Optional[str] = None


class CaseQuestionCreate(CaseQuestionBase):
    case_id: str


class CaseQuestionUpdate(BaseModel):
    question_type: Optional[str] = None
    question_text: Optional[str] = None
    model_answer: Optional[str] = None
    display_order: Optional[int] = None
    time_limit_seconds: Optional[int] = None
    rubric: Optional[str] = None


class CaseQuestionResponse(CaseQuestionBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    created_at: datetime
    updated_at: datetime


class CaseAttemptBase(BaseModel):
    user_id: str
    case_id: str


class CaseAttemptCreate(BaseModel):
    case_id: str


class CaseAttemptUpdate(BaseModel):
    status: Optional[str] = None
    current_question_index: Optional[int] = None
    completed_at: Optional[datetime] = None
    elapsed_seconds: Optional[int] = None
    overall_score: Optional[int] = None
    structuring_score: Optional[int] = None
    quantitative_score: Optional[int] = None
    business_judgment_score: Optional[int] = None
    communication_score: Optional[int] = None
    synthesis_score: Optional[int] = None
    ai_feedback: Optional[str] = None
    strengths: Optional[List[str]] = None
    weaknesses: Optional[List[str]] = None
    recommendations: Optional[str] = None


class CaseAttemptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    case_id: str
    status: str
    current_question_index: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    elapsed_seconds: int
    overall_score: Optional[int] = None
    structuring_score: Optional[int] = None
    quantitative_score: Optional[int] = None
    business_judgment_score: Optional[int] = None
    communication_score: Optional[int] = None
    synthesis_score: Optional[int] = None
    ai_feedback: Optional[str] = None
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    recommendations: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CaseAnswerBase(BaseModel):
    attempt_id: str
    question_id: str
    answer_text: Optional[str] = None
    score: Optional[int] = None
    ai_feedback: Optional[str] = None
    duration_seconds: Optional[int] = None


class CaseAnswerCreate(CaseAnswerBase):
    pass


class CaseAnswerResponse(CaseAnswerBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime
