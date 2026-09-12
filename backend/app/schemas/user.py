from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, ConfigDict, field_validator


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    is_active: bool
    created_at: datetime

    @field_validator("id", mode="before")
    @classmethod
    def _coerce_id(cls, v: Any) -> str:
        return str(v) if v is not None else ""

    @field_validator("is_active", mode="before")
    @classmethod
    def _coerce_is_active(cls, v: Any) -> bool:
        if v is None:
            return True
        return bool(v)

    @field_validator("created_at", mode="before")
    @classmethod
    def _coerce_created_at(cls, v: Any) -> datetime:
        if v is None:
            return datetime.now()
        return v
