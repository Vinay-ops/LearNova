from __future__ import annotations

import re
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
from ..utils.resume_sanitize import sanitize_resume_data
from .case_evaluation_service import canonical_skill_name, run_case_evaluation


def _question_tokens(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", (text or "").lower()))


def _is_duplicate_question(
    candidate: str, previous: list[str], threshold: float = 0.85
) -> bool:
    """Deterministic guard so the interviewer never asks the same question twice.

    Two questions count as duplicates when they share >= threshold of their
    (smaller) token set — near-identical wording is caught without needing a
    second AI call. The regeneration loop in ``chat`` bounds the retries.
    """
    new = _question_tokens(candidate)
    if not new:
        return True
    for prior_text in previous:
        old = _question_tokens(prior_text)
        if not old:
            continue
        overlap = len(new & old) / min(len(new), len(old))
        if overlap >= threshold:
            return True
    return False


def _format_resume_block(role: str, resume: Any) -> str:
    """Turn the structured resume into plain text the interviewer can ground
    questions in. Data assembly only — prompts stay in the Prompt Registry."""
    resume = resume if isinstance(resume, dict) else {}
    lines: list[str] = []
    lines.append(f"JOB ROLE: {role or 'Not specified'}")
    name = resume.get("name") or ""
    title = resume.get("title") or ""
    if name or title:
        lines.append(f"Candidate: {name or ''}{(' — ' + title) if title else ''}".rstrip())
    summary = (resume.get("summary") or "").strip()
    if summary:
        lines.append(f"Summary: {summary[:900]}")
    skills = resume.get("skills") or []
    if skills:
        lines.append("Skills: " + ", ".join(skills[:40]))
    tech = resume.get("technologies") or []
    if tech:
        lines.append("Technologies: " + ", ".join(tech[:40]))
    projects = resume.get("projects") or []
    if projects:
        lines.append("Projects:")
        for p in projects[:8]:
            name_p = p.get("name") or "Unnamed project"
            desc = (p.get("description") or "").strip()
            pt = (p.get("technologies") or [])[:12]
            suffix = f" (tech: {', '.join(pt)})" if pt else ""
            lines.append(f"- {name_p}: {desc[:500]}{suffix}" if desc else f"- {name_p}{suffix}")
    experience = resume.get("experience") or []
    if experience:
        lines.append("Experience:")
        for e in experience[:8]:
            role_e = e.get("role") or ""
            company = e.get("company") or ""
            duration = e.get("duration") or ""
            summary_e = (e.get("summary") or "").strip()
            head = " - ".join(x for x in [role_e, company, duration] if x)
            if summary_e:
                lines.append(f"- {head}: {summary_e[:400]}")
            else:
                lines.append(f"- {head}")
    education = resume.get("education") or []
    if education:
        lines.append("Education:")
        for ed in education[:6]:
            degree = ed.get("degree") or ""
            institution = ed.get("institution") or ""
            year = ed.get("year") or ""
            lines.append(" - ".join(x for x in [degree, institution, year] if x))
    certs = resume.get("certifications") or []
    if certs:
        lines.append("Certifications: " + ", ".join(certs[:20]))
    return "\n".join(lines) if lines else f"JOB ROLE: {role or 'Not specified'}"


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
        if payload.role and len(payload.role.strip()) > 80:
            raise ValidationError("Role is too long (max 80 characters)")
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
            role = (payload.role or "").strip()
            is_role = bool(payload.case_id is None and role)
            metadata: dict[str, Any] = {
                "mode": "case" if payload.case_id else ("role" if is_role else "generative"),
                "case_id": payload.case_id,
                "case_attempt_id": payload.case_attempt_id,
            }
            # Resume may come inline (from the stateless parser) or by reference
            # to a saved resume asset. Saved assets are always user-owned.
            resume_data: dict[str, Any] = {}
            resume_id = payload.resume_id
            if payload.resume is not None:
                resume_data = sanitize_resume_data(payload.resume)
            elif payload.resume_id:
                from ..models.resume import Resume as ResumeAsset

                asset = (
                    self.db.query(ResumeAsset)
                    .filter(
                        ResumeAsset.id == str(payload.resume_id),
                        ResumeAsset.user_id == str(user_id),
                    )
                    .first()
                )
                if not asset:
                    raise NotFoundError("Resume")
                resume_data = sanitize_resume_data(asset.data)
            if is_role:
                metadata["role"] = role[:80]
                # topic stays human-readable for lists/titles; role drives prompts.
                metadata["topic"] = (payload.topic or role)[:120]
                if resume_data:
                    metadata["resume"] = resume_data
                    metadata["resume_id"] = resume_id
            elif payload.topic:
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
            md = dict(session.metadata_ or {})
            topic = (md.get("topic") or "general professional interview").strip()
            difficulty = md.get("difficulty") or "Medium"
            is_role = md.get("mode") == "role"
            if is_role:
                role = (md.get("role") or topic)[:80]
                case_data = {
                    "id": session.id,
                    "title": topic,
                    "company": "Learnova",
                    "case_type": role,
                    "difficulty": difficulty,
                    "background": _format_resume_block(role, md.get("resume")),
                    "rubric": None,
                }
            else:
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
        # For case-based interviews the question list is authoritative.  For
        # generative and role/resume interviews there is no predefined list, so
        # we fall back to a named constant.  6 is chosen because it fits within
        # a 10–15 minute session, gives the LLM enough turns to cover breadth
        # AND probe depth, and matches what the prompts were authored around.
        # No per-difficulty variation: the adaptive difficulty signal already
        # adjusts question *content* turn-by-turn (performance_history); changing
        # the *count* based on difficulty has no basis in the current prompt
        # design and would only confuse the progress indicator.
        DEFAULT_GENERATIVE_QUESTIONS = 6
        total_questions = len(questions) or DEFAULT_GENERATIVE_QUESTIONS
        previous_questions = [
            m.content for m in prior if m.role == AIRole.INTERVIEWER.value
        ]

        # Role/resume interviews use the professional role interviewer prompt;
        # everything else keeps the existing case/generative interviewer.
        md = dict(session.metadata_ or {})
        # Persist the question target once so the UI shows real progress
        # ("Question 3 of 6") instead of a made-up number.
        if not md.get("total_questions"):
            md["total_questions"] = int(total_questions)

        prompt_name = "role_interviewer" if md.get("mode") == "role" else "interviewer"
        interviewer = InterviewerService(client=self.client)

        # Generate with a bounded no-repeat guard: if the interviewer returns a
        # near-duplicate of an earlier question, ask once more (max 2 retries)
        # with an explicit instruction. We never loop forever.
        question_text = ""
        structured: Optional[Any] = None
        retry_context = history
        for _attempt in range(3):
            result = interviewer.next_question(
                profile=profile_dict,
                case_data=case_data,
                questions=questions,
                conversation_history=retry_context,
                question_index=interviewer_msgs,
                total_questions=total_questions,
                prompt_name=prompt_name,
            )
            candidate_text = (result.get("message") or "").strip()
            candidate_structured = result.get("structured_output")
            if previous_questions and _is_duplicate_question(
                candidate_text, previous_questions
            ):
                retry_context = history + [
                    {
                        "role": "system",
                        "content": (
                            "One of the questions you just asked repeats an earlier "
                            "question in this interview. Ask a genuinely different "
                            "follow-up instead."
                        ),
                    }
                ]
                continue
            question_text = candidate_text
            structured = candidate_structured
            break
        if not question_text:
            raise AIError("The interviewer returned an empty question — please retry.")

        # Server-authoritative performance signal: the interviewer labels the
        # candidate's last answer and proposes the next difficulty. We validate
        # the values and persist them so later turns genuinely adapt and the
        # history can show how the interview progressed.
        perf = ""
        next_difficulty: Optional[str] = None
        if isinstance(structured, dict):
            perf = str(structured.get("performance") or "").strip().lower()
            if perf not in {"weak", "average", "strong"}:
                perf = ""
            nd = str(structured.get("next_difficulty") or "").strip().lower()
            difficulty_map = {"easy": "Easy", "medium": "Medium", "hard": "Hard"}
            next_difficulty = difficulty_map.get(nd)
        if perf or next_difficulty:
            signals = list(md.get("performance_history") or [])[-19:]
            signals.append(
                {
                    "turn": interviewer_msgs + 1,
                    "performance": perf or "average",
                    "next_difficulty": next_difficulty or md.get("difficulty") or "Medium",
                }
            )
            md["performance_history"] = signals
            if next_difficulty and md.get("mode") != "case":
                md["difficulty"] = next_difficulty

        session.metadata_ = md
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
            "question_index": interviewer_msgs + 1,
            "total_questions": int(total_questions),
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
        is_role = md.get("mode") == "role"
        role = (md.get("role") or topic).strip()[:80]
        if is_role:
            rubric = (
                "ROLE: " + role + "\n\n"
                + _format_resume_block(role, md.get("resume"))
                + "\n\nEvaluate: Technical Knowledge, Communication, Problem Solving, "
                "Confidence, Resume Alignment, and Completeness. Confidence is "
                "judged from transcript language only (clarity, assertiveness, "
                "concreteness) — there is no audio or tone data, so never score "
                "it from voice tone. Score Resume Alignment by how well the "
                "candidate used their actual skills and projects (from the resume "
                "above) in their answers. Cite specific evidence from the "
                "transcript for every score."
            )
            case_data = {
                "title": topic,
                "case_type": role,
                "rubric": rubric,
                "model_answers": "",
            }
            prompt_name = "interview_evaluator"
        else:
            case_data = {
                "title": topic,
                "case_type": "General",
                "rubric": "Professional interview rubric: assess technical/domain knowledge, problem solving, communication, and completeness with evidence.",
                "model_answers": "",
            }
            prompt_name = "evaluator"

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
            prompt_name=prompt_name,
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