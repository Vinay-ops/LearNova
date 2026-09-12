# CasePilot

AI-powered consulting recruitment training platform — case interview practice with cases, assessments, skill drills, AI case interviewer, AI rubric-based evaluation, personalized recommendations, applications tracking, and readiness scoring.

CasePilot is **also an academic Prompt Engineering project**, so prompt architecture is intentionally first-class, versioned, and fully documented.

---

## Architecture Overview (Phase 2 architecture established)

```
┌──────────────────────────────────────────────────────────────────┐
│                       Frontend                                    │
│  React 19 + TS + Vite + Tailwind v4 + shadcn/ui + Router v7       │
│                                                                    │
│  pages/  →  features/*/api  →  lib/api-client  →  Axios (JWT)    │
│    │                                                                │
│    └─ Repository pattern per feature:                              │
│         USE_API=false → Mock*Repository (seed data / localStorage)│
│         USE_API=true  → Api*Repository  (/api/* REST)             │
└───────────────────────────────┬──────────────────────────────────┘
                                │ HTTP JSON
┌───────────────────────────────▼──────────────────────────────────┐
│                       Backend (FastAPI)                           │
│                                                                    │
│  api/*         (thin routes, delegate to services)                │
│      │                                                             │
│  services/*    (business logic, no HTTP)                          │
│      │                                                             │
│      ├─ ai/*        AI pipelines + PromptRegistry + StubLLMClient │
│      └─ models/*    ORM → PostgreSQL (Supabase)                   │
│         schemas/*   Pydantic v2 validation                        │
│                                                                    │
│  core/  (config, security, typed exceptions, structured logging)  │
│  db/    (engine, SessionLocal, Alembic auto-metadata)             │
│  utils/ (enums, validators, helpers)                              │
└──────────────────────────────────────────────────────────────────┘
```

- **Frontend:** React 19, TypeScript, Vite, Tailwind v4, shadcn/ui, React Router v7, Framer Motion, Axios, Sonner, Lucide
- **Backend:** Python 3.11+, FastAPI, SQLAlchemy 2.x, Alembic, Pydantic v2, Argon2, JWT (python-jose)
- **Database:** PostgreSQL hosted on Supabase (NOT Supabase Auth — JWT auth is custom)
- **AI layer:** Dedicated prompt-engineered template system with versioning, registry, context builder → template → LLM → validator → DB pipeline. Calls Groq through the OpenAI-compatible endpoint (`GroqLLMClient`, `GROQ_API_KEY`); falls back to `StubLLMClient` when no key is configured. Any provider implementing `LLMClientProtocol` can be swapped in without touching services.

---

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — full backend/frontend layered architecture, entity graph, design rationale.
- [PROMPT_ENGINEERING.md](./PROMPT_ENGINEERING.md) — prompts inventory, 10 named prompting techniques with examples + explanation, prompt versioning workflow, validation pipeline.
- [API.md](./API.md) — every endpoint: auth, profile, applications, progress, cases, assessments, drills, AI, prompts.

---

## Project layout

