from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from .ai import ResumeData


class ResumeSaveRequest(BaseModel):
    """Save an already-structured resume (parsed on the client or stateless API)."""

    filename: str = Field(default="resume", max_length=200)
    source_type: str = "parsed"
    role: str | None = Field(default=None, max_length=80)
    resume: ResumeData


class ResumeUpdateRequest(BaseModel):
    """Replace the structured data and/or display filename of a saved resume."""

    filename: str | None = Field(default=None, max_length=200)
    role: str | None = Field(default=None, max_length=80)
    resume: ResumeData | None = None


class ResumeRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    filename: str
    source_type: str | None = None
    role: str | None = None
    data: dict
    created_at: datetime
    updated_at: datetime
