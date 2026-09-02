from fastapi import APIRouter

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me")
def placeholder():
    return {"detail": "Use /api/auth/me instead"}