```
case-prep-pro/
├── src/
│   ├── main.tsx
│   ├── app/                        # App-level wiring: providers.tsx, router.tsx, _loading
│   ├── pages/                      # Route-level components (THIN — no business logic)
│   ├── components/                 # layout / ui / app widgets / RequireAuth
│   ├── context/                    # AuthContext (API-backed), DataContext (mock — legacy)
│   ├── features/
│   │   ├── auth/api.ts             # AuthRepository + features/auth convenience API
│   │   ├── cases/api.ts            # CaseRepository  Mock  vs  Api  + USE_API flag
│   │   ├── assessments/api.ts      # AssessmentRepository Mock/Api
│   │   ├── drills/api.ts           # DrillRepository Mock/Api
│   │   ├── applications/api.ts     # ApplicationRepository Mock/Api
│   │   ├── progress/api.ts         # ProgressRepository Mock/Api
│   │   └── ai-interview/api.ts     # AIInterviewRepository + /api/prompts wrappers
│   ├── hooks/                      # use-auth, use-mobile
│   ├── lib/                        # api-client.ts (Axios singleton + Bearer + 401 handling), utils.ts
│   ├── types/index.ts              # Centralized TS interfaces for ALL entities
│   └── data/
│       ├── mock-data.ts            # Original seed data (kept working until migrated)
│       └── seed-data.ts            # Re-export gateway for mock data
│
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py                  # Imports ALL models for autogenerate
│   │   ├── script.py.mako
│   │   └── versions/
│   │       └── 0001_initial.py
│   ├── app/
│   │   ├── main.py                 # Startup: logging + bootstrap_prompts() + all routers
│   │   ├── core/
│   │   │   ├── config.py           # Settings (DB, JWT, LLM, CORS, logging level)
│   │   │   ├── security.py         # Argon2, JWT, get_current_user, get_db
│   │   │   ├── exceptions.py       # Typed AppError hierarchy (Auth, Authz, 404, 409, AI, DB, …)
│   │   │   └── logging.py          # Structured JSON logging + event helpers (log_auth_event, etc.)
│   │   ├── db/
│   │   │   ├── database.py         # Engine, SessionLocal, Base
│   │   │   ├── session.py          # get_db + db_session context mgr (auto rollback on exception)
│   │   │   └── base.py             # All models imported → Alembic auto-discovery
│   │   ├── models/                 # 17 SQLAlchemy 2.x models, UUID PKs, FK + cascade
│   │   │   ├── user.py  profile.py  skill.py
│   │   │   ├── case.py             # Case, CaseQuestion, CaseAttempt, CaseAnswer
│   │   │   ├── assessment.py       # Assessment, AssessmentQuestion, AssessmentAttempt, AssessmentAnswer
│   │   │   ├── drill.py            # Drill, DrillQuestion, DrillAttempt
│   │   │   ├── application.py
│   │   │   ├── ai_session.py       # AISession, AIMessage
│   │   │   └── prompt.py
│   │   ├── schemas/                # Pydantic v2 request/response for every domain
│   │   ├── api/                    # 11 route modules (thin, delegate to services)
│   │   │   ├── auth.py  profiles.py  users.py
│   │   │   ├── applications.py  progress.py      (Phase 2 — fully functional)
│   │   │   ├── cases.py  assessments.py  drills.py (Phase 3/4/5 — 501 stubs)
│   │   │   ├── ai_interview.py     (Phase 6-9 stubs)
│   │   │   └── prompts.py          (Phase 6 — READ side fully working via registry)
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── application_service.py  progress_service.py
│   │   │   ├── case_service.py assessment_service.py drill_service.py (stubs)
│   │   │   ├── scoring_service.py  recommendation_service.py
│   │   ├── ai/
│   │   │   ├── client.py           # LLMClientProtocol + StubLLMClient + validate_structured_output
│   │   │   ├── interviewer.py  evaluator.py  case_generator.py
│   │   │   ├── feedback_generator.py  recommender.py
│   │   │   └── prompts/
│   │   │       ├── base.py         # PromptTemplate / PromptTechniques / PromptRegistry / build_context
│   │   │       ├── interviewer.py  evaluator.py  case_generation.py
│   │   │       ├── feedback.py  recommendations.py
│   │   │       └── versions/       # v1 templates for interviewer/evaluator/case_generation/feedback/recommendations
│   │   ├── utils/
│   │   │   ├── enums.py            # CaseType, Difficulty, ApplicationStage, SkillName, Trend, …
│   │   │   ├── validators.py       # Email, password, score, UUID, length, not-empty
│   │   │   └── helpers.py          # now_utc, clamp, weighted_avg, update_model_fields, generate_uuid
│   │   └── tests/
│   │       ├── conftest.py
│   │       ├── test_auth.py  test_profiles.py
│   │       ├── test_cases.py  test_assessments.py  test_drills.py
│   │       ├── test_applications.py
│   │       ├── test_ai.py  test_prompts.py
│
├── ARCHITECTURE.md
├── PROMPT_ENGINEERING.md
├── API.md
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Frontend Conventions

- **Pages** go in `src/pages/`, components in `src/components/`, Shadcn primitives in `src/components/ui/`
- **Routing:** React Router v7 config in `src/main.tsx`. Lazy-load pages with `React.lazy`
- **Auth hook:**
  ```ts
  import { useAuth } from "@/hooks/use-auth"; // or from "@/context/AuthContext"

  const { isLoading, isAuthenticated, user, profile, signIn, signUp, signOut, updateProfile, refreshProfile } = useAuth();
  ```
- **Protected routes:** Wrap JSX in `<RequireAuth>…</RequireAuth>` inside the route element (already done in `main.tsx` for all app routes)
- **UI:** Shadcn UI + Tailwind, Lucide icons, Framer Motion animations, Sonner toasts
  - Mobile responsive first
  - Avoid nested cards and heavy shadows
  - Buttons/interactive elements: `cursor-pointer`, animated on action
  - Headings: `tracking-tight font-bold` or `font-extrabold`
- **Colors/them:** Color variables in `src/index.css` (oklch). Stick to purple + amber/orange theme gradient used on Landing/Auth pages.

---

## Backend API

### Health
- `GET /api/health` → `{"status": "ok"}`

### Auth (public)
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/auth/signup` | `{ full_name, email, password }` | `{ access_token, token_type, user, profile }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ access_token, token_type, user, profile }` |
| POST | `/api/auth/logout` | — | `{ detail }` |
| GET  | `/api/auth/me` | Bearer token | `{ user, profile }` |

Auth status codes:
- 400 invalid body (validated by Pydantic)
- 401 invalid credentials / invalid or missing token
- 409 email already registered on signup

### Profile (requires Bearer token)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/profile` | Returns authenticated user's profile. Ownership via JWT — never trust a client-supplied user_id |
| PUT | `/api/profile` | Updates `full_name`, `avatar_url`, `experience_level`, `target_firms`, `interview_date`. Blocks readiness_score & user_id changes |

