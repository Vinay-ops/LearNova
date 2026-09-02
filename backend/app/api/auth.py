from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..core.security import get_current_user, get_db
from ..db.session import db_session
from ..models.profile import Profile
from ..models.user import User
from ..schemas.auth import AuthLoginRequest, AuthResponse, AuthSignupRequest, MeResponse
from ..schemas.profile import ProfileResponse
from ..schemas.user import UserResponse
from ..services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: AuthSignupRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.signup(payload)


@router.post("/login", response_model=AuthResponse)
def login(payload: AuthLoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.login(payload.email, payload.password)


@router.post("/logout")
def logout(current_user: User | None = Depends(get_current_user)):
    user_id = str(current_user.id) if current_user else None
    return AuthService(None).logout(user_id) if False else {"detail": "Logged out successfully"}


@router.get("/me", response_model=MeResponse)
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.me(str(current_user.id))
