from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..core.rate_limit import enforce_ai_rate_limit
from ..core.security import get_current_user, get_db
from ..models.ai_session import AIMessage, AISession
from ..models.user import User
from ..schemas.learning import (
    LearningChatRequest,
    LearningChatResponse,
    LearningMessageResponse,
    LearningSessionCreate,
    LearningSessionResponse,
)
from ..services.learning_service import LearningService

router = APIRouter(prefix="/api/learning", tags=["learning"])


def _session_response(session: AISession) -> LearningSessionResponse:
    metadata = session.metadata_ or {}
    return LearningSessionResponse(
        id=session.id,
        user_id=session.user_id,
        session_type=session.session_type,
        topic=metadata.get("topic"),
        learner_level=metadata.get("learner_level") or "Beginner",
        status=session.status,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


def _message_response(msg: AIMessage) -> LearningMessageResponse:
    return LearningMessageResponse(
        id=msg.id,
        session_id=msg.session_id,
        role=msg.role,
        content=msg.content,
        created_at=msg.created_at,
    )


@router.post("/sessions", response_model=LearningSessionResponse, status_code=status.HTTP_201_CREATED)
def create_learning_session(
    payload: LearningSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LearningService(db)
    session = service.create_session(current_user.id, payload.topic, payload.learner_level)
    return _session_response(session)


@router.get("/sessions", response_model=List[LearningSessionResponse])
def list_learning_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LearningService(db)
    return [_session_response(s) for s in service.list_sessions(current_user.id)]


@router.get("/sessions/{session_id}", response_model=LearningSessionResponse)
def get_learning_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LearningService(db)
    return _session_response(service.get_session(session_id, current_user.id))


@router.get("/sessions/{session_id}/messages", response_model=List[LearningMessageResponse])
def list_learning_messages(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LearningService(db)
    return [_message_response(m) for m in service.list_messages(session_id, current_user.id)]


@router.post("/sessions/{session_id}/messages", response_model=LearningChatResponse)
def send_learning_message(
    session_id: str,
    payload: LearningChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LearningService(db)
    enforce_ai_rate_limit("learning_chat", current_user.id)
    return service.chat(session_id, current_user.id, payload.content)
