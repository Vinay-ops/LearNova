from typing import Optional

from sqlalchemy.orm import Session
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from ..core.config import settings
from ..core.security import create_access_token, verify_token
from ..core.exceptions import (
    AuthenticationError,
    ConflictError,
    NotFoundError,
)
from ..core.logging import log_auth_event
from ..db.session import get_db
from ..models.user import User
from ..models.profile import Profile
from ..schemas.auth import AuthSignupRequest, AuthResponse, MeResponse
from ..schemas.profile import ProfileResponse
from ..schemas.user import UserResponse
from ..utils.validators import validate_email, validate_password

ph = PasswordHasher()


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def signup(self, payload: AuthSignupRequest) -> AuthResponse:
        email = validate_email(payload.email)
        validate_password(payload.password)

        existing = self.db.query(User).filter(User.email == email).first()
        if existing:
            raise ConflictError("An account with this email already exists")

        user = User(
            email=email,
            password_hash=ph.hash(payload.password),
            is_active=True,
        )
        self.db.add(user)
        self.db.flush()

        profile = Profile(
            user_id=user.id,
            full_name=payload.full_name.strip(),
            avatar_url=None,
            experience_level="Beginner",
            target_firms=[],
            interview_date=None,
            readiness_score=0,
        )
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(user)
        self.db.refresh(profile)

        token = create_access_token(str(user.id))
        log_auth_event("signup", str(user.id))

        return AuthResponse(
            access_token=token,
            token_type="bearer",
            user=UserResponse.model_validate(user),
            profile=ProfileResponse.model_validate(profile),
        )

    def login(self, email: str, password: str) -> AuthResponse:
        normalized_email = validate_email(email)
        user = self.db.query(User).filter(User.email == normalized_email).first()

        if not user or not user.is_active:
            raise AuthenticationError("Invalid email or password")

        try:
            if not ph.verify(user.password_hash, password):
                raise AuthenticationError("Invalid email or password")
        except VerifyMismatchError:
            raise AuthenticationError("Invalid email or password")
        except Exception:
            raise AuthenticationError("Invalid email or password")

        profile = self.db.query(Profile).filter(Profile.user_id == user.id).first()
        token = create_access_token(str(user.id))
        log_auth_event("login", str(user.id))

        return AuthResponse(
            access_token=token,
            token_type="bearer",
            user=UserResponse.model_validate(user),
            profile=ProfileResponse.model_validate(profile) if profile else None,
        )

    def me(self, user_id: str) -> MeResponse:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundError("User")
        profile = self.db.query(Profile).filter(Profile.user_id == user_id).first()
        return MeResponse(
            user=UserResponse.model_validate(user),
            profile=ProfileResponse.model_validate(profile) if profile else None,
        )

    def logout(self, user_id: Optional[str] = None) -> dict:
        log_auth_event("logout", user_id)
        return {"detail": "Logged out successfully"}

    def verify_token_get_user(self, token: str) -> User:
        user_id = verify_token(token)
        if not user_id:
            raise AuthenticationError()
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise AuthenticationError()
        return user
