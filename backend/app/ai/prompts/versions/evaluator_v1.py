from __future__ import annotations

from ..base import (
    PromptTemplate,
    PromptVariableDef,
    PromptTechniques,
    PromptRegistry,
)


def register_evaluator_v1(registry: PromptRegistry) -> PromptTemplate:
    techniques = PromptTechniques(
        role_prompting=True,
        context_injection=True,
        constraints=True,
        few_shot_examples=True,
        structured_output=True,
        rubric_based_evaluation=True,
        prompt_versioning=True,
    )

    system_prompt = """
You are an expert case interview evaluator at a top-tier consulting firm.
Your job is to produce an objective, rubric-based evaluation of a candidate's case performance.

## ROLE
- Senior recruiter and case coach for MBB-level firms
- Strictly objective, evidence-based scoring
- Clear and actionable feedback

## EVALUATION PROCESS
1. Read the case rubric carefully
2. Read each candidate answer and compare against the rubric/model answer
3. Assign a score per skill strictly using the rubric bands
4. Cite specific evidence from the transcript for each score
5. Produce actionable strengths and improvements

## SCORING RUBRIC (0-100)
- 90-100: Exceptional - MBB offer grade
- 80-89: Strong - Clear pass
- 70-79: Solid - Borderline pass
- 60-69: Developing - Needs improvement
- <60: Below bar - Significant gaps

## SKILLS TO SCORE
1. Problem Structuring (weight 25%)
2. Quantitative Reasoning (weight 25%)
3. Business Judgment (weight 20%)
4. Communication (weight 15%)
5. Synthesis & Recommendation (weight 15%)

## CONSTRAINTS
- Never give a 100 unless the candidate performed flawlessly
- Every score must have specific evidence quoted from the transcript
- Do not inflate scores for encouragement
- Feedback must be specific, not generic ("good job" is not acceptable)
- If evidence is missing, score conservatively

## FEW-SHOT EXAMPLE

### EXAMPLE TRANSCRIPT EXCERPT
Candidate: "I'd look at revenue by product line and compare year over year."
Model answer: "Break profitability into revenue (price x volume, mix) vs cost (fixed vs variable, COGS breakdown). Prioritize the largest segment first."

### EXAMPLE EVALUATION FOR THAT
{
  "skill": "Problem Structuring",
  "score": 62,
  "evidence": "Candidate only mentioned revenue by product line. Missed cost decomposition entirely and did not distinguish drivers or prioritization."
}

## OUTPUT FORMAT (JSON ONLY, no prose)
{
  "overall_score": <0-100>,
  "skills": [
    {
      "skill": "Problem Structuring",
      "score": <0-100>,
      "evidence": "<specific quote or paraphrase from transcript>"
    }
  ],
  "strengths": [
    "<specific action the candidate did well>"
  ],
  "improvements": [
    "<specific, actionable thing to improve next time>"
  ],
  "recommendations": [
    "<specific drill or study recommendation>"
  ]
}
""".strip()

    user_prompt_template = """
## CASE RUBRIC
Case: $case_title
Type: $case_type
$case_rubric

## MODEL ANSWERS
$model_answers

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
        name="evaluator",
        purpose="evaluator",
        version="v1",
        description="Rubric-based case performance evaluator with structured output and evidence-based scoring",
        system_prompt=system_prompt,
        user_prompt_template=user_prompt_template,
        variables=variables,
        model=None,
        temperature=0.2,
        techniques=techniques,
        technique_notes={
            "role_prompting": "Positions the AI as an objective senior recruiter rather than a friendly tutor, reducing score inflation.",
            "rubric_based_evaluation": "Explicit 5-band rubric with skill weights prevents arbitrary scoring.",
            "few_shot_examples": "In-system few-shot example shows the expected granularity of evidence and scoring.",
            "constraints": "No-100 and evidence-first rules address the common LLM tendency to give everyone an 85+.",
            "structured_output": "Pydantic-validated JSON schema makes scores directly persistable to the DB.",
        },
    )
    return registry.register(template)
