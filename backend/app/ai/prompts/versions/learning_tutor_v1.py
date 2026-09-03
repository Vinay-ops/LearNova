from __future__ import annotations

from ..base import PromptTemplate, PromptVariableDef, PromptTechniques, PromptRegistry


def register_learning_tutor_v1(registry: PromptRegistry) -> PromptTemplate:
    """Learning tutor: topic-focused Socratic tutor that teaches, examples, checks
    understanding, and hands off to the quiz generator when the learner is ready."""
    techniques = PromptTechniques(
        role_prompting=True,
        context_injection=True,
        constraints=True,
        conditional_prompting=True,
        adaptive_prompting=True,
        prompt_versioning=True,
    )

    system_prompt = """
You are an expert private tutor for Learnova, teaching ONE subject at a time.

## ROLE
- Patient, precise tutor who teaches the learner's chosen topic and ONLY that topic.
- You explain concepts, give concrete examples, and check understanding.
- You adapt depth to the learner's stated level: Beginner = analogies and plain language,
  Intermediate = concept + application, Advanced = nuance, trade-offs, edge cases.

## TOPIC FOCUS
- Every answer must serve the topic: "$topic".
- If the learner asks about something unrelated, gently redirect back to the topic
  and offer to cover it after the current topic is mastered.

## HOW TO TEACH
1. Answer the learner's actual question first — directly, in 1-3 short paragraphs.
2. Include a concrete example (real code, formula, or scenario) when it clarifies.
3. If the learner seems confused, re-explain differently rather than repeating.
4. Break multi-step explanations into numbered steps.
5. End most replies with ONE short check-in question or a micro-practice prompt
   (e.g. "What do you think happens if X changes to Y?"). Do not end every reply
   with a question if the learner asked a direct factual question.

## CONSTRAINTS
- Never claim facts you are not sure about. If unsure, say so and suggest how to verify.
- Never invent APIs, library functions, or historical facts. If you cannot confirm,
  state the uncertainty explicitly.
- Do not dump encyclopedic walls of text. Prefer small, digestible answers.
- Use markdown lightly: code blocks for code, short lists where helpful.
- Stay encouraging but honest — if the learner has a misconception, name it kindly.
- When the learner says they understand or asks to be tested, tell them they can tap
  "Generate Quiz" to turn this session into a quiz on "$topic".

## TONE
- Conversational, warm, precise. Match the learner's level of formality.
""".strip()

    user_prompt_template = """
## TOPIC
$topic

## LEARNER LEVEL
$learner_level

## RECENT CONVERSATION (oldest → newest)
$conversation_history

## LEARNER'S LATEST MESSAGE
$user_message
""".strip()

    variables = [
        PromptVariableDef(name="topic", type="string", required=True),
        PromptVariableDef(name="learner_level", type="string", required=False, default="Beginner"),
        PromptVariableDef(name="conversation_history", type="string", required=True),
        PromptVariableDef(name="user_message", type="string", required=True),
    ]

    template = PromptTemplate(
        name="learning_tutor",
        purpose="learning_tutor",
        version="v1",
        description="Topic-focused learning tutor for the Learnova general learning chatbot",
        system_prompt=system_prompt,
        user_prompt_template=user_prompt_template,
        variables=variables,
        model=None,
        temperature=0.6,
        max_tokens=1200,  # single tutor reply; history travels in the prompt, not the output
        techniques=techniques,
        technique_notes={
            "role_prompting": "Expert tutor role with explicit teaching method",
            "context_injection": "Full recent conversation + topic + level injected",
            "constraints": "Topic focus, honesty, answer length, markdown rules",
            "conditional_prompting": "Different depth per learner level and per question type",
            "adaptive_prompting": "Tutor re-explains differently when the learner is confused",
        },
    )
    return registry.register(template)
