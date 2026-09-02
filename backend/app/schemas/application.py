from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ApplicationBase(BaseModel):
    company: str
    role: str
    deadline: Optional[date] = None
    stage: str = "Preparing"
    preparation: int = 0
    notes: Optional[str] = None


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    deadline: Optional[date] = None
    stage: Optional[str] = None
    preparation: Optional[int] = None
    notes: Optional[str] = None


class ApplicationResponse(ApplicationBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
