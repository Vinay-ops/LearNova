import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, false, func
from sqlalchemy.orm import relationship

from ..db.database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("email", name="uq_users_email"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    email = Column(String, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # -- Legal consent ------------------------------------------------------
    # Consent is stored against the VERSION of each document that was accepted,
    # plus the server-side UTC timestamp of acceptance. Storing only a boolean
    # would not establish which revision the user actually agreed to.
    #
    # Columns are nullable/defaulted False so that pre-existing accounts are NOT
    # retroactively marked as consenting: they are prompted to accept the
    # current revision on their next visit (see core/legal.py).
    # server_default uses SQLAlchemy's dialect-neutral boolean (renders as
    # `false` on PostgreSQL, `0` on SQLite) — a literal "0" is rejected by
    # PostgreSQL for a BOOLEAN column.
    terms_accepted = Column(Boolean, default=False, nullable=False, server_default=false())
    terms_version = Column(String(32), nullable=True)
    terms_accepted_at = Column(DateTime(timezone=True), nullable=True)
    privacy_policy_accepted = Column(Boolean, default=False, nullable=False, server_default=false())
    privacy_policy_version = Column(String(32), nullable=True)
    privacy_policy_accepted_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
