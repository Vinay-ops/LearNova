from typing import List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# LLM draft output (first validation gate — pydantic shape)
# ---------------------------------------------------------------------------


class QuizQuestionDraft(BaseModel):
    question: str = Field(min_length=8)
    question_type: str = "mcq"
    options: List[str]
    correct_index: int
    explanation: str = Field(min_length=8)
    difficulty: str = "Medium"
    subtopic: str = Field(min_length=1)


class QuizQuestionsDraft(BaseModel):
    questions: List[QuizQuestionDraft]


# ---------------------------------------------------------------------------
# API request/response
# ---------------------------------------------------------------------------


class QuizGenerateRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=120)
    difficulty: str = Field(default="Medium", description="Easy | Medium | Hard")
    question_count: int = Field(default=5, ge=3, le=10)
    focus_subtopics: Optional[List[str]] = Field(
        default=None,
        description="When set (e.g. weak areas from a prior attempt), most questions target these subtopics",
    )


class QuizGenerateResponse(BaseModel):
    assessment_id: str
    title: str
    topic: str
    difficulty: str
    question_count: int


class QuizSubtopicPerformance(BaseModel):
    subtopic: str
    total: int
    correct: int
    percent: int
    status: str  # "strong" | "needs_practice"


class QuizAnalysisResponse(BaseModel):
    assessment_id: str
    attempt_id: str
    score: float
    correct_count: int
    total_questions: int
    unanswered: int
    per_subtopic: List[QuizSubtopicPerformance] = Field(default_factory=list)
    strong_subtopics: List[str] = Field(default_factory=list)
    weak_subtopics: List[str] = Field(default_factory=list)
