from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class DrillBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "Structuring"
    difficulty: str = "Medium"
    duration_minutes: int = 10
    total_questions: int = 0
    skills: List[str] = Field(default_factory=list)


class DrillCreate(DrillBase):
    pass


class DrillUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    duration_minutes: Optional[int] = None
    total_questions: Optional[int] = None
    skills: Optional[List[str]] = None
    is_active: Optional[bool] = None


class DrillResponse(DrillBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    is_active: bool = True
    is_ai_generated: bool = False
    created_at: datetime
    updated_at: datetime


class DrillQuestionBase(BaseModel):
    question_type: str = "mcq"
    question_text: str
    options: Optional[Any] = None
    correct_option_index: Optional[int] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    display_order: int = 0
    time_limit_seconds: Optional[int] = None
    difficulty: str = "Medium"


class DrillQuestionCreate(DrillQuestionBase):
    drill_id: str


class DrillQuestionResponse(DrillQuestionBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    drill_id: str
    created_at: datetime
    updated_at: datetime


class DrillAttemptCreate(BaseModel):
    drill_id: str


class DrillAttemptUpdate(BaseModel):
    status: Optional[str] = None
    completed_at: Optional[datetime] = None
    total_questions: Optional[int] = None
    correct_count: Optional[int] = None
    score: Optional[int] = None
    time_spent_seconds: Optional[int] = None


class DrillAttemptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    drill_id: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    total_questions: int
    correct_count: int
    score: Optional[int] = None
    time_spent_seconds: int
    created_at: datetime
    updated_at: datetime
