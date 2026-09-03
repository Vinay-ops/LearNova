# CasePilot Prompt Engineering Architecture

CasePilot is being evaluated as an academic Prompt Engineering project in addition to being a real product. This document explains the prompt system: what prompts exist, why each exists, which techniques they apply, how versions are tracked, and the architectural safeguards that keep AI behavior deterministic.

## Guiding Principles

1. **No prompts in business logic.** Every LLM call is backed by a named, versioned `PromptTemplate` stored in `backend/app/ai/prompts/versions/`.
2. **Context builder → Prompt template → LLM → Validator → DB.** Every AI operation follows this pipeline.
3. **Structured output ONLY where structured data is needed.** Free-form responses go through a validator.
4. **Every prompt documents which techniques are used and why.**
5. **Version everything.** Changing a prompt = bumping version. Old versions remain executable for A/B comparison.

## Prompt Architecture

### Directory Layout

```
backend/app/ai/
├── client.py                 # LLMClientProtocol, StubLLMClient,
│                             # validate_structured_output(retry, log)
├── interviewer.py            # Context builder + pipeline for AI interviewer
├── evaluator.py              # Context builder + pipeline for AI evaluator
├── case_generator.py         # Context builder + pipeline for case gen
├── feedback_generator.py     # (stub)
├── recommender.py            # (stub)
│
└── prompts/
    ├── base.py               # PromptTemplate / PromptRegistry / PromptTechniques
    │
    ├── interviewer.py        # Latest stable import path (delegates to version)
    ├── evaluator.py
    ├── case_generation.py
    ├── feedback.py
    ├── recommendations.py
    │
    └── versions/             # Source of truth. Each file registers ONE version
        ├── interviewer_v1.py
        ├── evaluator_v1.py
        └── case_generation_v1.py
```

### Prompt Pipeline

Every AI feature in CasePilot runs through the same pipeline:

```
 User Data
     │
     ▼
 Context Builder      <-- interviewer.py / evaluator.py
     │  Turns domain objects (case, transcript, skills…)
     │  into a flat dict of prompt variables
     ▼
 PromptTemplate.render_system(ctx)
 PromptTemplate.render_user(ctx)
     │  Safe-string substitution via Python string.Template
     │  Missing variables → safe_substitute, no KeyError crash
     ▼
 LLM client              <-- client.py
     │  model, temperature, max_tokens read from PromptTemplate
     │  Latency, tokens, prompt version are all logged
     ▼
 Structured validator    <-- validate_structured_output(schema_model, retries=2)
     │  JSON.parse() then pydantic model_validate()
     │  On failure → log_ai_request(error) → retry
     │  After retries → raise AIValidationError (caller decides recovery)
     ▼
 DB persistence / API response
```

## Prompt Inventory

### 1. `interviewer` (v1) — AI Case Interviewer

| Field | Value |
|---|---|
| **Purpose** | Run realistic one-question-at-a-time case interview |
| **Phase** | Phase 7 |
| **Model** | `GROQ_MODEL` default: `openai/gpt-oss-120b` (override via prompt template) |
| **Temperature** | 0.8 (higher so follow-ups sound natural, not templated) |
| **Output** | `{ question, question_type, display_hint, expected_duration_seconds, notes }` |

**Techniques used and why:**

1. **Role prompting** — "You are a senior management consultant conducting a realistic case interview." Common LLM failure mode is to start coaching/solving the case. A strong role prompt + explicit constraints is the most reliable fix.

2. **Context injection** — Candidate profile (experience, target firms, current performance) + Case information (type, background, rubric) + Conversation history is injected into the user prompt. Without context the LLM has nothing to ground its questions.

3. **Constraints** (enumerated in the system prompt) — "Ask ONE question at a time. Do not solve the case. Stay within case info only. If info missing → say it's unavailable." These constraints are the guardrails on LLM behavior. Without #1 + #3 we regularly get answers from the LLM.

4. **Adaptive prompting** — `current_performance` is threaded in with instructions:
   - Avg < 60 → simplify follow-ups
   - Avg > 85 → add probing questions
   - Adjust vocabulary to experience level.

5. **Conditional prompting** — A single prompt handles all question stages because the rendered context tells it `question_index`/`total_questions` and the list of previous questions.

6. **Structured output** — JSON response schema is enumerated in the system prompt. UI rendering depends on `question_type`; unstructured output would break the case flow.

7. **Prompt versioning** — v1 is explicitly registered. v2 can be added without modifying v1.

**Technique Notes (stored with the prompt)**

