from __future__ import annotations

from ..base import (
    PromptTemplate,
    PromptVariableDef,
    PromptTechniques,
    PromptRegistry,
)


def register_interviewer_v1(registry: PromptRegistry) -> PromptTemplate:
    techniques = PromptTechniques(
        role_prompting=True,
        context_injection=True,
        constraints=True,
        structured_output=True,
        conditional_prompting=True,
        adaptive_prompting=True,
        prompt_versioning=True,
    )

    system_prompt = """
You are a senior management consultant at a top-tier firm conducting a realistic case interview.

## ROLE
- You are the interviewer, not the candidate's coach
- Ask ONE question at a time. Never reveal the answer
- Maintain professional, realistic interview tone
- Follow the case rubric strictly
- Adapt difficulty based on candidate performance

## CONTEXT YOU WILL RECEIVE
- Candidate profile (experience level, target firms, interview date)
- Case information (type, industry, background, questions, rubric)
- Previous answers and scores so far
- Current question position

## CONSTRAINTS
1. Ask only ONE question per response
2. Do not solve the case or give hints
3. Do not break character or reveal internal scoring
4. Stay strictly within the case information provided
5. If candidate asks for information not in the case, say "That information is not available"
6. Keep responses concise (2-4 sentences typically)

## ADAPTIVE BEHAVIOR
- If candidate is struggling with scoring below 60%, simplify follow-ups
- If candidate scores above 85%, add more challenging probing questions
- Adjust vocabulary level to match candidate experience

## OUTPUT FORMAT
Always return valid JSON with this schema:
{
  "question": "<your question text>",
  "question_type": "introduction|structuring|quantitative|probe|synthesis|brainstorm",
  "display_hint": "<optional hint for the UI>",
  "expected_duration_seconds": <recommended seconds>,
  "notes": "<internal notes, empty unless debugging>"
}
""".strip()

    user_prompt_template = """
## CANDIDATE PROFILE
Experience Level: $experience_level
Target Firms: $target_firms
Interview Date: $interview_date
Current Performance Avg: $current_performance

## CASE INFORMATION
Title: $case_title
Company: $case_company
Type: $case_type
Difficulty: $case_difficulty
Background: $case_background

## QUESTIONS IN ORDER
$questions_summary

## PREVIOUS CONVERSATION
$conversation_history

## CURRENT POSITION
Question index: $question_index
Total questions: $total_questions
""".strip()

    variables = [
        PromptVariableDef(name="experience_level", type="string", required=True,
                          description="Candidate's stated experience level"),
        PromptVariableDef(name="target_firms", type="string", required=False, default="",
                          description="Comma-separated list of target firms"),
        PromptVariableDef(name="interview_date", type="string", required=False, default="not set",
                          description="When the candidate's real interview is"),
        PromptVariableDef(name="current_performance", type="string", required=False, default="No prior attempts",
                          description="Average score across attempts"),
        PromptVariableDef(name="case_title", type="string", required=True),
        PromptVariableDef(name="case_company", type="string", required=True),
        PromptVariableDef(name="case_type", type="string", required=True),
        PromptVariableDef(name="case_difficulty", type="string", required=True),
        PromptVariableDef(name="case_background", type="string", required=True),
        PromptVariableDef(name="questions_summary", type="string", required=True),
        PromptVariableDef(name="conversation_history", type="string", required=True),
        PromptVariableDef(name="question_index", type="integer", required=True),
        PromptVariableDef(name="total_questions", type="integer", required=True),
    ]

    template = PromptTemplate(
        name="interviewer",
        purpose="interviewer",
        version="v1",
        description="AI Case Interviewer - conducts realistic case interviews one question at a time",
        system_prompt=system_prompt,
        user_prompt_template=user_prompt_template,
        variables=variables,
        output_schema=None,
        model=None,
        temperature=0.8,
        max_tokens=1200,  # one interview question + JSON envelope
        techniques=techniques,
        technique_notes={
            "role_prompting": "Sets explicit interviewer role with behavioral constraints to prevent the AI from coaching or giving answers.",
            "context_injection": "Injects candidate profile, case data, and conversation history so responses are grounded.",
            "constraints": "Enumerated constraints prevent the common failure mode where LLMs solve the case for the candidate.",
            "structured_output": "JSON output enforces one-question-at-a-time discipline and makes UI rendering deterministic.",
            "adaptive_prompting": "Injects current performance and experience so the LLM adapts follow-up difficulty.",
        },
    )
    return registry.register(template)
