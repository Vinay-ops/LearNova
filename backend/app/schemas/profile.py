from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    full_name: str
    avatar_url: Optional[str] = None
    experience_level: Optional[str] = None
    target_firms: List[str] = Field(default_factory=list)
    interview_date: Optional[datetime] = None
    readiness_score: int = 0
    created_at: datetime
    updated_at: datetime


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    avatar_url: Optional[str] = None
    experience_level: Optional[str] = None
    target_firms: Optional[List[str]] = None
    interview_date: Optional[datetime] = None
