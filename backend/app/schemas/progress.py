from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ReadinessEntry(BaseModel):
    date: str
    score: int


class SkillScoreBreakdown(BaseModel):
    skill: str
    score: int
    previous_score: Optional[int] = None
    trend: str = "flat"
    color: Optional[str] = None
    evidence: Optional[str] = None


class ProgressSummary(BaseModel):
    user_id: str
    readiness_score: int
    previous_readiness_score: Optional[int] = None
    streak_days: int = 0
    total_cases_completed: int = 0
    total_assessments_completed: int = 0
    total_drills_completed: int = 0
    total_practice_minutes: int = 0
    average_score: float = 0.0
    best_score: Optional[int] = None
    skill_scores: List[SkillScoreBreakdown] = Field(default_factory=list)
    # Named readiness_over_time to match the frontend contract (mocks included).
    # Holds ONLY real measurements — it is never filled with synthetic points.
    readiness_over_time: List[ReadinessEntry] = Field(default_factory=list)


class SkillScoreCreate(BaseModel):
    skill_id: str
    current_score: int
    previous_score: Optional[int] = None
    trend: str = "flat"


class SkillScoreResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    skill_id: str
    current_score: int
    previous_score: Optional[int] = None
    trend: str
    total_practice_minutes: int = 0
    last_practiced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
