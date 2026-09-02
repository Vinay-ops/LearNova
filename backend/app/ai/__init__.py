from __future__ import annotations

from typing import Any, Optional

from .client import (
    BaseLLMClient,
    LLMClientProtocol,
    LLMResponse,
    StubLLMClient,
    get_llm_client,
    validate_structured_output,
)
from .prompts.base import (
    PromptTemplate,
    PromptVariableDef,
    PromptTechniques,
    PromptRegistry,
    prompt_registry,
    build_context,
)
from .prompts.interviewer import bootstrap_prompts


def execute_prompt(
    template: PromptTemplate,
    context: dict[str, Any],
    client: Optional[LLMClientProtocol] = None,
) -> LLMResponse:
    client = client or get_llm_client()
    is_valid, errors = template.validate_context(context)
    if not is_valid:
        raise ValueError(f"Invalid prompt context: {'; '.join(errors)}")

    system_prompt = template.render_system(context)
    user_prompt = template.render_user(context) or ""
    return client.chat(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        model=template.model or None,
        temperature=template.temperature,
        max_tokens=template.max_tokens,
    )


__all__ = [
    "BaseLLMClient",
    "LLMClientProtocol",
    "LLMResponse",
    "StubLLMClient",
    "get_llm_client",
    "validate_structured_output",
    "execute_prompt",
    "PromptTemplate",
    "PromptVariableDef",
    "PromptTechniques",
    "PromptRegistry",
    "prompt_registry",
    "build_context",
    "bootstrap_prompts",
]
