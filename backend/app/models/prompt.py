import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    Numeric,
    String,
    Text,
    JSON,
    
    func,
)

from ..db.database import Base
from ..utils.enums import PromptPurpose


class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String, nullable=False, index=True)
    purpose = Column(String, nullable=False, default=PromptPurpose.INTERVIEWER.value)
    version = Column(String, nullable=False, default="v1")
    description = Column(Text, nullable=True)
    system_prompt = Column(Text, nullable=False)
    user_prompt_template = Column(Text, nullable=True)
    variables = Column(JSON, nullable=True, default=list)
    output_schema = Column(JSON, nullable=True)
    model = Column(String, nullable=False, default="openai/gpt-oss-120b")
    temperature = Column(Numeric(precision=3, scale=2), nullable=False, default=0.7)
    top_p = Column(Numeric(precision=3, scale=2), nullable=True)
    max_tokens = Column(Integer, nullable=True)
    prompt_techniques = Column(JSON, nullable=True, default=list)
    is_active = Column(Boolean, nullable=False, default=True)
    parent_prompt_id = Column(String(36), nullable=True)
    parent_version = Column(String, nullable=True)
    changelog = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
