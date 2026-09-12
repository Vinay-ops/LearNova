from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy.orm import Session

from ..ai.evaluator import EvaluatorService
from ..ai.client import LLMClientProtocol, StubLLMClient
from ..ai.client import get_llm_client
from ..core.exceptions import AIError, AuthorizationError, NotFoundError, ValidationError
from ..models.ai_session import AISession
from ..models.case import Case, CaseAnswer, CaseAttempt, CaseQuestion
from ..models.profile import Profile
from ..models.prompt import Prompt
from ..schemas.ai import StructuredEvaluation
from ..schemas.case import CaseAttemptResponse
from ..utils.enums import AISessionType


# Skill names the evaluator prompt scores → CaseAttempt component columns.
_SKILL_COLUMN_MAP = [
    ("Problem Structuring", "structuring_score"),
    ("Quantitative Reasoning", "quantitative_score"),
    ("Business Judgment", "business_judgment_score"),
    ("Communication", "communication_score"),
    ("Synthesis & Recommendation", "synthesis_score"),
    ("Synthesis", "synthesis_score"),
]

# Evaluator output names → canonical skill names used across the product
# (skills table, drill/case catalogs, practice recommendations). Keeps weak
# areas detected by the AI aligned with the content available to practice.
_SKILL_CANONICAL_NAMES = {
    "problem structuring": "Structuring",
    "quantitative reasoning": "Quantitative Analysis",
    "business judgment": "Business Judgment",
    "communication": "Communication",
    "synthesis & recommendation": "Synthesis",
    "synthesis": "Synthesis",
}


def canonical_skill_name(name: str) -> str:
    """Map an evaluator skill label to the canonical product skill name."""
    if not name:
        return name
    return _SKILL_CANONICAL_NAMES.get(name.strip().lower(), name.strip())


def resolve_client(client: Optional[LLMClientProtocol]) -> LLMClientProtocol:
    """Return a real provider client or fail clearly when only the stub exists.

    Evaluation must never silently fabricate output — if GROQ_API_KEY is not
    configured the caller gets an explicit, actionable error.
    """
    resolved = client or get_llm_client()
    if isinstance(resolved, StubLLMClient):
        raise AIError(
            "AI provider is not configured. Set GROQ_API_KEY to enable AI evaluation.",
            retryable=False,
        )
    return resolved


def run_case_evaluation(
    client: Optional[LLMClientProtocol],
    case_data: dict[str, Any],
    transcript: str,
    answers: list[dict[str, Any]],
    candidate_profile: dict[str, Any],
    prompt_name: str = "evaluator",
) -> StructuredEvaluation:
    """Run the evaluator prompt through the LLM abstraction and validate output.

    Shared by case-attempt evaluation and (role/resume) interview evaluation so
    there is exactly one evaluation path. ``prompt_name`` selects the rubric:
    "evaluator" (case skills) or "interview_evaluator" (role skills).
    """
    service = EvaluatorService(client=resolve_client(client))
    return service.evaluate_attempt(
        case_data=case_data,
        transcript=transcript,
        answers=answers,
        candidate_profile=candidate_profile,
        prompt_name=prompt_name,
    )


