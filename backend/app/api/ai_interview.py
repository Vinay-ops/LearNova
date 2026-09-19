from typing import List, Optional

from fastapi import APIRouter, Depends, status, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from ..core.security import get_current_user, get_db
from ..models.ai_session import AIMessage, AISession
from ..models.application import Application
from ..models.case import Case
from ..models.drill import Drill
from ..models.profile import Profile
from ..models.user import User
from ..schemas.ai import (
    AIMessageCreate,
    AIMessageResponse,
    AISessionCreate,
    AISessionUpdate,
    AISessionResponse,
    AIChatRequest,
    AIChatResponse,
    AIInterviewCompleteRequest,
    AIEvaluationRequest,
    AIEvaluationResponse,
    AIFeedbackRequest,
    AIFeedbackResponse,
    AIRecommendationRequest,
    AIRecommendationResponse,
    StructuredEvaluation,
    ResumeData,
    ResumeParseResponse,
)
from ..ai.resume_parser import ResumeParserService
from ..services.case_evaluation_service import CaseEvaluationService
from ..services.resume_service import MAX_RESUME_BYTES, extract_resume_text
from ..core.exceptions import ValidationError as AppValidationError
from ..services.interview_session_service import InterviewSessionService
from ..services.progress_service import ProgressService
from ..ai.feedback_generator import FeedbackGeneratorService
from ..ai.recommender import RecommenderService
from ..core.exceptions import NotFoundError, ValidationError
from ..core.rate_limit import enforce_ai_rate_limit

router = APIRouter(prefix="/api/ai", tags=["ai"])


# -- sessions ---------------------------------------------------------------


