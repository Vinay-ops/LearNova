from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..core.security import get_current_user, get_db
from ..models.prompt import Prompt
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


def _get_prompt_row(prompt_id: str, db: Session) -> Prompt:
    row = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return row


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
    db: Session = Depends(get_db),
):
    """Deterministic side-by-side comparison of two persisted prompt versions.

    Shows field-level differences plus rendered previews with the supplied test
    variables. Pure comparison — no LLM call, so it is free and reproducible.
    """
    row1 = _get_prompt_row(payload.prompt_id_1, db)
    row2 = _get_prompt_row(payload.prompt_id_2, db)

    comparable = [
        "name", "purpose", "version", "description", "system_prompt",
        "user_prompt_template", "model", "temperature", "top_p",
        "max_tokens", "is_active", "changelog",
    ]
    differences = []
    for field_name in comparable:
        old = getattr(row1, field_name)
        new = getattr(row2, field_name)
        if old != new:
            differences.append({"field": field_name, "old_value": old, "new_value": new})

    ctx = payload.test_variables
    rendered_1 = PromptResponse.model_validate(row1)
    rendered_2 = PromptResponse.model_validate(row2)

    def _render(row: Prompt) -> str:
        tpl = PromptTemplate(
            name=row.name,
            purpose=row.purpose,
            version=row.version,
            system_prompt=row.system_prompt,
            user_prompt_template=row.user_prompt_template,
        )
        parts = ["SYSTEM:\n" + tpl.render_system(ctx)]
        user_part = tpl.render_user(ctx)
        if user_part:
            parts.append("USER:\n" + user_part)
        return "\n\n".join(parts)

    return PromptCompareResponse(
        prompt_1=rendered_1,
        prompt_2=rendered_2,
        differences=differences,
        rendered_1=_render(row1),
        rendered_2=_render(row2),
    )


@router.post("", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
def create_prompt(
    payload: PromptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Persist a new prompt version row (the experimentation side of the
    Prompt Registry). Built-in production prompts remain code-defined and are
    served from the in-memory registry; DB rows are user-created variants."""
    import uuid

    duplicate = (
        db.query(Prompt)
        .filter(Prompt.name == payload.name, Prompt.version == payload.version)
        .first()
    )
    if duplicate:
        raise HTTPException(
            status_code=409,
            detail=f"Prompt '{payload.name}' version '{payload.version}' already exists",
        )

    row = Prompt(
        id=str(uuid.uuid4()),
        name=payload.name.strip(),
        purpose=payload.purpose,
        version=payload.version,
        description=payload.description,
        system_prompt=payload.system_prompt,
        user_prompt_template=payload.user_prompt_template,
        variables=[v.model_dump() for v in payload.variables],
        output_schema=payload.output_schema,
        model=payload.model or None,
        temperature=payload.temperature,
        top_p=payload.top_p,
        max_tokens=payload.max_tokens,
        prompt_techniques=payload.prompt_techniques,
        is_active=payload.is_active,
        parent_prompt_id=payload.parent_prompt_id,
        parent_version=payload.parent_version,
        changelog=payload.changelog,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return PromptResponse.model_validate(row)


@router.put("/{prompt_id}", response_model=PromptResponse)
def update_prompt(
    prompt_id: str,
    payload: PromptUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an editable field on a persisted prompt row.

    Identity fields (name/version) are intentionally immutable — iterate the
    version instead, which is what the changelog/parent fields are for.
    """
    row = _get_prompt_row(prompt_id, db)
    data = payload.model_dump(exclude_unset=True)
    for field_name, value in data.items():
        if field_name == "variables" and value is not None:
            value = [v if isinstance(v, dict) else dict(v) for v in value]
        setattr(row, field_name, value)
    db.commit()
    db.refresh(row)
    return PromptResponse.model_validate(row)
