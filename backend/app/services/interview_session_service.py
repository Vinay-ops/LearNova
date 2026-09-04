from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any, List, Optional

from sqlalchemy.orm import Session

from ..ai.client import LLMClientProtocol, StubLLMClient, get_llm_client
from ..ai.interviewer import InterviewerService
from ..ai.prompts.base import prompt_registry
from ..core.exceptions import (
    AIError,
    AuthorizationError,
    NotFoundError,
    ValidationError,
)
from ..core.logging import log_ai_request
from ..models.ai_session import AIMessage, AISession
from ..models.case import Case, CaseQuestion
from ..models.profile import Profile
from ..schemas.ai import AISessionCreate, AISessionUpdate, StructuredEvaluation
from ..utils.enums import AIRole, AISessionType
from .case_evaluation_service import canonical_skill_name, run_case_evaluation


class InterviewSessionService:
    """Persistent, ownership-enforced AI interview sessions.

    Reuses the ai_sessions / ai_messages tables (session_type = 'case_interview')
    shared with the learning chatbot. The interviewer generates one question at
    a time with conversation history threaded through the Prompt Registry.
    """

    def __init__(self, db: Session, client: Optional[LLMClientProtocol] = None):
        self.db = db
        self.client = client

    # -- ownership helpers -------------------------------------------------

    def _get_owned_session(self, session_id: str, user_id: str) -> AISession:
        session = (
            self.db.query(AISession).filter(AISession.id == session_id).first()
        )
        if not session:
            raise NotFoundError("AI session")
        if str(session.user_id) != str(user_id):
            raise AuthorizationError()
        return session

    # -- session CRUD -------------------------------------------------------

    def create_session(self, user_id: str, payload: AISessionCreate) -> AISession:
        session = AISession(
            user_id=user_id,
            session_type=(payload.session_type or AISessionType.CASE_INTERVIEW.value),
            related_resource_id=payload.related_resource_id,
            related_resource_type=payload.related_resource_type,
            prompt_id=payload.prompt_id,
            model_used=payload.model_used,
            status="active",
            metadata_=payload.metadata_ or {},
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def list_sessions(self, user_id: str) -> List[AISession]:
        return (
            self.db.query(AISession)
            .filter(AISession.user_id == user_id)
            .order_by(AISession.updated_at.desc())
            .all()
        )

    def get_session(self, session_id: str, user_id: str) -> AISession:
        return self._get_owned_session(session_id, user_id)

    def update_session(
        self, session_id: str, user_id: str, payload: AISessionUpdate
    ) -> AISession:
        session = self._get_owned_session(session_id, user_id)
        if payload.status is not None:
            if payload.status not in {"active", "completed", "abandoned"}:
                raise ValidationError("status must be active, completed or abandoned")
            session.status = payload.status
        if payload.ended_at is not None:
            session.ended_at = payload.ended_at
        if payload.total_tokens is not None:
            session.total_tokens = max(0, payload.total_tokens)
        if payload.total_latency_ms is not None:
            session.total_latency_ms = max(0, payload.total_latency_ms)
        if payload.metadata_ is not None:
            session.metadata_ = payload.metadata_
        self.db.commit()
        self.db.refresh(session)
        return session

    def delete_session(self, session_id: str, user_id: str) -> None:
        session = self._get_owned_session(session_id, user_id)
        self.db.delete(session)
        self.db.commit()

    def complete_session(self, session_id: str, user_id: str) -> AISession:
        session = self._get_owned_session(session_id, user_id)
        session.status = "completed"
        session.ended_at = session.ended_at or datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(session)
        return session

    # -- messages -----------------------------------------------------------

    def list_messages(self, session_id: str, user_id: str) -> List[AIMessage]:
        self._get_owned_session(session_id, user_id)
        return (
            self.db.query(AIMessage)
            .filter(AIMessage.session_id == session_id)
            .order_by(AIMessage.sequence_number.asc())
            .all()
        )

    def append_message(
        self,
        session_id: str,
        user_id: str,
        role: str,
        content: str,
        structured_output: Optional[Any] = None,
    ) -> AIMessage:
        self._get_owned_session(session_id, user_id)
        content = (content or "").strip()
        if not content:
            raise ValidationError("Message cannot be empty")
        if len(content) > 4000:
            raise ValidationError("Message is too long (max 4000 characters)")
        if role not in {AIRole.CANDIDATE.value, AIRole.INTERVIEWER.value, AIRole.SYSTEM.value, AIRole.USER.value, AIRole.ASSISTANT.value}:
            raise ValidationError("Invalid message role")

        prior_count = (
            self.db.query(AIMessage)
            .filter(AIMessage.session_id == session_id)
            .count()
        )
        msg = AIMessage(
            session_id=session_id,
            role=role,
            content=content,
            structured_output=structured_output,
            sequence_number=prior_count,
        )
        self.db.add(msg)
        self.db.commit()
        self.db.refresh(msg)
        return msg

    # -- adaptive interview chat ---------------------------------------------

    def chat(self, payload: Any, user_id: str) -> dict[str, Any]:
        message = (payload.message or "").strip()
        if len(message) > 4000:
            raise ValidationError("Message is too long (max 4000 characters)")
        if payload.topic and len(payload.topic.strip()) > 120:
            raise ValidationError("Topic is too long (max 120 characters)")
        if payload.difficulty and payload.difficulty not in {"Easy", "Medium", "Hard"}:
            raise ValidationError("difficulty must be Easy, Medium or Hard")

        # Never pretend a stub reply is a real interview question.
        resolved = self.client or get_llm_client()
        if isinstance(resolved, StubLLMClient):
            raise AIError(
                "AI provider is not configured. Set GROQ_API_KEY to enable AI interviews.",
                retryable=False,
            )

        # Resolve or create the session.
        if payload.session_id:
            session = self._get_owned_session(payload.session_id, user_id)
            if session.status == "completed":
                raise ValidationError("This interview is already completed.")
        else:
            metadata: dict[str, Any] = {
                "mode": "case" if payload.case_id else "generative",
                "case_id": payload.case_id,
                "case_attempt_id": payload.case_attempt_id,
            }
            if payload.topic:
                metadata["topic"] = payload.topic.strip()
            if payload.difficulty:
                metadata["difficulty"] = payload.difficulty
            session = AISession(
                user_id=user_id,
                session_type=AISessionType.CASE_INTERVIEW.value,
                status="active",
                metadata_=metadata,
            )
            self.db.add(session)
            self.db.commit()
            self.db.refresh(session)

        prior = (
            self.db.query(AIMessage)
            .filter(AIMessage.session_id == session.id)
            .order_by(AIMessage.sequence_number.asc())
            .all()
        )
        next_seq = len(prior)

        # Persist the candidate's answer first (crash-safe, keeps history).
        if message:
            self.db.add(
                AIMessage(
                    session_id=session.id,
                    role=AIRole.CANDIDATE.value,
                    content=message,
                    sequence_number=next_seq,
                )
            )
            self.db.commit()
            next_seq += 1

        # The interviewer must see the candidate's latest answer so the
        # follow-up question responds to it.
        history = [{"role": m.role, "content": m.content} for m in prior[-11:]]
        if message:
            history.append({"role": "candidate", "content": message})
        history = history[-12:]

        # Case data (curated case or generative topic-based interview).
        case_data: dict[str, Any]
        questions: list[dict[str, Any]] = []
        if payload.case_id:
            case = self.db.query(Case).filter(Case.id == payload.case_id).first()
            if not case:
                raise NotFoundError("Case")
            case_data = {
                "id": case.id,
                "title": case.title,
                "company": case.company,
                "case_type": case.case_type,
                "difficulty": case.difficulty,
                "background": case.background or case.prompt or case.description or "",
                "rubric": None,
            }
            questions = [
                {
                    "question_type": q.question_type,
                    "question_text": q.question_text,
                    "model_answer": q.model_answer,
                    "rubric": q.rubric,
                }
                for q in self.db.query(CaseQuestion)
                .filter(CaseQuestion.case_id == case.id)
                .order_by(CaseQuestion.display_order.asc())
                .all()
            ]
        else:
            md = session.metadata_ or {}
            topic = (md.get("topic") or "general professional interview").strip()
            difficulty = md.get("difficulty") or "Medium"
            case_data = {
                "id": session.id,
                "title": topic,
                "company": "Learnova",
                "case_type": "General",
                "difficulty": difficulty,
                "background": md.get("description")
                or f"Conduct a professional interview about: {topic}.",
                "rubric": None,
            }

        profile = self.db.query(Profile).filter(Profile.user_id == user_id).first()
        profile_dict = {
            "experience_level": profile.experience_level if profile else "Intermediate",
            "target_firms": profile.target_firms if profile else [],
            "interview_date": str(profile.interview_date) if profile and profile.interview_date else "",
        }

        interviewer_msgs = sum(1 for m in prior if m.role == AIRole.INTERVIEWER.value)
        total_questions = len(questions) or 6

        interviewer = InterviewerService(client=self.client)
        result = interviewer.next_question(
            profile=profile_dict,
            case_data=case_data,
            questions=questions,
            conversation_history=history,
            question_index=interviewer_msgs,
            total_questions=total_questions,
        )
        question_text = (result.get("message") or "").strip()
        if not question_text:
            raise AIError("The interviewer returned an empty question — please retry.")
        structured = result.get("structured_output")

        ai_msg = AIMessage(
            session_id=session.id,
            role=AIRole.INTERVIEWER.value,
            content=question_text,
            structured_output=structured,
            sequence_number=next_seq,
        )
        self.db.add(ai_msg)
        self.db.commit()
        self.db.refresh(ai_msg)

        return {
            "session_id": session.id,
            "message": question_text,
            "next_question": structured,
            "structured_output": structured,
            "message_id": ai_msg.id,
        }

    # -- session evaluation ---------------------------------------------------

    def evaluate_session(
        self, session_id: str, user_id: str
    ) -> StructuredEvaluation:
        session = self._get_owned_session(session_id, user_id)
        messages = (
            self.db.query(AIMessage)
            .filter(AIMessage.session_id == session_id)
            .order_by(AIMessage.sequence_number.asc())
            .all()
        )
        if not messages:
            raise ValidationError("This interview has no conversation to evaluate.")

        transcript_lines = [f"{m.role.upper()}: {m.content[:1500]}" for m in messages]
        answer_rows: list[dict[str, Any]] = []
        for msg in messages:
            if msg.role == AIRole.CANDIDATE.value:
                answer_rows.append(
                    {"answer_text": msg.content[:1500], "model_answer": "N/A"}
                )

        # Copy: mutating the ORM's JSON dict in place is not tracked by
        # SQLAlchemy, so the evaluation would silently never persist.
        md = dict(session.metadata_ or {})
        topic = (md.get("topic") or "general professional interview").strip()
        difficulty = md.get("difficulty") or "Medium"
        case_data = {
            "title": topic,
            "case_type": "General",
            "rubric": "Professional interview rubric: assess technical/domain knowledge, problem solving, communication, and completeness with evidence.",
            "model_answers": "",
        }

        profile = self.db.query(Profile).filter(Profile.user_id == user_id).first()
        candidate_profile = {
            "experience_level": profile.experience_level if profile else "Intermediate",
            "target_firms": profile.target_firms if profile else [],
        }

        evaluation = run_case_evaluation(
            client=self.client,
            case_data=case_data,
            transcript="\n".join(transcript_lines),
            answers=answer_rows,
            candidate_profile=candidate_profile,
        )

        md["evaluation"] = evaluation.model_dump()
        session.metadata_ = md
        session.status = "completed"
        session.ended_at = session.ended_at or datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(session)

        # Feed the real evaluation into progress so weak areas from interviews
        # surface on the dashboard and in practice recommendations.
        from .progress_service import ProgressService

        scores = {
            canonical_skill_name(s.skill): s.score for s in evaluation.skills
        }
        ProgressService(self.db).record_skill_scores(user_id, scores)
        return evaluation