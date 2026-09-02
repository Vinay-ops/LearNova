import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
    
    func,
)
from sqlalchemy.orm import relationship

from ..db.database import Base
from ..utils.enums import AttemptStatus, Difficulty, DrillCategory, QuestionType


class Drill(Base):
    __tablename__ = "drills"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False, default=DrillCategory.STRUCTURING.value)
    difficulty = Column(String, nullable=False, default=Difficulty.MEDIUM.value)
    duration_minutes = Column(Integer, nullable=False, default=10)
    total_questions = Column(Integer, nullable=False, default=0)
    skills = Column(JSON, nullable=False, default=list)
    is_active = Column(Boolean, nullable=False, default=True)
    is_ai_generated = Column(Boolean, nullable=False, default=False)
    generated_by_prompt_id = Column(
        String(36),
        ForeignKey("prompts.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    questions = relationship("DrillQuestion", back_populates="drill", cascade="all, delete-orphan")
    attempts = relationship("DrillAttempt", back_populates="drill", cascade="all, delete-orphan")


class DrillQuestion(Base):
    __tablename__ = "drill_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    drill_id = Column(
        String(36),
        ForeignKey("drills.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_type = Column(String, nullable=False, default=QuestionType.MCQ.value)
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=True)
    correct_option_index = Column(Integer, nullable=True)
    correct_answer = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    display_order = Column(Integer, nullable=False, default=0)
    time_limit_seconds = Column(Integer, nullable=True)
    difficulty = Column(String, nullable=False, default=Difficulty.MEDIUM.value)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    drill = relationship("Drill", back_populates="questions")


class DrillAttempt(Base):
    __tablename__ = "drill_attempts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    drill_id = Column(
        String(36),
        ForeignKey("drills.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(String, nullable=False, default=AttemptStatus.COMPLETED.value)
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    total_questions = Column(Integer, nullable=False, default=0)
    correct_count = Column(Integer, nullable=False, default=0)
    score = Column(Integer, nullable=True)
    time_spent_seconds = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    drill = relationship("Drill", back_populates="attempts")
