# CasePilot Architecture

## Overview

CasePilot is an AI-powered consulting recruitment training platform. It is built as a clean, layered, monolithic application so it stays understandable as a student project while still being professional and extensible.

```
┌──────────────────────────────────────────────────────────┐
│                        Frontend                          │
│  React 19 + TypeScript + Vite + Tailwind + shadcn/ui     │
│  pages → features/*/api → lib/api-client → Axios        │
└─────────────────────────────┬────────────────────────────┘
                              │ HTTP (JWT Bearer)
┌─────────────────────────────▼────────────────────────────┐
│                        Backend                           │
│  FastAPI + Pydantic v2 + SQLAlchemy 2.x + Alembic        │
│                                                            │
│  api → services → ai → prompts → (LLM client stub)      │
│                │                                           │
│                └→ models ← schemas                        │
│                          ↓                                 │
│                     PostgreSQL (Supabase)                  │
└──────────────────────────────────────────────────────────┘
```

## Backend Layered Architecture

```
backend/app/
├── main.py                  # FastAPI app entry, router registration, bootstrap
│
├── core/                    # Cross-cutting concerns
│   ├── config.py            # Pydantic settings — env only: DATABASE_URL, JWT_SECRET,
│   │                        # GROQ_API_KEY, FRONTEND_URL, ENVIRONMENT (+ defaults)
│   ├── security.py          # Password hashing, JWT creation/verification, get_current_user
│   ├── exceptions.py        # Typed HTTP exceptions (Auth, Authz, NotFound, Conflict, AI, DB, etc.)
│   └── logging.py           # Structured JSON logging + event helpers
│
├── db/
│   ├── database.py          # SQLAlchemy engine, SessionLocal, Declarative Base
│   ├── session.py           # get_db generator + db_session context manager
│   └── base.py              # Re-exports all models so Alembic sees them
│
├── models/                  # SQLAlchemy ORM models (UUID PKs, FKs, cascade)
│   ├── user.py              # User (auth credentials)
│   ├── profile.py           # Profile (user-facing profile, 1:1 to User)
│   ├── skill.py             # Skill + UserSkill (skill scores per user)
│   ├── case.py              # Case, CaseQuestion, CaseAttempt, CaseAnswer
│   ├── assessment.py        # Assessment, AssessmentQuestion, AssessmentAttempt, AssessmentAnswer
│   ├── drill.py             # Drill, DrillQuestion, DrillAttempt
│   ├── application.py       # Application (job tracker)
│   ├── ai_session.py        # AISession, AIMessage (full transcript history)
│   └── prompt.py            # Prompt (prompt-engineered templates stored as records)
│
├── schemas/                 # Pydantic v2 request/response validation
│   ├── auth.py  user.py  profile.py
│   ├── case.py  assessment.py  drill.py
│   ├── application.py  progress.py
│   ├── ai.py  prompt.py
│
├── api/                     # Thin HTTP layer. Delegates to services.
│   ├── auth.py              # /api/auth/*   (signup, login, logout, me)
│   ├── profiles.py          # /api/profile  (get, update)
│   ├── applications.py      # /api/applications CRUD (Phase 2)
│   ├── progress.py          # /api/progress summary + skills (Phase 2)
│   ├── cases.py             # /api/cases/* (Phase 3 stub: returns 501)
│   ├── assessments.py       # /api/assessments/* (Phase 4 stub)
│   ├── drills.py            # /api/drills/* (Phase 5 stub)
│   ├── ai_interview.py      # /api/ai/* (Phase 6-9 stubs)
│   └── prompts.py           # /api/prompts (Phase 6 — registry read-only exposed)
│
├── services/                # Business logic (no HTTP)
│   ├── auth_service.py      # Signup/login/me — reuses existing logic cleanly
│   ├── application_service.py
│   ├── progress_service.py
│   ├── case_service.py      # (stub)
│   ├── assessment_service.py# (stub)
│   ├── drill_service.py     # (stub)
│   ├── scoring_service.py   # Score weighting helpers + AI validation hook
│   └── recommendation_service.py  # (stub)
│
├── ai/                      # Prompt engineering is a FIRST-CLASS concern
│   ├── __init__.py          # bootstrap_prompts(), execute_pipeline exports
│   ├── client.py            # LLMClientProtocol, StubLLMClient (provider pluggable)
│   │                        # GROQ_BASE_URL / GROQ_MODEL code constants
│   │                        # validate_structured_output (retry + log)
│   ├── interviewer.py       # AI interviewer pipeline + context builder
│   ├── evaluator.py         # AI rubric-based evaluator pipeline
│   ├── case_generator.py    # AI case generator pipeline
│   ├── feedback_generator.py# (stub)
│   ├── recommender.py       # (stub)
│   │
│   └── prompts/
│       ├── __init__.py      # Exports base classes
│       ├── base.py          # PromptTemplate, PromptVariableDef, PromptTechniques,
│       │                    # PromptRegistry, build_context()
│       ├── interviewer.py evaluator.py case_generation.py
│       ├── feedback.py      recommendations.py
│       └── versions/        # Versioned prompt templates (source of truth)
│           ├── __init__.py
│           ├── interviewer_v1.py
│           ├── evaluator_v1.py
│           └── case_generation_v1.py
│
├── utils/
│   ├── enums.py             # CaseType, Difficulty, QuestionType, AttemptStatus,
│   │                        # ApplicationStage, AIRole, AISessionType, SkillName,
│   │                        # Trend, PromptPurpose, DrillCategory
│   ├── validators.py        # Email, password, score, UUID, string-length validators
│   └── helpers.py           # UUID, time, clamping, weighted averages
│
└── tests/                   # Test suite (see backend/tests/)
```

