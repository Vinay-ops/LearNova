import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, JSON, func
from sqlalchemy.orm import relationship

from ..db.database import Base


class Resume(Base):
    """A user's reusable resume asset.

    Stores the structured ResumeData only (never the raw uploaded file bytes):
    the interview engine grounds questions in the structured representation, so
    keeping raw bytes would add storage without product value. Content is
    sanitized on the way in and ownership is enforced on every query.
    """

    __tablename__ = "resumes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    filename = Column(String, nullable=False, default="resume")
    source_type = Column(String, nullable=True)
    role = Column(String, nullable=True)
    # Structured ResumeData (sanitized). Raw file bytes are intentionally not stored.
    data = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user = relationship("User")


class ReadinessSnapshot(Base):
    """A real readiness measurement point.

    A snapshot row is written only when a genuine progress/evaluation event
    (skill scores recorded, case/drill/assessment completed, interview
    evaluated) changes the calculated readiness score. History is never
    synthesized — the readiness chart shows only these real points.
    """

    __tablename__ = "readiness_snapshots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    score = Column(Integer, nullable=False)
    source = Column(String, nullable=False, default="readiness_recalc")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User")