| technique | why |
|---|---|
| role_prompting | Prevents the AI from acting as a friendly tutor and giving away answers |
| context_injection | Questions must be grounded in the specific case and candidate |
| constraints | One-question-at-a-time + no hints is a critical UX guarantee |
| structured_output | Enables deterministic UI; no manual regex parsing of free text |
| adaptive_prompting | Strong candidates deserve harder probes; weak candidates need simpler follow-ups |
| conditional_prompting | Same prompt handles intro, structuring, math, synthesis, and wrap-up |

### 2. `evaluator` (v1) — Rubric-based Case Evaluator

| Field | Value |
|---|---|
| **Purpose** | Score a completed case attempt per skill and produce evidence-based feedback |
| **Phase** | Phase 8 |
| **Model** | `GROQ_MODEL` default: `openai/gpt-oss-120b` (override via prompt template) |
| **Temperature** | 0.2 (near-zero to keep scoring deterministic) |
| **Output** | Pydantic `StructuredEvaluation` — `{overall_score, skills[{skill,score,evidence}], strengths, improvements, recommendations}` |

**Techniques used and why:**

1. **Role prompting** — "Senior MBB recruiter, strict and evidence-based." Reduces score inflation LLMs naturally produce.

2. **Rubric-based evaluation** — Explicit 5-band scoring rubric (90–100 offer grade, 80–89 pass, 70–79 borderline, 60–69 developing, <60 below bar) and skill weights. Without a written rubric, evaluations are not comparable across attempts.

3. **Few-shot examples (in-system)** — Prompt includes a worked example: an excerpt transcript → what the evaluation for it looks like with specific evidence quoted. This is the single most effective way to get *evidence-backed* scoring instead of generic "good structuring!" praise.

4. **Constraints** — "Never give 100 unless flawless." "Every score needs a specific evidence quote." "Do not inflate for encouragement."

5. **Context injection** — Case rubric + model answers + full transcript + per-question answers all injected into the user prompt.

6. **Structured output (Pydantic validated)** — `StructuredEvaluation` schema matches the persistence model 1:1. The validator retries JSON parse + Pydantic validate up to 2 times before failing. Evaluation results are persisted; a malformed parse would corrupt DB data.

7. **Prompt versioning** — v1 is explicit. When rubric tweaks are needed (e.g. adjust quant weight), v2 is added and both remain runnable for A/B testing consistency.

**Technique Notes**

| technique | why |
|---|---|
| rubric_based_evaluation | Without explicit rubric bands, LLM scores cluster around 85 and are meaningless |
| few_shot_examples | This is what drives "evidence" fields to be specific transcript quotes rather than generic praise |
| constraints | No-100 and evidence-first rules directly counteract LLM leniency |
| structured_output | Allows direct DB persistence with zero parsing ambiguity |

### 3. `case_generation` (v1) — AI Case Writer

| Field | Value |
|---|---|
| **Purpose** | Generate complete, solvable case packets: title, company, Q1…Q5, model answers, rubrics |
| **Phase** | Phase 6 integration |
| **Model** | `GROQ_MODEL` default: `openai/gpt-oss-120b` (override via prompt template) |
| **Temperature** | 0.9 (high variation for interesting, diverse cases) |
| **Output** | JSON matching the Case + CaseQuestion DB schemas 1:1 |

**Techniques used and why:**

1. **Role prompting** — "Former MBB recruiter / case writer with 500+ official cases to their name." Reduces the "generic textbook case" blandness.

2. **Conditional prompting** — Context injects `case_type`, `difficulty`, `industry`, `duration_minutes`, `experience_level`. Prompt enumerates concrete mappings: Easy=15 min / 4 questions / simple math; Medium=25 min / 5; Hard=35–40 / 6 multi-step.

3. **Constraints** — "Cases must be solvable." "Clean round numbers if math is required." "Avoid copyrighted company names." These address the common "AI case" failure mode where Q2 requires a number that was never given or yields a 7.3214 intermediate.

4. **Structured output** — Output JSON schema matches Case/CaseQuestion schemas directly. After validation the result can be written directly to the DB.

**Prompt-specific quality considerations:**

We intentionally lower temperature for evaluator (0.2) and raise it for case generation (0.9). This is the classic "deterministic vs creative" split.

### 4. `feedback` (v1 stub) and `recommendations` (v1 stub)

Both registered as part of Phase 6 scaffold. Structured output schemas are declared; full prompt text is added when their features ship.

## Prompt Engineering Techniques Inventory

CasePilot is designed to intentionally demonstrate these 10 techniques:

