from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from ..ai.resume_parser import ResumeParserService
from ..core.exceptions import AuthorizationError, NotFoundError, ValidationError
from ..models.resume import Resume
from ..schemas.ai import ResumeData
from ..utils.resume_sanitize import sanitize_resume_data
from .resume_service import (
    ensure_supported_resume,
    extract_resume_text,
    sanitize_filename,
)


class ResumeAssetService:
    """Reusable, user-owned resume assets.

    Stores only the sanitized structured ResumeData (never the raw upload).
    Enforces ownership on every read/write; a user can only ever see, update,
    or delete their own resumes.
    """

    def __init__(self, db: Session):
        self.db = db

    def _owned(self, resume_id: str, user_id: str) -> Resume:
        resume = self.db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            raise NotFoundError("Resume")
        if str(resume.user_id) != str(user_id):
            raise AuthorizationError()
        return resume

    def list_for_user(self, user_id: str) -> list[Resume]:
        return (
            self.db.query(Resume)
            .filter(Resume.user_id == user_id)
            .order_by(Resume.updated_at.desc())
            .all()
        )

    def get_owned(self, resume_id: str, user_id: str) -> Resume:
        return self._owned(resume_id, user_id)

    def create_from_parsed(
        self,
        user_id: str,
        filename: str,
        resume: ResumeData | dict,
        role: Optional[str] = None,
        source_type: str = "parsed",
    ) -> Resume:
        data = resume.model_dump() if isinstance(resume, ResumeData) else dict(resume)
        cleaned = sanitize_resume_data(data)
        if not cleaned.get("skills") and not cleaned.get("projects") and not cleaned.get("experience"):
            raise ValidationError(
                "Nothing usable was parsed from this resume — skills, projects, or experience are required."
            )
        record = Resume(
            user_id=user_id,
            # Display-only, never a filesystem path — but sanitized so a crafted
            # name cannot carry traversal segments or control characters.
            filename=sanitize_filename(filename)[:200],
            source_type=(source_type or "parsed")[:40],
            role=((role or "").strip()[:80]) or None,
            data=cleaned,
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def create_from_file(
        self,
        user_id: str,
        filename: str,
        file_bytes: bytes,
        role: Optional[str] = None,
    ) -> Resume:
        """Extract text locally, parse structure with AI, and persist the result."""
        ensure_supported_resume(filename)
        text = extract_resume_text(filename, file_bytes)
        parser = ResumeParserService()
        parsed = parser.parse(text, role=role)
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "text"
        return self.create_from_parsed(
            user_id, filename, parsed, role=role, source_type=ext
        )

    def update_owned(
        self,
        resume_id: str,
        user_id: str,
        *,
        filename: Optional[str] = None,
        role: Optional[str] = None,
        resume: Optional[ResumeData | dict] = None,
    ) -> Resume:
        record = self._owned(resume_id, user_id)
        if filename is not None:
            if not (filename or "").strip():
                raise ValidationError("filename cannot be empty")
            record.filename = sanitize_filename(filename)[:200]
        if role is not None:
            record.role = (role.strip()[:80]) or None
        if resume is not None:
            data = resume.model_dump() if isinstance(resume, ResumeData) else dict(resume)
            cleaned = sanitize_resume_data(data)
            if not cleaned.get("skills") and not cleaned.get("projects") and not cleaned.get("experience"):
                raise ValidationError(
                    "Nothing usable in the updated resume — skills, projects, or experience are required."
                )
            record.data = cleaned
        self.db.commit()
        self.db.refresh(record)
        return record

    def delete_owned(self, resume_id: str, user_id: str) -> None:
        record = self._owned(resume_id, user_id)
        self.db.delete(record)
        self.db.commit()
