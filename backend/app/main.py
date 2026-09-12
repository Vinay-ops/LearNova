from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .core.logging import LOG_LEVEL, setup_logging
from .ai import bootstrap_prompts
from .api import (
    auth_router,
    profiles_router,
    users_router,
    applications_router,
    progress_router,
    cases_router,
    assessments_router,
    drills_router,
    ai_router,
    prompts_router,
    learning_router,
    quizzes_router,
    resumes_router,
)

setup_logging(LOG_LEVEL)
bootstrap_prompts()

app = FastAPI(
    title="Learnova API",
    version="0.2.0",
    description=(
        "Learnova — AI-powered consulting interview preparation platform. "
        "Architecture supports auth, profiles, cases, assessments, drills, "
        "applications, progress tracking, AI interviewer, evaluations, and "
        "prompt engineering experimentation."
    ),
)

_origins = settings.frontend_origins
if not _origins:
    _origins = ["http://localhost:5173", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["health"])
def health():
    return {
        "status": "ok",
        "version": "0.2.0",
        "phase": "Phase 5 (Cases, Assessments, Drills) implemented",
        "modules": {
            "auth": "Phase 1 - Complete",
            "profiles": "Phase 1 - Complete",
            "applications": "Phase 2 - Complete",
            "progress": "Phase 2 - Complete",
            "cases": "Phase 3 - API ready",
            "assessments": "Phase 4 - API ready",
            "drills": "Phase 5 - API ready",
            "ai_interview": "Phase 6-7 - Sessions, adaptive chat, evaluation, feedback, recommendations",
            "evaluations": "Phase 8 - Wired via evaluator prompt + server-side persistence",
            "recommendations": "Phase 9 - Wired (deterministic + LLM enrichment)",
            "prompts": "Phase 6 - Prompt registry exposed",
        },
    }


app.include_router(auth_router)
app.include_router(profiles_router)
app.include_router(users_router)
app.include_router(applications_router)
app.include_router(progress_router)
app.include_router(cases_router)
app.include_router(assessments_router)
app.include_router(drills_router)
app.include_router(ai_router)
app.include_router(prompts_router)
app.include_router(learning_router)
app.include_router(quizzes_router)
app.include_router(resumes_router)
