from __future__ import annotations

import time
from typing import List, Optional

from sqlalchemy.orm import Session

from ..ai import bootstrap_prompts, get_llm_client
from ..ai.client import LLMClientProtocol, LLMResponse
from ..ai.prompts.base import prompt_registry
from ..core.exceptions import AuthorizationError, NotFoundError, ValidationError
from ..core.logging import log_ai_request
from ..models.ai_session import AIMessage, AISession
from ..utils.enums import AIRole, AISessionType


class LearningService:
    """General learning chatbot: persistent tutor sessions per topic.

    Reuses the ai_sessions / ai_messages tables (session_type = 'learning',
    topic carried in metadata_) so the platform has ONE AI session/message
    system shared by learning and interviews.
    """

    def __init__(self, db: Session, client: Optional[LLMClientProtocol] = None):
        self.db = db
        self.client = client or get_llm_client()

    # -- helpers ----------------------------------------------------------

    def _get_owned_session(self, session_id: str, user_id: str) -> AISession:
        session = (
            self.db.query(AISession)
            .filter(AISession.id == session_id)
            .first()
        )
        if not session:
            raise NotFoundError("Learning session")
        if str(session.user_id) != str(user_id):
            raise AuthorizationError()
        if session.session_type != AISessionType.LEARNING.value:
            raise NotFoundError("Learning session")
        return session

    @staticmethod
    def _normalize_level(level: Optional[str]) -> str:
        level = (level or "Beginner").strip().title()
        if level not in {"Beginner", "Intermediate", "Advanced"}:
            raise ValidationError("learner_level must be Beginner, Intermediate or Advanced")
        return level

    # -- session management ----------------------------------------------

    def create_session(
        self,
        user_id: str,
        topic: str,
        learner_level: Optional[str] = None,
    ) -> AISession:
        topic = (topic or "").strip()
        if len(topic) < 2:
            raise ValidationError("Please enter a topic to learn (at least 2 characters)")
        if len(topic) > 120:
            raise ValidationError("Topic is too long (max 120 characters)")
        level = self._normalize_level(learner_level)

        session = AISession(
            user_id=user_id,
            session_type=AISessionType.LEARNING.value,
            status="active",
            metadata_={
                "topic": topic,
                "learner_level": level,
            },
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def list_sessions(self, user_id: str) -> List[AISession]:
        return (
            self.db.query(AISession)
            .filter(
                AISession.user_id == user_id,
                AISession.session_type == AISessionType.LEARNING.value,
            )
            .order_by(AISession.updated_at.desc())
            .all()
        )

    def get_session(self, session_id: str, user_id: str) -> AISession:
        return self._get_owned_session(session_id, user_id)

    def list_messages(self, session_id: str, user_id: str) -> List[AIMessage]:
        self._get_owned_session(session_id, user_id)
        return (
            self.db.query(AIMessage)
            .filter(AIMessage.session_id == session_id)
            .order_by(AIMessage.sequence_number.asc())
            .all()
        )

    # -- chat -------------------------------------------------------------

    def chat(self, session_id: str, user_id: str, content: str) -> dict:
        session = self._get_owned_session(session_id, user_id)
        content = (content or "").strip()
        if not content:
            raise ValidationError("Message cannot be empty")
        if len(content) > 4000:
            raise ValidationError("Message is too long (max 4000 characters)")

        metadata = session.metadata_ or {}
        topic = metadata.get("topic") or "the selected topic"
        learner_level = metadata.get("learner_level") or "Beginner"

        prior_messages = (
            self.db.query(AIMessage)
            .filter(AIMessage.session_id == session_id)
            .order_by(AIMessage.sequence_number.asc())
            .all()
        )
        next_seq = len(prior_messages)

        # Persist the learner's message first so a crash still records it.
        user_msg = AIMessage(
            session_id=session_id,
            role=AIRole.USER.value,
            content=content,
            sequence_number=next_seq,
        )
        self.db.add(user_msg)
        self.db.commit()

        history_lines = []
        for msg in prior_messages[-12:]:
            if msg.role == AIRole.USER.value:
                history_lines.append(f"LEARNER: {msg.content[:800]}")
            elif msg.role == AIRole.ASSISTANT.value:
                history_lines.append(f"TUTOR: {msg.content[:1500]}")
        history_text = "\n".join(history_lines) or "(conversation just started)"

        bootstrap_prompts()
        template = prompt_registry.get("learning_tutor", "v1")
        context = {
            "topic": topic,
            "learner_level": learner_level,
            "conversation_history": history_text,
            "user_message": content,
        }
        ok, errors = template.validate_context(context)
        if not ok:
            raise ValidationError(f"Prompt context invalid: {'; '.join(errors)}")

        system_prompt = template.render_system(context)
        user_prompt = template.render_user(context) or ""

        start = time.perf_counter()
        response: LLMResponse = self.client.chat(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            model=template.model or None,
            temperature=template.temperature,
            max_tokens=template.max_tokens,
        )
        latency_ms = int((time.perf_counter() - start) * 1000)

        reply = (response.content or "").strip()
        if not reply:
            raise ValidationError("The tutor returned an empty response — please try again.")

        assistant_msg = AIMessage(
            session_id=session_id,
            role=AIRole.ASSISTANT.value,
            content=reply,
            tokens_used=response.tokens_used,
            latency_ms=latency_ms,
            sequence_number=next_seq + 1,
        )
        self.db.add(assistant_msg)
        session.total_tokens = (session.total_tokens or 0) + (response.tokens_used or 0)
        session.total_latency_ms = (session.total_latency_ms or 0) + latency_ms
        self.db.commit()
        self.db.refresh(assistant_msg)

        log_ai_request(
            "learning_tutor_chat",
            prompt_name=template.name,
            prompt_version=template.version,
            model=response.model,
            latency_ms=latency_ms,
            tokens_used=response.tokens_used,
            success=True,
        )

        return {
            "session_id": session_id,
            "reply": reply,
            "message_id": assistant_msg.id,
            "role": AIRole.ASSISTANT.value,
        }