## Frontend Architecture

```
src/
├── main.tsx                 # Root: Providers + Router + ErrorBoundary
├── index.css
│
├── app/                     # App-level wiring (no feature code)
│   ├── providers.tsx        # AuthProvider + DataProvider wrapper
│   ├── router.tsx           # All route definitions, lazy-loaded, RequireAuth gates
│   └── _loading.tsx         # Route loading fallback
│
├── pages/                   # Route-level components. THIN. No business logic.
│                            # Delegate to features/* hooks/APIs.
│
├── components/              # Presentational UI components
│   ├── ui/                  # shadcn/ui primitives
│   ├── layout/              # AppLayout, AppSidebar, AppTopNav
│   ├── app/                 # Reusable feature widgets (ScoreRing, SkillBar, Timer…)
│   └── RequireAuth.tsx      # Route guard
│
├── features/                # Feature slices (Repository + API layer)
│   ├── auth/
│   │   ├── api.ts           # AuthRepository → ApiAuthRepository (or mock)
│   │   └── index.ts
│   ├── cases/
│   │   ├── api.ts           # CaseRepository interface
│   │   │                    # ├ MockCaseRepository (wraps mock-data)
│   │   │                    # └ ApiCaseRepository  (Axios → /api/cases/*)
│   │   │                    # USE_API flag selects at runtime.
│   │   └── index.ts
│   ├── assessments/   drills/   applications/   progress/   ai-interview/
│
├── context/                 # LEGACY. Used by pages today.
│   ├── AuthContext.tsx      # Already API-backed. Reuses features/auth internally.
│   └── DataContext.tsx      # Mock-only today; will be replaced by feature APIs
│
├── hooks/
│   ├── use-auth.ts          # useAuth hook
│   └── use-mobile.ts
│
├── lib/
│   ├── api-client.ts        # Singleton Axios instance
│   │                        #   - Bearer token injector
│   │                        #   - 401 auto-clears token
│   │                        #   - extractApiMessage(error, fallback) helper
│   └── utils.ts
│
├── types/                   # Centralized TypeScript interfaces for ALL entities
│   └── index.ts             # User, Profile, Case, Attempt, Answer, AI*, Progress*, *
│
└── data/
    ├── mock-data.ts         # Original mock data (do NOT remove until migrated)
    └── seed-data.ts         # Re-exports mock-data as "seed data" for mocks.
```

## Key Architectural Decisions

1. **Monolith, not microservices.** For a student project, microservices add complexity without benefit. All services run in one FastAPI process.

2. **Repository pattern on the frontend** enables feature-by-feature migration:
   - `MockCaseRepository` uses localStorage/mock data.
   - `ApiCaseRepository` calls `/api/cases/*`.
   - Toggle via single `USE_API` boolean per feature.
   - Pages don't know or care which is active — same interface.

3. **Services layer on backend** keeps API routes thin and testable. Business logic can be unit-tested without HTTP.

4. **Prompt Engineering is first-class.** `app/ai/prompts/versions/` is the *source of truth* for AI behavior. Prompts are versioned, documented with which technique is used and why, and are registered into a `PromptRegistry` at boot.

5. **Strict AI output contracts.** Every important LLM response returns JSON validated by a Pydantic schema. If validation fails, we retry + log + eventually fail — never blindly persist junk.

6. **User ownership enforced on the backend.** All user-scoped queries filter by `current_user.id`, which is derived from JWT. We NEVER trust a `user_id` sent in request body/query params.

7. **UUID PKs everywhere.** Avoids ID enumeration attacks and makes IDs stable across dev/staging/prod imports.

8. **Structured logging.** All log entries are JSON (stackdriver/ELK-ready), with explicit context fields (`user_id`, `prompt_name`, `prompt_version`, `latency_ms`, `tokens_used`). Sensitive fields (passwords, JWTs) are NEVER logged.

9. **Incremental migration.** Phases 3–10 are represented as:
   - Database model stubs (Alembic can generate migrations)
   - Schema stubs (Pydantic contracts in place)
   - Service stubs (raise NotImplementedError)
   - Route stubs (HTTP 501 "Phase N coming soon")
   - Frontend Repository + Api layer stubs
   
   This gives you a clear, non-breaking upgrade path.

## Database Entity Graph

```
User (1)──────(1) Profile
  │
  ├──(N) UserSkill ← (1) Skill  (user scores per skill)
  │
  ├──(N) CaseAttempt ──(N) CaseAnswer
  │         │                ↑
  │         └── Case (1) ─┘    (via CaseQuestion)
  │
  ├──(N) AssessmentAttempt ──(N) AssessmentAnswer
  │         │                    ↑
  │         └── Assessment (1) ─┘
  │
  ├──(N) DrillAttempt
  │         └── Drill (1)
  │
  ├──(N) Applications
  │
  └──(N) AISession ──(N) AIMessage

Prompt ── self-reference for parent version
  └─ referenced by: generated Case, case Attempt evaluation, AISession
```
