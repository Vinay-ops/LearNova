from __future__ import annotations

from dataclasses import dataclass, field
from string import Template
from typing import Any, Callable, Optional

from pydantic import BaseModel, ConfigDict, Field


class PromptVariableDef(BaseModel):
    name: str
    description: Optional[str] = None
    type: str = "string"
    required: bool = True
    default: Any = None


class PromptTechniques(BaseModel):
    role_prompting: bool = False
    context_injection: bool = False
    constraints: bool = False
    few_shot_examples: bool = False
    structured_output: bool = False
    rubric_based_evaluation: bool = False
    conditional_prompting: bool = False
    adaptive_prompting: bool = False
    iterative_prompting: bool = False
    prompt_versioning: bool = False


@dataclass
class PromptTemplate:
    name: str
    purpose: str
    version: str
    system_prompt: str
    user_prompt_template: Optional[str] = None
    variables: list[PromptVariableDef] = field(default_factory=list)
    output_schema: Optional[type[BaseModel]] = None
    model: Optional[str] = None
    temperature: float = 0.7
    top_p: Optional[float] = None
    max_tokens: Optional[int] = None
    techniques: PromptTechniques = field(default_factory=PromptTechniques)
    description: Optional[str] = None
    technique_notes: dict[str, str] = field(default_factory=dict)

    def render_system(self, context: Optional[dict[str, Any]] = None) -> str:
        ctx = context or {}
        return self._safe_substitute(self.system_prompt, ctx)

    def render_user(self, context: Optional[dict[str, Any]] = None) -> str | None:
        if not self.user_prompt_template:
            return None
        ctx = context or {}
        return self._safe_substitute(self.user_prompt_template, ctx)

    def validate_context(self, context: dict[str, Any]) -> tuple[bool, list[str]]:
        errors: list[str] = []
        for var in self.variables:
            if var.required and var.name not in context:
                errors.append(f"Missing required variable: {var.name}")
        return (len(errors) == 0, errors)

    @staticmethod
    def _safe_substitute(template_text: str, context: dict[str, Any]) -> str:
        tpl = Template(template_text)
        try:
            return tpl.substitute(context)
        except (KeyError, ValueError):
            return tpl.safe_substitute(context)

    @property
    def prompt_id(self) -> str:
        return f"{self.name}_{self.version}"


PromptRegistryType = dict[str, PromptTemplate]


class PromptRegistry:
    def __init__(self) -> None:
        self._prompts: PromptRegistryType = {}

    def register(self, template: PromptTemplate) -> PromptTemplate:
        self._prompts[template.prompt_id] = template
        return template

    def get(self, name: str, version: Optional[str] = None) -> PromptTemplate:
        if version:
            key = f"{name}_{version}"
            if key not in self._prompts:
                raise KeyError(f"Prompt not found: {key}")
            return self._prompts[key]

        matches = [
            p for p in self._prompts.values()
            if p.name == name
        ]
        if not matches:
            raise KeyError(f"No prompts registered with name: {name}")
        matches.sort(key=lambda p: p.version, reverse=True)
        return matches[0]

    def list_versions(self, name: str) -> list[PromptTemplate]:
        return sorted(
            [p for p in self._prompts.values() if p.name == name],
            key=lambda p: p.version,
        )

    def all_prompts(self) -> list[PromptTemplate]:
        return list(self._prompts.values())

    def for_purpose(self, purpose: str) -> list[PromptTemplate]:
        return [p for p in self._prompts.values() if p.purpose == purpose]


prompt_registry = PromptRegistry()


def build_context(builder: Callable[..., dict[str, Any]], **kwargs: Any) -> dict[str, Any]:
    return builder(**kwargs)