@router.post("/sessions", response_model=AISessionResponse, status_code=status.HTTP_201_CREATED)
def create_ai_session(
    payload: AISessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = InterviewSessionService(db)
    return service.create_session(current_user.id, payload)


@router.get("/sessions", response_model=List[AISessionResponse])
def list_ai_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = InterviewSessionService(db)
    return service.list_sessions(current_user.id)


@router.get("/sessions/{session_id}", response_model=AISessionResponse)
def get_ai_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = InterviewSessionService(db)
    return service.get_session(session_id, current_user.id)


@router.put("/sessions/{session_id}", response_model=AISessionResponse)
def update_ai_session(
    session_id: str,
    payload: AISessionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = InterviewSessionService(db)
    return service.update_session(session_id, current_user.id, payload)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ai_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = InterviewSessionService(db)
    service.delete_session(session_id, current_user.id)
    return None


@router.get("/sessions/{session_id}/messages", response_model=List[AIMessageResponse])
def list_ai_messages(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = InterviewSessionService(db)
    return service.list_messages(session_id, current_user.id)


@router.post(
    "/sessions/{session_id}/messages",
    response_model=AIMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_ai_message(
    session_id: str,
    payload: AIMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = InterviewSessionService(db)
    return service.append_message(
        session_id,
        current_user.id,
        payload.role,
        payload.content,
        payload.structured_output,
    )


# -- resume parsing -----------------------------------------------------------


@router.post("/resume/parse", response_model=ResumeParseResponse)
async def parse_resume(
    file: UploadFile = File(...),
    role: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
):
    """Upload a resume (PDF/DOCX/TXT) and get structured candidate data back.

    Text extraction is a local file operation; the structured parse runs the
    resume_parser_v1 prompt (Prompt Registry → Groq) and validates the result
    against the ResumeData schema. No resume file or text is persisted — the
    caller passes the structured data when starting the interview.
    """
    filename = (file.filename or "").strip()
    data = await file.read()
    if not data:
        raise AppValidationError("Resume file is empty")
    if len(data) > MAX_RESUME_BYTES:
        raise AppValidationError("Resume file is too large (max 2 MB)")

    enforce_ai_rate_limit("resume_parse", current_user.id)

    resume_text = extract_resume_text(filename, data)
    parser = ResumeParserService()
    parsed = parser.parse(resume_text, role=role)
    return ResumeParseResponse(
        source_type=filename.rsplit(".", 1)[-1].lower() if "." in filename else "text",
        characters=len(resume_text),
        resume=parsed,
    )


# -- interview chat ----------------------------------------------------------


@router.post("/interview/chat", response_model=AIChatResponse)
def ai_interview_chat(
    payload: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    enforce_ai_rate_limit("interview_chat", current_user.id)
    service = InterviewSessionService(db)
    result = service.chat(payload, current_user.id)
    return AIChatResponse(
        session_id=result["session_id"],
        message=result["message"],
        next_question=result["next_question"],
        structured_output=result["structured_output"],
        question_index=result.get("question_index"),
        total_questions=result.get("total_questions"),
    )


@router.post("/interview/complete", response_model=AISessionResponse)
def ai_interview_complete(
    payload: AIInterviewCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = InterviewSessionService(db)
    return service.complete_session(payload.session_id, current_user.id)


# -- evaluation --------------------------------------------------------------


@router.post("/evaluation", response_model=AIEvaluationResponse)
def ai_evaluate(
    payload: AIEvaluationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    enforce_ai_rate_limit("evaluation", current_user.id)
    if not payload.case_attempt_id and not payload.session_id:
        raise ValidationError("Provide either case_attempt_id or session_id")

    if payload.case_attempt_id:
        service = CaseEvaluationService(db)
        _, evaluation = service.evaluate_attempt(
            payload.case_attempt_id, current_user.id
        )
        return AIEvaluationResponse(
            case_attempt_id=payload.case_attempt_id,
            evaluation=evaluation,
        )

    service = InterviewSessionService(db)
    evaluation = service.evaluate_session(payload.session_id, current_user.id)
    return AIEvaluationResponse(
        case_attempt_id=None,
        evaluation=evaluation,
        ai_session_id=payload.session_id,
    )


# -- feedback ----------------------------------------------------------------


def _case_results_from_attempt(
    attempt, case: Optional[Case], answers: list
) -> dict:
    skills = []
    for label, column in [
        ("Structuring", "structuring_score"),
        ("Quantitative Analysis", "quantitative_score"),
        ("Business Judgment", "business_judgment_score"),
        ("Communication", "communication_score"),
        ("Synthesis", "synthesis_score"),
    ]:
        value = getattr(attempt, column, None)
        if value is not None:
            skills.append({"skill": label, "score": int(value), "evidence": None})

    excerpts = "\n".join(
        f"- {(a.answer_text or '')[:200]}" for a in answers[:4]
    )
    return {
        "overall_score": attempt.overall_score or 0,
        "skills": skills,
        "strengths": attempt.strengths or [],
        "improvements": attempt.weaknesses or [],
        "recommendations": [
            r.strip() for r in (attempt.recommendations or "").splitlines() if r.strip()
        ],
        "case_title": case.title if case else "the case",
        "transcript_excerpts": excerpts or "(no transcript excerpt)",
    }


@router.post("/feedback", response_model=AIFeedbackResponse)
def ai_generate_feedback(
    payload: AIFeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    enforce_ai_rate_limit("feedback", current_user.id)
    if not payload.attempt_id and not payload.session_id:
        raise ValidationError("Provide either attempt_id or session_id")

    drills = [
        {
            "id": d.id,
            "title": d.title,
            "category": d.category,
            "duration_minutes": d.duration_minutes,
            "skills": d.skills or [],
        }
        for d in db.query(Drill).filter(Drill.is_active.is_(True)).all()
    ]
    profile_row = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    profile = {
        "experience_level": profile_row.experience_level if profile_row else "Intermediate",
        "target_firms": profile_row.target_firms if profile_row else [],
    }

    if payload.attempt_id:
        from ..models.case import CaseAttempt, CaseAnswer

        attempt = db.query(CaseAttempt).filter(CaseAttempt.id == payload.attempt_id).first()
        if not attempt:
            raise NotFoundError("Case attempt")
        if str(attempt.user_id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to access this attempt")
        case = db.query(Case).filter(Case.id == attempt.case_id).first()
        answers = (
            db.query(CaseAnswer)
            .filter(CaseAnswer.attempt_id == attempt.id)
            .all()
        )
        case_results = _case_results_from_attempt(attempt, case, answers)
    else:
        service = InterviewSessionService(db)
        session = service.get_session(payload.session_id, current_user.id)
        evaluation = (session.metadata_ or {}).get("evaluation")
        if not evaluation:
            raise ValidationError(
                "This interview has not been evaluated yet. Evaluate it first."
            )
        md = session.metadata_ or {}
        case_results = {
            "overall_score": evaluation.get("overall_score", 0),
            "skills": evaluation.get("skills") or [],
            "strengths": evaluation.get("strengths") or [],
            "improvements": evaluation.get("improvements") or [],
            "recommendations": evaluation.get("recommendations") or [],
            "case_title": md.get("topic") or "the interview",
            "transcript_excerpts": "(evaluated from conversation)",
        }

    generator = FeedbackGeneratorService()
    result = generator.generate_feedback(profile, case_results, drills)

    # Persist the feedback on the interview session so the history page can
    # review it without another AI call.
    if payload.session_id:
        service = InterviewSessionService(db)
        session = service.get_session(payload.session_id, current_user.id)
        md = dict(session.metadata_ or {})
        md["feedback"] = AIFeedbackResponse.model_validate(result).model_dump(
            mode="json"
        )
        session.metadata_ = md
        db.commit()
    return result


# -- recommendations -----------------------------------------------------------


@router.post("/recommendations", response_model=AIRecommendationResponse)
def ai_generate_recommendations(
    payload: AIRecommendationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    enforce_ai_rate_limit("recommendations", current_user.id)
    progress = ProgressService(db)
    summary = progress.get_summary(current_user.id)

    applications = db.query(Application).filter(Application.user_id == current_user.id).all()
    applications_dict = [
        {
            "company": a.company,
            "role": a.role,
            "deadline": str(a.deadline) if a.deadline else None,
            "stage": a.stage,
        }
        for a in applications
    ]

    drills = [
        {
            "id": d.id,
            "title": d.title,
            "category": d.category,
            "duration_minutes": d.duration_minutes,
            "skills": d.skills or [],
        }
        for d in db.query(Drill).filter(Drill.is_active.is_(True)).all()
    ]
    cases = [
        {
            "id": c.id,
            "title": c.title,
            "case_type": c.case_type,
            "skills": c.skills or [],
        }
        for c in db.query(Case).filter(Case.is_active.is_(True)).all()
    ]

    evaluation = None
    if payload.session_id:
        service = InterviewSessionService(db)
        session = service.get_session(payload.session_id, current_user.id)
        evaluation = (session.metadata_ or {}).get("evaluation")

    recommender = RecommenderService()
    result = recommender.get_personalized_recommendations(
        summary.model_dump(),
        applications_dict,
        drills=drills,
        cases=cases,
        evaluation=evaluation,
    )

    # Persist recommendations on the session when provided so completed
    # interviews can be reviewed later without re-running the LLM.
    if payload.session_id:
        service = InterviewSessionService(db)
        session = service.get_session(payload.session_id, current_user.id)
        md = dict(session.metadata_ or {})
        md["recommendations"] = AIRecommendationResponse.model_validate(
            result
        ).model_dump(mode="json")
        session.metadata_ = md
        db.commit()
    return result