import uuid
from datetime import datetime
from typing import List

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    JSON,
    
    func,
)
from sqlalchemy.orm import relationship

from ..db.database import Base
from ..utils.enums import AttemptStatus, CaseType, Difficulty, QuestionType


class Case(Base):
    __tablename__ = "cases"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    case_type = Column(String, nullable=False, default=CaseType.PROFITABILITY.value)
    difficulty = Column(String, nullable=False, default=Difficulty.MEDIUM.value)
    duration_minutes = Column(Integer, nullable=False, default=25)
    description = Column(Text, nullable=True)
    prompt = Column(Text, nullable=True)
    background = Column(Text, nullable=True)
    skills = Column(JSON, nullable=False, default=list)
    is_active = Column(Boolean, nullable=False, default=True)
    is_ai_generated = Column(Boolean, nullable=False, default=False)
    generated_by_prompt_id = Column(
        String(36),
        ForeignKey("prompts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    questions = relationship("CaseQuestion", back_populates="case", cascade="all, delete-orphan")
    attempts = relationship("CaseAttempt", back_populates="case", cascade="all, delete-orphan")


class CaseQuestion(Base):
    __tablename__ = "case_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    case_id = Column(
        String(36),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_type = Column(String, nullable=False, default=QuestionType.STRUCTURING.value)
    question_text = Column(Text, nullable=False)
    model_answer = Column(Text, nullable=True)
    display_order = Column(Integer, nullable=False, default=0)
    time_limit_seconds = Column(Integer, nullable=True)
    rubric = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    case = relationship("Case", back_populates="questions")
    answers = relationship("CaseAnswer", back_populates="question", cascade="all, delete-orphan")


class CaseAttempt(Base):
    __tablename__ = "case_attempts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    case_id = Column(
        String(36),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(String, nullable=False, default=AttemptStatus.IN_PROGRESS.value)
    current_question_index = Column(Integer, nullable=False, default=0)
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    elapsed_seconds = Column(Integer, nullable=False, default=0)
    overall_score = Column(Integer, nullable=True)
    structuring_score = Column(Integer, nullable=True)
    quantitative_score = Column(Integer, nullable=True)
    business_judgment_score = Column(Integer, nullable=True)
    communication_score = Column(Integer, nullable=True)
    synthesis_score = Column(Integer, nullable=True)
    ai_feedback = Column(Text, nullable=True)
    strengths = Column(JSON, nullable=False, default=list)
    weaknesses = Column(JSON, nullable=False, default=list)
    recommendations = Column(Text, nullable=True)
    evaluated_by_prompt_id = Column(
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

    case = relationship("Case", back_populates="attempts")
    answers = relationship("CaseAnswer", back_populates="attempt", cascade="all, delete-orphan")


class CaseAnswer(Base):
    __tablename__ = "case_answers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    attempt_id = Column(
        String(36),
        ForeignKey("case_attempts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_id = Column(
        String(36),
        ForeignKey("case_questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    answer_text = Column(Text, nullable=True)
    score = Column(Integer, nullable=True)
    ai_feedback = Column(Text, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    attempt = relationship("CaseAttempt", back_populates="answers")
    question = relationship("CaseQuestion", back_populates="answers")
