from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, status, UploadFile
from sqlalchemy.orm import Session

from ..core.exceptions import ValidationError as AppValidationError
from ..core.security import get_current_user, get_db
from ..models.user import User
from ..schemas.resume import (
    ResumeRecordResponse,
    ResumeSaveRequest,
    ResumeUpdateRequest,
)
from ..services.resume_asset_service import ResumeAssetService
from ..services.resume_service import MAX_RESUME_BYTES

router = APIRouter(prefix="/api/resumes", tags=["resumes"])

# NOTE: static paths (/upload, bare "") MUST be declared before the parameterised
# /{resume_id} routes so that FastAPI does not accidentally match the literal string
# "upload" as a resume_id.  See AGENTS.md — "FastAPI route-order shadowing".


@router.get("", response_model=List[ResumeRecordResponse])
def list_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return ResumeAssetService(db).list_for_user(current_user.id)


@router.post("", response_model=ResumeRecordResponse, status_code=status.HTTP_201_CREATED)
def save_resume(
    payload: ResumeSaveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save an already-parsed structured resume as a reusable asset."""
    return ResumeAssetService(db).create_from_parsed(
        current_user.id,
        payload.filename,
        payload.resume,
        role=payload.role,
        source_type=payload.source_type,
    )


@router.post("/upload", response_model=ResumeRecordResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    role: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a resume file: local text extraction → AI structured parse → save.

    Single-step alternative to the two-step parse (/api/ai/resume/parse) +
    save (/api/resumes) flow.  The parsed, sanitized structure is stored under
    the user's account and can be reused for future interviews.  The raw file
    is never persisted.
    """
    filename = (file.filename or "").strip()
    data = await file.read()
    if not data:
        raise AppValidationError("Resume file is empty")
    if len(data) > MAX_RESUME_BYTES:
        raise AppValidationError("Resume file is too large (max 2 MB)")

    service = ResumeAssetService(db)
    return service.create_from_file(current_user.id, filename, data, role=role)


# -- parameterised routes (must come AFTER all static paths) ------------------


@router.get("/{resume_id}", response_model=ResumeRecordResponse)
def get_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return ResumeAssetService(db).get_owned(resume_id, current_user.id)


@router.patch("/{resume_id}", response_model=ResumeRecordResponse)
def update_resume(
    resume_id: str,
    payload: ResumeUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return ResumeAssetService(db).update_owned(
        resume_id,
        current_user.id,
        filename=payload.filename,
        role=payload.role,
        resume=payload.resume,
    )


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ResumeAssetService(db).delete_owned(resume_id, current_user.id)
    return None
