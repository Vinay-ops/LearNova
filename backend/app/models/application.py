import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Date,
    ForeignKey,
    Integer,
    String,
    Text,
    
    func,
)
from sqlalchemy.orm import relationship

from ..db.database import Base
from ..utils.enums import ApplicationStage


class Application(Base):
    __tablename__ = "applications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    company = Column(String, nullable=False)
    role = Column(String, nullable=False)
    deadline = Column(Date, nullable=True)
    stage = Column(String, nullable=False, default=ApplicationStage.PREPARING.value)
    preparation = Column(Integer, nullable=False, default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