class CaseEvaluationService:
    """Server-authoritative AI evaluation for completed case attempts.

    Scores are produced by the LLM (via the Prompt Registry evaluator_v1
    template), validated against the StructuredEvaluation schema, and persisted
    to the attempt. The frontend never supplies or modifies scores.
    """

    def __init__(self, db: Session, client: Optional[LLMClientProtocol] = None):
        self.db = db
        self.client = client

    def evaluate_attempt(
        self, attempt_id: str, user_id: str
    ) -> tuple[CaseAttemptResponse, StructuredEvaluation]:
        attempt = (
            self.db.query(CaseAttempt).filter(CaseAttempt.id == attempt_id).first()
        )
        if not attempt:
            raise NotFoundError("Case attempt")
        if str(attempt.user_id) != str(user_id):
            raise AuthorizationError()

        case = self.db.query(Case).filter(Case.id == attempt.case_id).first()
        if not case:
            raise NotFoundError("Case")

        answers = (
            self.db.query(CaseAnswer)
            .filter(CaseAnswer.attempt_id == attempt_id)
            .order_by(CaseAnswer.created_at.asc())
            .all()
        )
        if not answers:
            raise ValidationError(
                "No answers to evaluate. Answer at least one question first."
            )

        questions = {
            q.id: q
            for q in self.db.query(CaseQuestion)
            .filter(CaseQuestion.case_id == case.id)
            .all()
        }

        profile = self.db.query(Profile).filter(Profile.user_id == user_id).first()
        candidate_profile = {
            "experience_level": profile.experience_level if profile else "Intermediate",
            "target_firms": profile.target_firms if profile else [],
            "interview_date": str(profile.interview_date) if profile and profile.interview_date else "",
        }

        # Build the transcript + question-by-question answer list.
        transcript_lines = []
        answer_rows: list[dict[str, Any]] = []
        for idx, ans in enumerate(answers, 1):
            question = questions.get(ans.question_id)
            q_text = (question.question_text if question else "Question")[:120]
            given = (ans.answer_text or "(no answer provided)")[:1500]
            transcript_lines.append(f"Interviewer: {q_text}")
            transcript_lines.append(f"Candidate: {given}")
            answer_rows.append(
                {
                    "answer_text": given,
                    "model_answer": (question.model_answer if question else None) or "N/A",
                }
            )

        case_data = {
            "title": case.title,
            "company": case.company,
            "case_type": case.case_type,
            "difficulty": case.difficulty,
            "background": case.background or case.prompt or case.description or "",
            "rubric": "Standard case interview rubric: assess structuring, quantitative reasoning, business judgment, communication, and synthesis with evidence.",
        }

        evaluation = run_case_evaluation(
            client=self.client,
            case_data=case_data,
            transcript="\n".join(transcript_lines),
            answers=answer_rows,
            candidate_profile=candidate_profile,
        )

        self._persist(attempt, case, evaluation)
        return CaseAttemptResponse.model_validate(attempt), evaluation

    def _persist(
        self,
        attempt: CaseAttempt,
        case: Case,
        evaluation: StructuredEvaluation,
    ) -> None:
        scores: dict[str, Any] = {}
        for skill_row in evaluation.skills:
            for skill_name, column in _SKILL_COLUMN_MAP:
                if skill_name.lower() in skill_row.skill.lower() or skill_row.skill.lower() in skill_name.lower():
                    scores[column] = max(0, min(100, int(skill_row.score)))
                    break

        prompt = (
            self.db.query(Prompt)
            .filter(Prompt.name == "evaluator", Prompt.version == "v1")
            .first()
        )

        attempt.status = "completed"
        attempt.completed_at = attempt.completed_at or datetime.now(timezone.utc)
        attempt.overall_score = max(0, min(100, int(evaluation.overall_score)))
        for column, value in scores.items():
            setattr(attempt, column, value)
        attempt.strengths = evaluation.strengths
        attempt.weaknesses = evaluation.improvements
        attempt.recommendations = "\n".join(evaluation.recommendations) or None
        attempt.ai_feedback = (
            "Overall "
            + str(evaluation.overall_score)
            + "/100. "
            + " ".join(evaluation.improvements[:2])
        ).strip()
        attempt.evaluated_by_prompt_id = prompt.id if prompt else None

        # Persist the structured evaluation in an AI session for traceability.
        evaluation_session = AISession(
            user_id=attempt.user_id,
            session_type=AISessionType.EVALUATION.value,
            related_resource_id=attempt.id,
            related_resource_type="case_attempt",
            prompt_id=prompt.id if prompt else None,
            status="completed",
            started_at=datetime.now(timezone.utc),
            ended_at=datetime.now(timezone.utc),
            metadata_={
                "evaluation": evaluation.model_dump(),
                "case_id": case.id,
            },
        )
        self.db.add(evaluation_session)
        self.db.commit()
        self.db.refresh(attempt)

        # Feed the real evaluation into progress: canonical skill scores flow
        # into UserSkill rows and refresh the readiness score. Never synthetic.
        from .progress_service import ProgressService

        scores = {
            canonical_skill_name(s.skill): s.score for s in evaluation.skills
        }
        ProgressService(self.db).record_skill_scores(attempt.user_id, scores)