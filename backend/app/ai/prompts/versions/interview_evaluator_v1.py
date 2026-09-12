from __future__ import annotations

from ..base import (
    PromptTemplate,
    PromptVariableDef,
    PromptTechniques,
    PromptRegistry,
)


def register_interview_evaluator_v1(registry: PromptRegistry) -> PromptTemplate:
    """Role/resume interview evaluator.

    Shares the evaluator_v1 output contract (StructuredEvaluation) but scores
    the dimensions that matter for a professional role interview: technical
    knowledge, communication, problem solving, confidence, resume alignment and
    completeness.
    """

    techniques = PromptTechniques(
        role_prompting=True,
        context_injection=True,
        constraints=True,
        structured_output=True,
        rubric_based_evaluation=True,
        prompt_versioning=True,
    )

    system_prompt = """
You are a senior hiring manager evaluating a candidate after a professional
role interview. Produce an objective, evidence-based evaluation.

## EVALUATION PROCESS
1. Read the role + resume context in the rubric carefully
2. Read the full interview transcript
3. Score each skill using the bands below, citing specific evidence
4. Resume Alignment rewards answers that connect to the candidate's stated
   skills, projects and experience — penalize generic answers when a relevant
   resume project existed.

## SCORING RUBRIC (0-100)
- 90-100: Exceptional — hire grade
- 80-89: Strong — clear pass
- 70-79: Solid — borderline pass
- 60-69: Developing — needs work
- <60: Below bar — significant gaps

## SKILLS TO SCORE
1. Technical Knowledge
2. Communication
3. Problem Solving
4. Confidence
5. Resume Alignment
6. Completeness

## CONFIDENCE SCORING (IMPORTANT)
Confidence is judged from the transcript language ONLY — clarity, assertiveness,
concreteness, whether the candidate committed to a position. There is NO audio,
tone, or body-language data. Never claim confidence was measured from voice.

## CONSTRAINTS
- Never give a 100 unless the candidate performed flawlessly
- Every score must cite specific evidence from the transcript
- Do not inflate scores for encouragement
- If evidence is missing, score conservatively
- Resume Alignment must reference only facts that appear in the resume block

## OUTPUT FORMAT (JSON ONLY, no prose)
{
  "overall_score": <0-100>,
  "skills": [
    {"skill": "Technical Knowledge", "score": <0-100>, "evidence": "<quote or paraphrase>"}
  ],
  "strengths": ["<specific thing done well>"],
  "improvements": ["<specific, actionable improvement>"],
  "recommendations": ["<specific practice recommendation>"]
}
""".strip()

    user_prompt_template = """
## ROLE + RESUME CONTEXT
$case_rubric

## FULL TRANSCRIPT
$transcript

## CANDIDATE QUESTION-BY-QUESTION ANSWERS
$answers_list

## CANDIDATE PROFILE (for context, NOT for scoring)
Experience: $experience_level
Target: $target_firms
""".strip()

    variables = [
        PromptVariableDef(name="case_title", type="string", required=True),
        PromptVariableDef(name="case_type", type="string", required=True),
        PromptVariableDef(name="case_rubric", type="string", required=True),
        PromptVariableDef(name="model_answers", type="string", required=True),
        PromptVariableDef(name="transcript", type="string", required=True),
        PromptVariableDef(name="answers_list", type="string", required=True),
        PromptVariableDef(name="experience_level", type="string", required=False, default="Unknown"),
        PromptVariableDef(name="target_firms", type="string", required=False, default="Not specified"),
    ]

    template = PromptTemplate(
        name="interview_evaluator",
        purpose="evaluator",
        version="v1",
        description="Rubric-based evaluator for role/resume interviews (technical knowledge, communication, problem solving, confidence, resume alignment, completeness)",
        system_prompt=system_prompt,
        user_prompt_template=user_prompt_template,
        variables=variables,
        model=None,
        temperature=0.2,
        max_tokens=2000,
        techniques=techniques,
    )
    return registry.register(template)
