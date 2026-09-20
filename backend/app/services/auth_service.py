from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from pydantic import ValidationError as PydanticValidationError

from ..core.config import settings
from ..core.legal import (
    PRIVACY_VERSION,
    TERMS_VERSION,
    consent_requires_action,
)
from ..core.security import create_access_token, verify_token
from ..core.exceptions import (
    AuthenticationError,
    ConflictError,
    NotFoundError,
    ValidationError,
)
from ..core.logging import log_auth_event, get_logger
from ..db.session import get_db
from ..models.user import User
from ..models.profile import Profile
from ..schemas.auth import (
    AcceptLegalTermsRequest,
    AuthSignupRequest,
    AuthResponse,
    CONSENT_REQUIRED_ERR,
    LegalConsentState,
    MeResponse,
)
from ..schemas.profile import ProfileResponse
from ..schemas.user import UserResponse
from ..utils.validators import validate_email, validate_password

ph = PasswordHasher()


def build_consent_state(user: User) -> LegalConsentState:
    """Current consent status of an account against the live document versions."""
    return LegalConsentState(
        terms_version=TERMS_VERSION,
        privacy_version=PRIVACY_VERSION,
        terms_accepted_version=user.terms_version,
        privacy_accepted_version=user.privacy_policy_version,
        terms_accepted_at=user.terms_accepted_at,
        privacy_accepted_at=user.privacy_policy_accepted_at,
        requires_acceptance=consent_requires_action(
            user.terms_version, user.privacy_policy_version
        ),
    )


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def signup(self, payload: AuthSignupRequest) -> AuthResponse:
        email = validate_email(payload.email)
        validate_password(payload.password)

        # Defence in depth. The Pydantic schema already rejects a missing or
        # false consent flag, so a direct POST /api/auth/signup cannot bypass
        # the checkbox. This guards any future internal caller that builds the
        # request object programmatically.
        if payload.terms_accepted is not True or payload.privacy_accepted is not True:
            raise ValidationError({"consent": CONSENT_REQUIRED_ERR})

        existing = self.db.query(User).filter(User.email == email).first()
        if existing:
            raise ConflictError("An account with this email already exists")

        # Server clock, server versions. A client-supplied accepted_at would be
        # trivially forgeable and is therefore never accepted.
        accepted_at = datetime.now(timezone.utc)
        user = User(
            email=email,
            password_hash=ph.hash(payload.password),
            is_active=True,
            terms_accepted=True,
            terms_version=TERMS_VERSION,
            terms_accepted_at=accepted_at,
            privacy_policy_accepted=True,
            privacy_policy_version=PRIVACY_VERSION,
            privacy_policy_accepted_at=accepted_at,
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
        # Audit trail: record WHICH revisions were accepted, not just that
        # consent happened.
        log_auth_event(
            "signup",
            str(user.id),
            terms_version=TERMS_VERSION,
            privacy_version=PRIVACY_VERSION,
        )

        return AuthResponse(
            access_token=token,
            token_type="bearer",
            user=UserResponse.model_validate(user),
            profile=ProfileResponse.model_validate(profile),
            legal_consent=build_consent_state(user),
        )

    def login(self, email: str, password: str) -> AuthResponse:
        normalized_email = validate_email(email)
        user = self.db.query(User).filter(User.email == normalized_email).first()

        if not user or not user.is_active:
            raise AuthenticationError("Invalid email or password")

        try:
            ph.verify(user.password_hash, password)
        except VerifyMismatchError:
            raise AuthenticationError("Invalid email or password")
        except Exception:
            raise AuthenticationError("Invalid email or password")

        profile = self.db.query(Profile).filter(Profile.user_id == user.id).first()
        token = create_access_token(str(user.id))
        log_auth_event("login", str(user.id))

        try:
            user_resp = UserResponse.model_validate(user)
        except PydanticValidationError as e:
            get_logger("casepilot.auth").error(
                "user response validation failed",
                extra={"user_id": str(user.id), "errors": e.errors()},
            )
            raise

        profile_resp = None
        if profile:
            try:
                profile_resp = ProfileResponse.model_validate(profile)
            except PydanticValidationError as e:
                get_logger("casepilot.auth").warning(
                    "profile response validation failed — coercing defaults",
                    extra={
                        "user_id": str(user.id),
                        "profile_id": str(profile.id),
                        "errors": e.errors(),
                    },
                )
                # Build a safe profile response by coercing NULLs to schema defaults
                profile_resp = ProfileResponse(
                    id=str(profile.id),
                    user_id=str(profile.user_id),
                    full_name=profile.full_name or (profile.user.email.split("@")[0] if profile.user else "User"),
                    avatar_url=profile.avatar_url,
                    experience_level=profile.experience_level,
                    target_firms=profile.target_firms if isinstance(profile.target_firms, list) else [],
                    interview_date=profile.interview_date,
                    readiness_score=profile.readiness_score if isinstance(profile.readiness_score, int) else 0,
                    created_at=profile.created_at,
                    updated_at=profile.updated_at,
                )

        return AuthResponse(
            access_token=token,
            token_type="bearer",
            user=user_resp,
            profile=profile_resp,
            legal_consent=build_consent_state(user),
        )

    def me(self, user_id: str) -> MeResponse:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundError("User")
        profile = self.db.query(Profile).filter(Profile.user_id == user_id).first()

        profile_resp = None
        if profile:
            try:
                profile_resp = ProfileResponse.model_validate(profile)
            except PydanticValidationError:
                profile_resp = ProfileResponse(
                    id=str(profile.id),
                    user_id=str(profile.user_id),
                    full_name=profile.full_name or (user.email.split("@")[0]),
                    avatar_url=profile.avatar_url,
                    experience_level=profile.experience_level,
                    target_firms=profile.target_firms if isinstance(profile.target_firms, list) else [],
                    interview_date=profile.interview_date,
                    readiness_score=profile.readiness_score if isinstance(profile.readiness_score, int) else 0,
                    created_at=profile.created_at,
                    updated_at=profile.updated_at,
                )

        return MeResponse(
            user=UserResponse.model_validate(user),
            profile=profile_resp,
            legal_consent=build_consent_state(user),
        )

    def accept_legal_terms(
        self, user_id: str, payload: AcceptLegalTermsRequest
    ) -> LegalConsentState:
        """Record an explicit (re-)acceptance of the current document revisions.

        The client sends the versions it displayed; they must match what the
        server is currently serving. This prevents a stale tab — or a crafted
        request — from recording consent for a document the user never saw, and
        it means a new revision bump necessarily produces a fresh, honest
        acceptance rather than silently inheriting the old one.
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundError("User")

        if (
            payload.terms_version != TERMS_VERSION
            or payload.privacy_version != PRIVACY_VERSION
        ):
            raise ConflictError(
                "These documents have been updated since this page was loaded. "
                "Please reload and review the current version."
            )

        accepted_at = datetime.now(timezone.utc)
        user.terms_accepted = True
        user.terms_version = TERMS_VERSION
        user.terms_accepted_at = accepted_at
        user.privacy_policy_accepted = True
        user.privacy_policy_version = PRIVACY_VERSION
        user.privacy_policy_accepted_at = accepted_at
        self.db.commit()
        self.db.refresh(user)

        log_auth_event(
            "legal_terms_accepted",
            str(user.id),
            terms_version=TERMS_VERSION,
            privacy_version=PRIVACY_VERSION,
        )
        return build_consent_state(user)

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
