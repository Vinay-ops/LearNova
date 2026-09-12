from .auth import router as auth_router
from .profiles import router as profiles_router
from .users import router as users_router
from .applications import router as applications_router
from .progress import router as progress_router
from .cases import router as cases_router
from .assessments import router as assessments_router
from .drills import router as drills_router
from .ai_interview import router as ai_router
from .prompts import router as prompts_router
from .learning import router as learning_router
from .quizzes import router as quizzes_router
from .resumes import router as resumes_router

__all__ = [
    "auth_router",
    "profiles_router",
    "users_router",
    "applications_router",
    "progress_router",
    "cases_router",
    "assessments_router",
    "drills_router",
    "ai_router",
    "prompts_router",
    "learning_router",
    "quizzes_router",
    "resumes_router",
]
