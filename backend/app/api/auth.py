from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from ..core.rate_limit import enforce_auth_rate_limit
from ..core.security import get_current_user, get_db
from ..models.user import User
from ..schemas.auth import (
    AcceptLegalTermsRequest,
    AuthLoginRequest,
    AuthResponse,
    AuthSignupRequest,
    LegalConsentState,
    MeResponse,
)
from ..services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _client_key(request: Request, email: str | None = None) -> str:
    """Rate-limit bucket key: the account when known, else the client IP.

    Login/signup are unauthenticated, so the identifier has to come from the
    request. Preferring the email means one account cannot be brute-forced from
    many IPs; the IP fallback covers an attacker rotating emails from one host.
    """
    if email:
        return f"email:{email.strip().lower()}"
    forwarded = request.headers.get("x-forwarded-for", "")
    ip = forwarded.split(",")[0].strip() if forwarded else None
    return f"ip:{ip or (request.client.host if request.client else 'unknown')}"


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: AuthSignupRequest, request: Request, db: Session = Depends(get_db)):
    """Create an account.

    Terms & Conditions and Privacy Policy acceptance is REQUIRED and enforced
    here by ``AuthSignupRequest`` — calling this endpoint directly without
    consenting fails validation, exactly as the UI checkbox would.
    """
    enforce_auth_rate_limit("signup", _client_key(request))
    service = AuthService(db)
    return service.signup(payload)


@router.post("/login", response_model=AuthResponse)
def login(payload: AuthLoginRequest, request: Request, db: Session = Depends(get_db)):
    enforce_auth_rate_limit("login", _client_key(request, payload.email))
    service = AuthService(db)
    return service.login(payload.email, payload.password)


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Clear the session.

    Tokens are stateless bearer credentials, so logout is client-side: the
    frontend discards the token. The endpoint exists to emit an audit event.
    Server-side revocation would require a token denylist (documented as a
    launch requirement, not implemented here).
    """
    return AuthService(db).logout(str(current_user.id))


@router.get("/me", response_model=MeResponse)
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.me(str(current_user.id))


@router.post("/accept-terms", response_model=LegalConsentState)
def accept_terms(
    payload: AcceptLegalTermsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record explicit acceptance of the current Terms & Conditions / Privacy
    Policy revisions for the authenticated user.

    Used when a document revision changes: the user is shown the update and must
    actively accept it. Historical consent is overwritten only by a newer
    explicit acceptance — never silently.
    """
    service = AuthService(db)
    return service.accept_legal_terms(str(current_user.id), payload)
