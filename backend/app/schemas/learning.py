from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class LearningSessionCreate(BaseModel):
    topic: str = Field(min_length=1, max_length=120, description="Topic to learn")
    learner_level: str = Field(default="Beginner", description="Beginner | Intermediate | Advanced")


class LearningSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    session_type: str
    topic: Optional[str] = None
    learner_level: str = "Beginner"
    status: str = "active"
    created_at: datetime
    updated_at: datetime


class LearningMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: str
    role: str
    content: str
    created_at: datetime


class LearningChatRequest(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class LearningChatResponse(BaseModel):
    session_id: str
    reply: str
    message_id: str
    role: str = "assistant"
