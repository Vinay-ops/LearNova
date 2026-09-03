import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text, UniqueConstraint, func, ForeignKey, Float
from sqlalchemy.orm import relationship

from ..db.database import Base
from ..utils.enums import Trend


class Skill(Base):
    __tablename__ = "skills"
    __table_args__ = (UniqueConstraint("name", name="uq_skills_name"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    color = Column(String, nullable=True)
    weight = Column(Float, nullable=False, default=1.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user_skills = relationship("UserSkill", back_populates="skill", cascade="all, delete-orphan")


class UserSkill(Base):
    __tablename__ = "user_skills"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    skill_id = Column(
        String(36),
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    current_score = Column(Integer, nullable=False, default=0)
    previous_score = Column(Integer, nullable=True)
    trend = Column(String, nullable=False, default=Trend.FLAT.value)
    total_practice_minutes = Column(Integer, nullable=False, default=0)
    last_practiced_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    skill = relationship("Skill", back_populates="user_skills")
