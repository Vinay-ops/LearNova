import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from .user import UserResponse
from .profile import ProfileResponse


STRONG_PASSWORD_ERR = "Password must be at least 8 characters long"
CONSENT_REQUIRED_ERR = (
    "You must accept the Terms & Conditions and the Privacy Policy to create an account."
)


class AuthSignupRequest(BaseModel):
    """Signup payload.

    ``terms_accepted`` / ``privacy_accepted`` are REQUIRED and must be true.
    This is the server-side half of the consent contract: the checkbox in the
    UI is only a convenience, and a client that calls ``POST /api/auth/signup``
    directly without consenting is rejected with a 422 exactly like one that
    never rendered the form. The version strings are deliberately NOT accepted
    from the client — the server records the revision it is actually serving
    (see ``core/legal.py``), so a client cannot claim to have accepted an
    arbitrary or future version.
    """

    full_name: str = Field(..., min_length=1, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    terms_accepted: bool
    privacy_accepted: bool

    @field_validator("password")
    @classmethod
    def password_not_blank(cls, v: str) -> str:
        if len(v.strip()) < 8:
            raise ValueError(STRONG_PASSWORD_ERR)
        return v

    @field_validator("terms_accepted")
    @classmethod
    def terms_must_be_accepted(cls, v: bool) -> bool:
        if v is not True:
            raise ValueError(CONSENT_REQUIRED_ERR)
        return v

    @field_validator("privacy_accepted")
    @classmethod
    def privacy_must_be_accepted(cls, v: bool) -> bool:
        if v is not True:
            raise ValueError(CONSENT_REQUIRED_ERR)
        return v


class AuthLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class LegalConsentState(BaseModel):
    """Whether this account must (re-)accept the CURRENT document revisions."""

    terms_version: str
    privacy_version: str
    terms_accepted_version: Optional[str] = None
    privacy_accepted_version: Optional[str] = None
    terms_accepted_at: Optional[datetime] = None
    privacy_accepted_at: Optional[datetime] = None
    requires_acceptance: bool


class AcceptLegalTermsRequest(BaseModel):
    """Explicit (re-)acceptance of the current revisions.

    The client sends the versions it displayed; the server verifies they match
    what it is currently serving. A mismatch is rejected so that a stale tab
    cannot silently record consent for a document the user never saw.
    """

    terms_version: str = Field(..., min_length=1, max_length=32)
    privacy_version: str = Field(..., min_length=1, max_length=32)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    profile: Optional[ProfileResponse] = None
    legal_consent: LegalConsentState


class MeResponse(BaseModel):
    user: UserResponse
    profile: Optional[ProfileResponse] = None
    legal_consent: LegalConsentState