Docs (in dev):
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Security
- Passwords hashed with **Argon2** (`argon2-cffi`). **Never stored/returned as plaintext.**
- JWT `sub = str(user.id)`, HS256 signed with `JWT_SECRET` (env-only, NO hardcoded fallbacks)
- Token expiry configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`
- 401 clears the frontend token automatically via the axios interceptor
- CORS origin(s) loaded from `FRONTEND_URL` env (comma-separated supported); defaults NOT `"*"`

---

## Setup & Run

### Frontend

```bash
# from project root
npm install            # install deps
npm run dev            # start Vite on http://localhost:5173
npm run build          # production build
npx tsc -b             # TypeScript check only
```

**Frontend env (optional):**
Create `.env` at project root if backend isn't on default port `8000`:
```
VITE_API_URL=http://localhost:8000
```
(Leave it unset in production — the Vercel services rewrite routes same-origin `/api/*`.)

### Backend

```bash
cd backend

# 1. Install
python -m venv .venv
# Windows:  .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt

# 2. Configure env — copy from example and fill in
cp .env.example .env
# edit .env — required vars:
#   DATABASE_URL=postgres://user:pass@host:port/dbname?sslmode=require   (from Supabase)
#   JWT_SECRET=<strong random string>
#   FRONTEND_URL=http://localhost:5173
#   GROQ_API_KEY=<from https://console.groq.com/keys — blank = stub AI>
#   ENVIRONMENT=development
# Everything else is a code constant: JWT_ALGORITHM / ACCESS_TOKEN_EXPIRE_MINUTES /
# LLM_TEMPERATURE in app/core/config.py, log level in app/core/logging.py, and the
# Groq endpoint + model (GROQ_BASE_URL / GROQ_MODEL) in app/ai/client.py.

# 3. Run migrations against Supabase PostgreSQL
alembic upgrade head

# 4. Start API (auto-reload)
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/docs` to verify the API is up and test signup/login/me/profile endpoints interactively.

---

## Migration command reference

```bash
cd backend

# Apply all migrations
alembic upgrade head

# Roll back one migration
alembic downgrade -1

# Create a NEW auto-migration (after editing SQLAlchemy models)
alembic revision --autogenerate -m "add_table_xyz"
```

---

## Phase Roadmap (10-phase, mandatory sequence per architecture)

- **Phase 1 ✅** — Auth + Profiles. FastAPI, Supabase PostgreSQL, Argon2, JWT. Frontend AuthContext wired. Pages still use mock data for everything else.
- **Phase 2 ✅** (backend architecture established) — Applications CRUD API + Progress/readiness API live at `/api/applications` and `/api/progress`. Services layer exists. Typed exceptions + structured logging. Frontend repository abstraction (Mock* + Api* + USE_API toggle per feature) established across all domains so future phases can migrate pages individually without breaking.
- **Phase 3** — Cases: DB tables, CaseService, full CRUD + attempt/answer APIs. Flip `USE_API=true` in `src/features/cases/api.ts`, update pages to use `casesApi.list/get/...` instead of DataContext.
- **Phase 4** — Assessments tables + service + routes + flip USE_API in assessments feature.
- **Phase 5** — Drills tables + service + routes + flip USE_API in drills feature.
- **Phase 6** — Prompt architecture DB persistence (prompts table + prompt versions + compare endpoints). Already scaffolded: read-side is live via in-memory PromptRegistry; remaining work is write-side + DB persistence.
- **Phase 7** — AI Case Interviewer end-to-end (real LLM client plugged in, AISession/AIMessage persisted, interview turns flow).
- **Phase 8** — AI Evaluation + Feedback. Evaluator pipeline + scoring already designed; plug in LLM and validate StructuredOutput → CaseAttempt.
- **Phase 9** — Adaptive Recommendations. RecommendationService stubs exist; flesh out with real LLM/repository data.
- **Phase 10** — Voice / real-time interview.
- **Later** — Payments (Stripe).

---

## NOT included (out of scope for Phase 1)

Cases, case attempts/answers, assessments, assessment attempts/answers, skill drills, drill attempts, applications DB, AI feedback, voice, embeddings/RAG, vector DB, payments. All of these remain in the existing frontend's mock-data / localStorage layer until explicitly migrated in later phases.

---

## Auth flow (end-to-end)

1. User lands at `/auth` → fills sign up form.
2. `AuthContext.signUp()` → `POST /api/auth/signup` → backend hashes password, inserts user + profile rows, returns `access_token`.
3. Frontend saves token to `localStorage.access_token`.
4. Redirects to `/setup` (ProfileSetup), updates `target_firms`, `experience_level`, `interview_date` via `PUT /api/profile`.
5. Dashboard and all app pages protected by `<RequireAuth>`: if no valid token, redirect to `/auth`.
6. On page refresh: `AuthContext` calls `GET /api/auth/me` with stored Bearer token → restores `user` + `profile` or logs out on 401.
7. Logout: deletes localStorage token, clears React state, redirects to `/auth`.
