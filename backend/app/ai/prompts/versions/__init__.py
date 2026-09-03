from __future__ import annotations

from ..base import (
    PromptTemplate,
    PromptVariableDef,
    PromptTechniques,
    PromptRegistry,
)


def register_feedback_v1(registry: PromptRegistry) -> PromptTemplate:
    techniques = PromptTechniques(
        role_prompting=True,
        context_injection=True,
        constraints=True,
        structured_output=True,
        prompt_versioning=True,
    )

    system_prompt = """
You are a world-class case coach delivering personalized, constructive feedback to a candidate
right after a case attempt.

## ROLE
- Empathetic but direct coach
- Focus on growth, not judgment
- Connect performance gaps to specific drills

## CONSTRAINTS
- Start with strengths before areas to improve
- Every weakness must have a specific, actionable improvement step
- Recommend exactly 1 next drill from the drill catalog
- Keep the tone encouraging and specific, never generic
- Match language to candidate's experience level

## OUTPUT FORMAT (JSON ONLY)
{
  "overall_score": <0-100>,
  "max_score": 100,
  "skill_breakdown": [
    {"skill": "Structuring", "score": <0-100>, "evidence": "specific quote"}
  ],
  "strengths": ["<specific thing done well>"],
  "biggest_opportunity": {
    "skill": "Synthesis",
    "score": <0-100>,
    "feedback": "<why this is the biggest gap>"
  },
  "better_approach": "<specific alternative approach the candidate could take next time>",
  "recommended_drill": {
    "title": "Drill Title",
    "duration": 10,
    "skill": "Synthesis"
  }
}
""".strip()

    user_prompt_template = """
## CANDIDATE PROFILE
Experience: $experience_level
Target Firms: $target_firms

## CASE ATTEMPT RESULTS
Case: $case_title
Overall: $overall_score / 100
Skill scores:
$skill_scores

Transcript highlights:
$transcript_excerpts

## AVAILABLE DRILLS (pick ONE best next drill)
$drill_catalog
""".strip()

    variables = [
        PromptVariableDef(name="experience_level", type="string", required=False, default="Intermediate"),
        PromptVariableDef(name="target_firms", type="string", required=False, default="Not specified"),
        PromptVariableDef(name="case_title", type="string", required=True),
        PromptVariableDef(name="overall_score", type="string", required=True),
        PromptVariableDef(name="skill_scores", type="string", required=True),
        PromptVariableDef(name="transcript_excerpts", type="string", required=True),
        PromptVariableDef(name="drill_catalog", type="string", required=True),
    ]

    template = PromptTemplate(
        name="feedback",
        purpose="feedback",
        version="v1",
        description="Post-case feedback generator with specific recommendations",
        system_prompt=system_prompt,
        user_prompt_template=user_prompt_template,
        variables=variables,
        model=None,
        temperature=0.5,
        max_tokens=1600,  # structured feedback JSON + recommended drill
        techniques=techniques,
    )
    return registry.register(template)


def register_recommendations_v1(registry: PromptRegistry) -> PromptTemplate:
    techniques = PromptTechniques(
        role_prompting=True,
        context_injection=True,
        structured_output=True,
        prompt_versioning=True,
    )

    system_prompt = """
You are a case interview preparation curriculum designer. Based on the candidate's
performance data, recommend the next best practice actions.

## OUTPUT
{
  "recommended_cases": [{"id": "...", "reason": "..."}],
  "recommended_drills": [{"id": "...", "reason": "..."}],
  "next_best_action": "<single sentence>",
  "reasoning": "<why this sequence>"
}
""".strip()

    user_prompt_template = """
Candidate readiness: $readiness_score / 100
Skill scores:
$skill_scores
Case history:
$case_history
Assessment history:
$assessment_history
Upcoming deadlines:
$upcoming_deadlines
""".strip()

    variables = [
        PromptVariableDef(name="readiness_score", type="string", required=True),
        PromptVariableDef(name="skill_scores", type="string", required=True),
        PromptVariableDef(name="case_history", type="string", required=True),
        PromptVariableDef(name="assessment_history", type="string", required=True),
        PromptVariableDef(name="upcoming_deadlines", type="string", required=False, default="None"),
    ]

    template = PromptTemplate(
        name="recommendations",
        purpose="recommendations",
        version="v1",
        description="Personalized practice recommendation generator",
        system_prompt=system_prompt,
        user_prompt_template=user_prompt_template,
        variables=variables,
        model=None,
        temperature=0.6,
        max_tokens=1200,  # compact recommendation JSON
        techniques=techniques,
    )
    return registry.register(template)
