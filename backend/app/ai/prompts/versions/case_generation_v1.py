from __future__ import annotations

from ..base import (
    PromptTemplate,
    PromptVariableDef,
    PromptTechniques,
    PromptRegistry,
)


def register_case_generation_v1(registry: PromptRegistry) -> PromptTemplate:
    techniques = PromptTechniques(
        role_prompting=True,
        context_injection=True,
        constraints=True,
        structured_output=True,
        conditional_prompting=True,
        prompt_versioning=True,
    )

    system_prompt = """
You are an experienced case writer for a top-tier consulting interview preparation platform.
Your job is to produce high-quality, realistic, and solvable case interviews.

## ROLE
- Former MBB recruiter who has written 500+ official cases
- Deep expertise across case types
- Produces cases that are realistic and solvable within the allotted time

## CASE COMPONENTS TO GENERATE
1. Title (catchy, company-based)
2. Company and industry background (1 short paragraph)
3. Client situation / prompt (1 paragraph)
4. Case type and difficulty
5. 4-6 well-structured questions in order:
   - Q1: Structuring / framework
   - Q2: Quantitative / calculation
   - Q3: Deep-dive probe
   - Q4: Business judgment / brainstorm
   - Q5: Synthesis / recommendation
6. Model answer for each question
7. Scoring rubric for each question

## CONSTRAINTS
- Cases MUST be solvable. Do not invent arbitrary data.
- If math is required, include clean numbers that round nicely
- Q2 quantitative should yield a clean integer answer when possible
- Difficulty Easy: ~15 min, 4 questions, simple numbers
- Difficulty Medium: ~25 min, 5 questions
- Difficulty Hard: ~35-40 min, 6 questions, multi-step calculation
- Avoid copyrighted company names (use realistic-sounding fictional firms unless generic)

## OUTPUT FORMAT (JSON ONLY)
{
  "title": "Name of the case",
  "company": "Fictional Company Name",
  "case_type": "Profitability|Market Entry|Growth Strategy|Operations|M&A|Market Sizing|Pricing|New Product",
  "difficulty": "Easy|Medium|Hard",
  "duration_minutes": 25,
  "description": "<one paragraph summary for the library listing>",
  "background": "<industry and client context paragraph>",
  "prompt": "<case prompt as delivered to the candidate>",
  "skills": ["Skill1", "Skill2"],
  "questions": [
    {
      "question_type": "structuring",
      "question_text": "<the question>",
      "model_answer": "<model bullet points>",
      "display_order": 1,
      "time_limit_seconds": 120,
      "rubric": "<scoring criteria>"
    }
  ]
}
""".strip()

    user_prompt_template = """
## GENERATION REQUEST
Case Type: $case_type
Target Difficulty: $difficulty
Target Industry: $industry (if "any", pick a realistic one)
Focus Skills: $focus_skills
Candidate Experience Level: $experience_level
Duration Target: $duration_minutes minutes
""".strip()

    variables = [
        PromptVariableDef(name="case_type", type="string", required=False, default="any",
                          description="Profitability|Market Entry|Growth Strategy|Operations|M&A|Market Sizing|Pricing|New Product|any"),
        PromptVariableDef(name="difficulty", type="string", required=False, default="Medium"),
        PromptVariableDef(name="industry", type="string", required=False, default="any"),
        PromptVariableDef(name="focus_skills", type="string", required=False, default=""),
        PromptVariableDef(name="experience_level", type="string", required=False, default="Intermediate"),
        PromptVariableDef(name="duration_minutes", type="string", required=False, default="25"),
    ]

    template = PromptTemplate(
        name="case_generation",
        purpose="case_generation",
        version="v1",
        description="Generates complete, structured cases with questions, model answers, and rubrics",
        system_prompt=system_prompt,
        user_prompt_template=user_prompt_template,
        variables=variables,
        model=None,
        temperature=0.9,
        max_tokens=3000,  # full case JSON (up to 6 questions + model answers)
        techniques=techniques,
        technique_notes={
            "role_prompting": "Positions AI as an experienced case writer rather than a generic assistant.",
            "constraints": "Solvability and clean-number constraints prevent common 'LLM case' problems like impossible math.",
            "conditional_prompting": "Difficulty, industry, and duration are injected so output adapts to input parameters.",
            "structured_output": "JSON structure matches the DB schema one-to-one, enabling direct persist after validation.",
        },
    )
    return registry.register(template)
