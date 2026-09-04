from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class SkillBreakdown(BaseModel):
    skill: str
    score: int
    evidence: Optional[str] = None


class StructuredEvaluation(BaseModel):
    overall_score: int
    skills: List[SkillBreakdown] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)


class AIMessageCreate(BaseModel):
    session_id: str
    role: str
    content: str
    structured_output: Optional[Any] = None
    tokens_used: Optional[int] = None
    latency_ms: Optional[int] = None
    sequence_number: int = 0


class AIMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: str
    role: str
    content: str
    structured_output: Optional[Any] = None
    tokens_used: Optional[int] = None
    latency_ms: Optional[int] = None
    sequence_number: int
    created_at: datetime


class AISessionCreate(BaseModel):
    session_type: str = "case_interview"
    related_resource_id: Optional[str] = None
    related_resource_type: Optional[str] = None
    prompt_id: Optional[str] = None
    model_used: Optional[str] = None
    metadata_: Optional[Any] = None


class AISessionUpdate(BaseModel):
    status: Optional[str] = None
    ended_at: Optional[datetime] = None
    total_tokens: Optional[int] = None
    total_latency_ms: Optional[int] = None
    metadata_: Optional[Any] = None


class AISessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    session_type: str
    related_resource_id: Optional[str] = None
    related_resource_type: Optional[str] = None
    prompt_id: Optional[str] = None
    model_used: Optional[str] = None
    status: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    total_tokens: int
    total_latency_ms: int
    metadata_: Optional[Any] = None
    created_at: datetime
    updated_at: datetime


class AIChatRequest(BaseModel):
    session_id: Optional[str] = None
    case_id: Optional[str] = None
    case_attempt_id: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    message: str = ""
    conversation_history: Optional[List[dict[str, Any]]] = None


class AIChatResponse(BaseModel):
    session_id: str
    message: str
    next_question: Optional[Any] = None
    structured_output: Optional[Any] = None


class AIInterviewCompleteRequest(BaseModel):
    session_id: str


class AIEvaluationRequest(BaseModel):
    case_attempt_id: Optional[str] = None
    session_id: Optional[str] = None


class AIEvaluationResponse(BaseModel):
    case_attempt_id: Optional[str] = None
    evaluation: StructuredEvaluation
    ai_session_id: Optional[str] = None


class AIFeedbackRequest(BaseModel):
    case_id: Optional[str] = None
    attempt_id: Optional[str] = None
    session_id: Optional[str] = None


class AIFeedbackResponse(BaseModel):
    overall_score: int
    max_score: int = 100
    skill_breakdown: List[SkillBreakdown] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    biggest_opportunity: Optional[SkillBreakdown] = None
    better_approach: Optional[str] = None
    recommended_drill: Optional[dict[str, Any]] = None


class AIRecommendationRequest(BaseModel):
    session_id: Optional[str] = None


class AIRecommendationResponse(BaseModel):
    recommended_cases: List[dict[str, Any]] = Field(default_factory=list)
    recommended_drills: List[dict[str, Any]] = Field(default_factory=list)
    next_best_action: Optional[str] = None
    reasoning: Optional[str] = None


class FeedbackOpportunity(BaseModel):
    skill: str
    score: int
    feedback: Optional[str] = None


class FeedbackLLMResult(BaseModel):
    """Structured shape expected from the feedback_v1 prompt."""

    overall_score: int
    max_score: int = 100
    skill_breakdown: List[SkillBreakdown] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    biggest_opportunity: Optional[FeedbackOpportunity] = None
    better_approach: Optional[str] = None
    recommended_drill: Optional[dict[str, Any]] = None


class RecommendationsLLMResult(BaseModel):
    """Structured shape expected from the recommendations_v1 prompt."""

    recommended_cases: List[dict[str, Any]] = Field(default_factory=list)
    recommended_drills: List[dict[str, Any]] = Field(default_factory=list)
    next_best_action: Optional[str] = None
    reasoning: Optional[str] = None