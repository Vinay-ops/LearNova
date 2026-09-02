from datetime import datetime
from decimal import Decimal
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class PromptVariable(BaseModel):
    name: str
    description: Optional[str] = None
    type: str = "string"
    required: bool = True
    default: Optional[Any] = None


class PromptBase(BaseModel):
    name: str
    purpose: str = "interviewer"
    version: str = "v1"
    description: Optional[str] = None
    system_prompt: str
    user_prompt_template: Optional[str] = None
    variables: List[PromptVariable] = Field(default_factory=list)
    output_schema: Optional[Any] = None
    model: str = "gpt-4o"
    temperature: Decimal = Decimal("0.7")
    top_p: Optional[Decimal] = None
    max_tokens: Optional[int] = None
    prompt_techniques: List[str] = Field(default_factory=list)
    is_active: bool = True
    parent_prompt_id: Optional[str] = None
    parent_version: Optional[str] = None
    changelog: Optional[str] = None


class PromptCreate(PromptBase):
    pass


class PromptUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    user_prompt_template: Optional[str] = None
    variables: Optional[List[PromptVariable]] = None
    output_schema: Optional[Any] = None
    model: Optional[str] = None
    temperature: Optional[Decimal] = None
    top_p: Optional[Decimal] = None
    max_tokens: Optional[int] = None
    prompt_techniques: Optional[List[str]] = None
    is_active: Optional[bool] = None
    changelog: Optional[str] = None


class PromptResponse(PromptBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime


class PromptRenderRequest(BaseModel):
    prompt_id: str
    variables: dict[str, Any] = Field(default_factory=dict)


class PromptRenderResponse(BaseModel):
    prompt_id: str
    name: str
    version: str
    system_prompt: str
    user_prompt: Optional[str] = None
    model: str
    temperature: Decimal


class PromptCompareRequest(BaseModel):
    prompt_id_1: str
    prompt_id_2: str
    test_variables: dict[str, Any] = Field(default_factory=dict)


class PromptDiff(BaseModel):
    field: str
    old_value: Any
    new_value: Any


class PromptCompareResponse(BaseModel):
    prompt_1: PromptResponse
    prompt_2: PromptResponse
    differences: List[PromptDiff] = Field(default_factory=list)
    rendered_1: Optional[str] = None
    rendered_2: Optional[str] = None
