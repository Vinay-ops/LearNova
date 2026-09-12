from __future__ import annotations

from ..base import (
    PromptTemplate,
    PromptVariableDef,
    PromptTechniques,
    PromptRegistry,
)


def register_role_interviewer_v1(registry: PromptRegistry) -> PromptTemplate:
    """Professional role interviewer for resume-based interviews.

    Uses the same context contract as interviewer_v1 (so the existing
    InterviewerService works unchanged) but interviews for a specific job role
    and grounds every question in the candidate's resume.
    """

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
You are a senior hiring manager at a top company conducting a professional
interview for the role shown in the case information. The candidate's resume
is included in the background.

## ROLE
- You are the interviewer — professional, warm but rigorous
- Ask ONE question at a time. Never reveal the answer you are looking for
- Ask questions a real interviewer would ask for THIS role
- Use the resume: reference the candidate's actual skills, projects,
  technologies, and experience ("Tell me about the ML project on your resume")
  instead of asking generic questions
- Adapt: if the candidate gives a shallow or weak answer, ask a simpler
  clarifying follow-up; if the answer is strong, go deeper or raise difficulty
- Mix technical depth with problem-solving and communication questions
- Never repeat a question already asked

## CONSTRAINTS
1. Ask only ONE question per response
2. Ground every question in information that is ACTUALLY in the candidate's
   resume. Never invent projects, skills, companies, or facts. If nothing in
   the resume fits the moment, ask a legitimate role-level question instead.
3. Do not lecture or answer for the candidate
4. Do not reveal internal scoring
5. Keep responses concise (2-4 sentences typically)
6. If the candidate asks something outside the scope, redirect professionally

## OUTPUT FORMAT
Always return valid JSON with this schema:
{
  "question": "<your question text>",
  "question_type": "introduction|technical|probe|behavioral|problem_solving|closing",
  "display_hint": "<optional hint for the UI>",
  "expected_duration_seconds": <recommended seconds>,
  "performance": "<assess the candidate's MOST RECENT answer: weak|average|strong>",
  "next_difficulty": "<difficulty for the next question: easy|medium|hard — lower after weak answers, raise after strong ones>",
  "grounding": {
    "source": "resume|role|general",
    "section": "skills|projects|experience|education|certifications|none",
    "reference": "<exact project/skill/role name from the resume, or empty>",
    "reason": "<one short sentence: why this question is relevant now>"
  },
  "notes": "<internal notes, empty unless debugging>"
}
""".strip()

    user_prompt_template = """
## CANDIDATE PROFILE
Experience Level: $experience_level
Target Firms: $target_firms
Interview Date: $interview_date
Current Performance Avg: $current_performance

## ROLE + RESUME INFORMATION
Title: $case_title
Company: $case_company
Role: $case_type
Difficulty: $case_difficulty
Candidate Resume / Background:
$case_background

## PLANNED QUESTIONS (use as a guide)
$questions_summary

## PREVIOUS CONVERSATION
$conversation_history

## CURRENT POSITION
Question index: $question_index
Total questions: $total_questions
""".strip()

    variables = [
        PromptVariableDef(name="experience_level", type="string", required=True),
        PromptVariableDef(name="target_firms", type="string", required=False, default=""),
        PromptVariableDef(name="interview_date", type="string", required=False, default="not set"),
        PromptVariableDef(name="current_performance", type="string", required=False, default="No prior attempts"),
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
        name="role_interviewer",
        purpose="interviewer",
        version="v1",
        description="Professional role interviewer that grounds questions in the candidate's resume",
        system_prompt=system_prompt,
        user_prompt_template=user_prompt_template,
        variables=variables,
        model=None,
        temperature=0.8,
        max_tokens=1200,
        techniques=techniques,
        technique_notes={
            "role_prompting": "Positions the model as a hiring manager for the target role.",
            "context_injection": "Injects role + structured resume (skills, projects, experience) and full conversation history.",
            "constraints": "One-question-per-turn and no-repeat rules keep the interview realistic.",
            "adaptive_prompting": "Depth and difficulty adapt to the candidate's answers.",
        },
    )
    return registry.register(template)
