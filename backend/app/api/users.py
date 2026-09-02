from fastapi import APIRouter

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me")
def redirect_to_auth():
    """User profile is available via /api/auth/me."""
    return {"detail": "Use /api/auth/me instead"}