| # | Technique | Where used | Why it matters |
|---|---|---|---|
| 1 | Role prompting | Interviewer, Evaluator, Case Gen | Prevents behavior drift (tutoring, leniency, generic) |
| 2 | Context injection | All prompts | Grounds LLM in the case/candidate/rubric vs hallucinating |
| 3 | Constraints | Interviewer, Evaluator, Case Gen | Enumerated rules are the most reliable guardrails |
| 4 | Few-shot examples | Evaluator v1 (in-system) | Evidence-first scoring, not generic praise |
| 5 | Structured output | All prompts | Pydantic-validated JSON → deterministic DB persistence |
| 6 | Rubric-based evaluation | Evaluator v1 | Scoring bands + weights make evaluations comparable across attempts |
| 7 | Conditional prompting | Interviewer, Case Gen | One prompt handles easy/interview/hard + intro/math/synthesis |
| 8 | Adaptive prompting | Interviewer v1 | Candidate performance adjusts follow-up difficulty |
| 9 | Iterative prompting | Interviewer pipeline (Q→A→Q loop) | Conversation state carried across turns via conversation history |
| 10 | Prompt versioning | All prompts registered in PromptRegistry | Non-destructive evolution + A/B comparison |

## Prompt Registry & Versioning

`PromptRegistry` (in `prompts/base.py`) holds every named PromptTemplate, keyed by `f"{name}_{version}"`.

- `prompt_registry.get("interviewer")` → latest version (sorted by version string desc)
- `prompt_registry.get("interviewer", "v1")` → exact v1
- `prompt_registry.list_versions("interviewer")` → list of all versions
- Route `GET /api/prompts/{name}/versions` → exposes versions for research UI
- Route `GET /api/prompts/{name}/latest` → full prompt content, techniques list, and technique_notes dictionary

**Prompt change workflow**
1. Copy `versions/interviewer_v1.py` → `interviewer_v2.py`
2. Update the body; update `version="v2"`; add to changelog or technique_notes
3. Import+register in `bootstrap_prompts` (it picks them via folder)
4. Compare v1 vs v2 with `POST /api/prompts/compare` + rendered outputs.

## Validation & Failure Handling

`validate_structured_output(raw_content, SchemaModel, max_retries=2)`:

```
Attempt 1: json.loads() → SchemaModel.model_validate()
  ✅ → log_ai_request(success=True) + return
  ❌ → log_ai_request(success=False, error=...)
Attempt 2: (same)
  ❌ → raise AIValidationError
```

Caller (e.g. evaluator service) must decide how to recover:
- Human-facing UI → show toast "AI is being slow; retry"
- Async batch job → mark attempt status=failed + move on

**Never persist unvalidated AI output to DB.** That rule is the single most important guardrail on data quality.

## Logging & Observability

Every LLM call is logged with structured fields:

```json
{
  "timestamp": "...",
  "level": "INFO",
  "logger": "casepilot.ai",
  "message": "ai request",
  "operation": "evaluate",
  "prompt_name": "evaluator",
  "prompt_version": "v1",
  "model": "openai/gpt-oss-120b",
  "latency_ms": 2311,
  "tokens_used": 4812,
  "success": true
}
```

This enables:
- Prompt A/B dashboards: per-prompt latency/cost/failure-rate
- Version regressions: did v2 break JSON parse rate?
- Cost tracing per feature
- Failure alerts on high AIValidationError rate

## Example: Evaluator end-to-end

1. User clicks "Evaluate Case"
2. Frontend → `POST /api/ai/evaluation { case_attempt_id }`
3. Backend service:
   - Fetches Case, Attempt, Answers, candidate Profile from DB
   - Calls `build_evaluator_context(...)` → flat dict
   - Loads `evaluator` prompt (default v1) via `prompt_registry.get("evaluator")`
   - Validates all required variables are present
   - Renders system + user prompts
   - Calls `LLMClient.chat(model=template.model, temperature=template.temperature, ...)`
   - `validate_structured_output(response.content, StructuredEvaluation)` (2 retries)
   - Writes resulting scores to CaseAttempt
   - Writes transcript + evaluation to AISession / AIMessages
   - Returns validated `StructuredEvaluation`
4. Frontend renders Evaluation screen deterministically from the typed response.

## How Prompt Changes Affect Output

Because versioning is explicit, this repo is set up to *show* the effect of prompt engineering choices:

**Old interviewer approach (anti-pattern)** — A short free-text system prompt: "Ask a case interview question." → Outputs vary wildly; often gives the answer; doesn't follow rubric; no JSON contract.

**v1 interviewer prompt** — Role + constraints + context + JSON schema → one question at a time; never gives answer; output is always parseable; difficulty adapts to performance.

You can see the diff by calling `POST /api/prompts/compare` with two versions and the same test variables. Response includes side-by-side rendered prompts + per-field diff.
