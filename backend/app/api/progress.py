from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..core.security import get_current_user, get_db
from ..models.user import User
from ..schemas.progress import ProgressSummary, SkillScoreCreate, SkillScoreResponse
from ..services.progress_service import ProgressService

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("", response_model=ProgressSummary)
def get_progress_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ProgressService(db)
    return service.get_summary(current_user.id)


@router.post("/skills", response_model=SkillScoreResponse)
def set_skill_score(
    payload: SkillScoreCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ProgressService(db)
    return service.set_skill_score(current_user.id, payload)


@router.post("/recalculate-readiness")
def recalculate_readiness(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ProgressService(db)
    score = service.recalculate_readiness(current_user.id)
    return {"readiness_score": score}
