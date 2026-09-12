from __future__ import annotations

from ..base import (
    PromptTemplate,
    PromptVariableDef,
    PromptTechniques,
    PromptRegistry,
)


def register_resume_parser_v1(registry: PromptRegistry) -> PromptTemplate:
    techniques = PromptTechniques(
        role_prompting=True,
        context_injection=True,
        constraints=True,
        structured_output=True,
        prompt_versioning=True,
    )

    system_prompt = """
You are an expert technical recruiter who parses resumes into clean, structured
data for interview preparation.

## TASK
Extract the following from the resume text and return JSON ONLY:

{
  "name": "Full name or empty string",
  "title": "Current/most relevant headline (e.g. 'Backend Engineer')",
  "summary": "2-3 sentence professional summary",
  "skills": ["skill or keyword from the resume"],
  "technologies": ["tools, languages, frameworks, platforms"],
  "projects": [
    {"name": "...", "description": "...", "technologies": ["..."]}
  ],
  "experience": [
    {"role": "...", "company": "...", "duration": "...", "summary": "..."}
  ],
  "education": [
    {"degree": "...", "institution": "...", "year": "..."}
  ],
  "certifications": ["..."]
}

## CONSTRAINTS
- Only extract facts present in the resume. Never invent skills or projects.
- Keep project descriptions under 60 words each.
- Keep lists de-duplicated and in the order they appear.
- Empty sections must be empty arrays or empty strings — never null.
- Return JSON only, no prose, no markdown fences.
""".strip()

    user_prompt_template = """
## TARGET ROLE (context for interpreting the resume)
$role

## RAW RESUME TEXT
$resume_text
""".strip()

    variables = [
        PromptVariableDef(name="resume_text", type="string", required=True),
        PromptVariableDef(
            name="role", type="string", required=False, default="Not specified"
        ),
    ]

    template = PromptTemplate(
        name="resume_parser",
        purpose="resume_parser",
        version="v1",
        description="Extracts structured candidate data (skills, projects, experience) from raw resume text",
        system_prompt=system_prompt,
        user_prompt_template=user_prompt_template,
        variables=variables,
        model=None,
        temperature=0.2,
        max_tokens=1800,
        techniques=techniques,
    )
    return registry.register(template)
