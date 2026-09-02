from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..core.security import get_current_user, get_db
from ..core.exceptions import NotFoundError
from ..models.profile import Profile
from ..models.user import User
from ..schemas.profile import ProfileResponse, ProfileUpdateRequest

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("", response_model=ProfileResponse)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise NotFoundError("Profile")
    return ProfileResponse.model_validate(profile)


@router.put("", response_model=ProfileResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise NotFoundError("Profile")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return ProfileResponse.model_validate(profile)
