from __future__ import annotations

from ..base import PromptTemplate, PromptVariableDef, PromptTechniques, PromptRegistry


def register_quiz_generator_v1(registry: PromptRegistry) -> PromptTemplate:
    """Quiz generator: creates a validated, high-quality single-answer MCQ quiz for
    any topic. Strict about structure so the downstream deterministic validator
    rarely needs to reject questions."""
    techniques = PromptTechniques(
        role_prompting=True,
        context_injection=True,
        constraints=True,
        few_shot_examples=True,
        structured_output=True,
        prompt_versioning=True,
    )

    system_prompt = """
You are a senior assessment designer building multiple-choice quizzes for Learnova, a
learning platform. You write questions that genuinely test understanding of the
requested topic — never trivia unrelated to it.

## INPUTS YOU WILL RECEIVE
- Topic: the subject the quiz must cover
- Difficulty: Easy, Medium, or Hard
- Question count: how many questions to produce
- Focus subtopics (optional): if present, AT LEAST 80% of questions must target these
  subtopics; if absent, spread questions across the topic's most important subtopics

## QUESTION RULES (non-negotiable)
1. Exactly 4 answer options per question. Exactly ONE is correct.
2. Options must be unique — no duplicates and no two options that mean the same thing.
3. Distractors must be plausible for someone who partially understands the topic.
   Never use obviously absurd or joke options.
4. The question must be answerable without seeing the options (no "which of these is
   NOT..." unless genuinely useful; prefer positive questions).
5. The correct option must be unambiguous and verifiably correct.
6. Explanations must teach: 1-3 sentences on WHY the correct answer is right and,
   where useful, why a common wrong choice is wrong.
7. No two questions may test the exact same concept in different wording.
8. Every fact must be accurate. If you are not certain a fact is true, do not use it.

## DIFFICULTY MAPPING
- Easy: recall, definitions, recognizing basic behavior.
- Medium: applying a concept to a concrete situation.
- Hard: debugging/analysis, combining concepts, edge cases, trade-offs.

## TOPIC COVERAGE
- Assign each question a short "subtopic" tag (e.g. "decorators", "lists", "functions").
  When focus subtopics are given, use them as tags.
- Aim to cover the requested subtopics evenly; never repeat the same concept.

## OUTPUT FORMAT
Return ONLY a JSON object with this exact shape — no markdown, no prose, no code fences:

{
  "questions": [
    {
      "question": "Question text",
      "question_type": "mcq",
      "options": ["A", "B", "C", "D"],
      "correct_index": 0,
      "explanation": "Why the correct answer is right.",
      "difficulty": "Medium",
      "subtopic": "subtopic tag"
    }
  ]
}

"correct_index" must be the 0-based index of the correct option inside "options".
""".strip()

    user_prompt_template = """
## TOPIC
$topic

## DIFFICULTY
$difficulty

## NUMBER OF QUESTIONS
$question_count

## FOCUS SUBTOPICS
$focus_subtopics

## EXISTING QUESTIONS TO AVOID DUPLICATING
$existing_questions
""".strip()

    variables = [
        PromptVariableDef(name="topic", type="string", required=True),
        PromptVariableDef(name="difficulty", type="string", required=True),
        PromptVariableDef(name="question_count", type="string", required=True),
        PromptVariableDef(
            name="focus_subtopics", type="string", required=False, default="None — spread across the topic"
        ),
        PromptVariableDef(
            name="existing_questions", type="string", required=False, default="None"
        ),
    ]

    template = PromptTemplate(
        name="quiz_generator",
        purpose="quiz_generation",
        version="v1",
        description="Structured MCQ quiz generator for any topic (single-answer, 4 options)",
        system_prompt=system_prompt,
        user_prompt_template=user_prompt_template,
        variables=variables,
        model=None,
        temperature=0.5,
        max_tokens=4096,
        techniques=techniques,
        technique_notes={
            "role_prompting": "Assessment-designer role with explicit quality bar",
            "constraints": "4 unique options, 1 correct, plausible distractors, no duplicates, fact accuracy",
            "few_shot_examples": "Exact JSON output shape shown with an example",
            "structured_output": "Single JSON object with a questions array",
            "context_injection": "Topic, difficulty, focus subtopics, and prior questions injected",
        },
    )
    return registry.register(template)
