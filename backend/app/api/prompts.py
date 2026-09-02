from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..core.security import get_current_user, get_db
from ..models.user import User
from ..schemas.prompt import (
    PromptCreate,
    PromptUpdate,
    PromptResponse,
    PromptRenderRequest,
    PromptRenderResponse,
    PromptCompareRequest,
    PromptCompareResponse,
)
from ..ai import bootstrap_prompts, prompt_registry
from ..ai.prompts.base import PromptTemplate

router = APIRouter(prefix="/api/prompts", tags=["prompts"])

_PHASE_6_MSG = "Prompt management and experimentation API will be fully implemented in Phase 6."


@router.get("", response_model=List[dict])
def list_prompts(
    purpose: Optional[str] = None,
    name: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    bootstrap_prompts()
    templates = prompt_registry.all_prompts()
    if purpose:
        templates = [t for t in templates if t.purpose == purpose]
    if name:
        templates = [t for t in templates if t.name == name]
    return [
        {
            "name": t.name,
            "purpose": t.purpose,
            "version": t.version,
            "description": t.description,
            "model": t.model,
            "temperature": float(t.temperature),
            "techniques": [k for k, v in t.techniques.model_dump().items() if v],
        }
        for t in templates
    ]


@router.get("/{name}/versions", response_model=List[dict])
def list_prompt_versions(
    name: str,
    current_user: User = Depends(get_current_user),
):
    bootstrap_prompts()
    versions = prompt_registry.list_versions(name)
    return [
        {
            "name": v.name,
            "version": v.version,
            "description": v.description,
            "system_prompt": v.system_prompt,
            "user_prompt_template": v.user_prompt_template,
            "variables": [sv.model_dump() for sv in v.variables],
            "techniques": [k for k, val in v.techniques.model_dump().items() if val],
            "technique_notes": v.technique_notes,
            "model": v.model,
            "temperature": float(v.temperature),
        }
        for v in versions
    ]


@router.get("/{name}/{version}", response_model=dict)
def get_prompt(
    name: str,
    version: str = "latest",
    current_user: User = Depends(get_current_user),
):
    bootstrap_prompts()
    if version == "latest":
        template = prompt_registry.get(name)
    else:
        template = prompt_registry.get(name, version)
    return {
        "name": template.name,
        "purpose": template.purpose,
        "version": template.version,
        "description": template.description,
        "system_prompt": template.system_prompt,
        "user_prompt_template": template.user_prompt_template,
        "variables": [sv.model_dump() for sv in template.variables],
        "techniques": {k: v for k, v in template.techniques.model_dump().items()},
        "technique_notes": template.technique_notes,
        "model": template.model,
        "temperature": float(template.temperature),
        "top_p": float(template.top_p) if template.top_p else None,
        "max_tokens": template.max_tokens,
    }


@router.post("/render", response_model=PromptRenderResponse)
def render_prompt(
    payload: PromptRenderRequest,
    current_user: User = Depends(get_current_user),
):
    bootstrap_prompts()
    template = prompt_registry.get("interviewer")
    # Try to find the specific prompt by ID in the payload
    all_templates = prompt_registry.all_prompts()
    for t in all_templates:
        if str(t.prompt_id) == str(payload.prompt_id) or str(t.name) == str(payload.prompt_id):
            template = t
            break
    return PromptRenderResponse(
        prompt_id=payload.prompt_id,
        name=template.name,
        version=template.version,
        system_prompt=template.render_system(payload.variables),
        user_prompt=template.render_user(payload.variables),
        model=template.model,
        temperature=template.temperature,
    )


@router.post("/compare", response_model=PromptCompareResponse)
def compare_prompts(
    payload: PromptCompareRequest,
    current_user: User = Depends(get_current_user),
):
    raise HTTPException(status_code=501, detail=f"{_PHASE_6_MSG} Prompt comparison and A/B testing coming soon.")


@router.post("", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
def create_prompt(
    payload: PromptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    raise HTTPException(status_code=501, detail=_PHASE_6_MSG)


@router.put("/{prompt_id}", response_model=PromptResponse)
def update_prompt(
    prompt_id: str,
    payload: PromptUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    raise HTTPException(status_code=501, detail=_PHASE_6_MSG)
