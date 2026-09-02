from typing import List, Optional

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from ..core.security import get_current_user, get_db
from ..models.user import User
from ..schemas.ai import (
    AIMessageCreate,
    AIMessageResponse,
    AISessionCreate,
    AISessionUpdate,
    AISessionResponse,
    AIChatRequest,
    AIChatResponse,
    AIEvaluationRequest,
    AIEvaluationResponse,
    AIFeedbackRequest,
    AIFeedbackResponse,
    AIRecommendationRequest,
    AIRecommendationResponse,
)

router = APIRouter(prefix="/api/ai", tags=["ai"])

_PHASE_7_MSG = "AI case interviewer integration is scheduled for Phase 7."
_PHASE_8_MSG = "AI evaluation/feedback integration is scheduled for Phase 8."
_PHASE_9_MSG = "AI recommendations integration is scheduled for Phase 9."


@router.post("/sessions", response_model=AISessionResponse, status_code=status.HTTP_201_CREATED)
def create_ai_session(
    payload: AISessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    raise HTTPException(status_code=501, detail=_PHASE_7_MSG)


@router.get("/sessions", response_model=List[AISessionResponse])
def list_ai_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    raise HTTPException(status_code=501, detail=_PHASE_7_MSG)


@router.get("/sessions/{session_id}", response_model=AISessionResponse)
def get_ai_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    raise HTTPException(status_code=501, detail=_PHASE_7_MSG)


@router.put("/sessions/{session_id}", response_model=AISessionResponse)
def update_ai_session(
    session_id: str,
    payload: AISessionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    raise HTTPException(status_code=501, detail=_PHASE_7_MSG)


@router.get("/sessions/{session_id}/messages", response_model=List[AIMessageResponse])
def list_ai_messages(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    raise HTTPException(status_code=501, detail=_PHASE_7_MSG)


@router.post("/sessions/{session_id}/messages", response_model=AIMessageResponse, status_code=status.HTTP_201_CREATED)
def create_ai_message(
    session_id: str,
    payload: AIMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    raise HTTPException(status_code=501, detail=_PHASE_7_MSG)


@router.post("/interview/chat", response_model=AIChatResponse)
def ai_case_chat(
    payload: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    raise HTTPException(status_code=501, detail=_PHASE_7_MSG)


@router.post("/evaluation", response_model=AIEvaluationResponse)
def ai_evaluate_case(
    payload: AIEvaluationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    raise HTTPException(status_code=501, detail=_PHASE_8_MSG)


@router.post("/feedback", response_model=AIFeedbackResponse)
def ai_generate_feedback(
    payload: AIFeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    raise HTTPException(status_code=501, detail=_PHASE_8_MSG)


@router.post("/recommendations", response_model=AIRecommendationResponse)
def ai_generate_recommendations(
    payload: AIRecommendationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    raise HTTPException(status_code=501, detail=_PHASE_9_MSG)
