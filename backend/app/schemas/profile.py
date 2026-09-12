from datetime import datetime
from typing import List, Optional, Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


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

    @field_validator("full_name", mode="before")
    @classmethod
    def _coerce_full_name(cls, v: Any) -> str:
        if v is None:
            return "User"
        s = str(v).strip()
        return s if s else "User"

    @field_validator("target_firms", mode="before")
    @classmethod
    def _coerce_target_firms(cls, v: Any) -> List[str]:
        if v is None:
            return []
        if isinstance(v, list):
            return [str(x) for x in v if x is not None]
        return []

    @field_validator("readiness_score", mode="before")
    @classmethod
    def _coerce_readiness_score(cls, v: Any) -> int:
        if v is None:
            return 0
        try:
            i = int(v)
        except (TypeError, ValueError):
            return 0
        return max(0, min(100, i))

    @field_validator("id", "user_id", mode="before")
    @classmethod
    def _coerce_id_str(cls, v: Any) -> str:
        return str(v) if v is not None else ""


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    avatar_url: Optional[str] = None
    experience_level: Optional[str] = None
    target_firms: Optional[List[str]] = None
    interview_date: Optional[datetime] = None
