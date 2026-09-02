# CasePilot API Reference

Base URL defaults:
- Dev backend: `http://localhost:8000`
- Frontend API base is read from `VITE_API_BASE_URL`; defaults to the backend URL above.

All protected routes require a `Authorization: Bearer <token>` header issued from `/api/auth/login` or `/api/auth/signup`.

## Authentication (`/api/auth/*`)

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | No | Create User + Profile, return JWT |
| POST | `/api/auth/login` | No | Exchange email/password for JWT |
| POST | `/api/auth/logout` | Yes | Server-side audit log of logout (client clears token) |
| GET  | `/api/auth/me` | Yes | Return current user + profile |

**Request: `POST /api/auth/signup`**
```json
{ "full_name": "Alex Chen", "email": "alex@example.com", "password": "password123" }
```

**Response: `AuthResponse`**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user":  { "id": "uuid", "email": "alex@example.com", "is_active": true, "created_at": "..." },
  "profile": { "id": "uuid", "user_id": "uuid", "full_name": "Alex Chen", "readiness_score": 0, ... }
}
```

## Profile (`/api/profile`)

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/profile` | Yes | Get current user's profile |
| PUT | `/api/profile` | Yes | Update profile fields (partial) |

## Applications — Phase 2 (`/api/applications`)

Backend CRUD fully implemented. Toggle `USE_API=true` in `src/features/applications/api.ts` to use.

| Method | Route | Auth | Description |
|---|---|---|---|
| GET    | `/api/applications` | Yes | List user's applications |
| GET    | `/api/applications/{id}` | Yes | Get by id (ownership check) |
| POST   | `/api/applications` | Yes | Create |
| PUT    | `/api/applications/{id}` | Yes | Update (partial) |
| DELETE | `/api/applications/{id}` | Yes | Delete |

**`ApplicationCreate`**
```json
{ "company": "BCG", "role": "Associate", "deadline": "2026-09-15", "stage": "Applied", "preparation": 84, "notes": "Referral from Jane D." }
```

## Progress — Phase 2 (`/api/progress`)

| Method | Route | Auth | Description |
|---|---|---|---|
| GET  | `/api/progress` | Yes | Full `ProgressSummary` (readiness, skills, counts, history) |
| POST | `/api/progress/skills` | Yes | Upsert a `UserSkill` score |
| POST | `/api/progress/recalculate-readiness` | Yes | Recompute weighted readiness and save to Profile |

## Cases — Phase 3 stubs (`/api/cases/*`)

All routes return HTTP 501 `"Cases database integration is scheduled for Phase 3. Currently using mock data on the frontend."` Frontend defaults to MockCaseRepository. No UI break.

| Method | Route | Description |
|---|---|---|
| GET  | `/api/cases` | Library listing |
| GET  | `/api/cases/{id}` | Case details + questions |
| POST | `/api/cases/attempts` | Start new attempt |
| GET  | `/api/cases/attempts/{id}` | Attempt state |
| PUT  | `/api/cases/attempts/{id}` | Update attempt state / complete |
| POST | `/api/cases/answers` | Save a per-question answer |

## Assessments — Phase 4 stubs (`/api/assessments/*`)

Same 501 scaffold. Parallel shape to Cases.

| Method | Route |
|---|---|
| GET  | `/api/assessments` |
| GET  | `/api/assessments/{id}` |
| POST | `/api/assessments/attempts` |
| GET  | `/api/assessments/attempts/{id}` |
| PUT  | `/api/assessments/attempts/{id}` |
| POST | `/api/assessments/answers` |

## Drills — Phase 5 stubs (`/api/drills/*`)

| Method | Route |
|---|---|
| GET  | `/api/drills` |
| GET  | `/api/drills/{id}` |
| GET  | `/api/drills/attempts` |
| POST | `/api/drills/attempts` |
| PUT  | `/api/drills/attempts/{id}` |

## AI — Phases 6-9 stubs (`/api/ai/*`)

| Method | Route | Phase | Description |
|---|---|---|---|
| POST | `/api/ai/sessions` | 7 | Start an AI session (case interview/eval) |
| GET  | `/api/ai/sessions` | 7 | List sessions |
| GET  | `/api/ai/sessions/{id}` | 7 | Session state |
| PUT  | `/api/ai/sessions/{id}` | 7 | End / update session |
| GET  | `/api/ai/sessions/{id}/messages` | 7 | Transcript |
| POST | `/api/ai/sessions/{id}/messages` | 7 | Append one message |
| POST | `/api/ai/interview/chat` | 7 | Send candidate msg → get interviewer next question |
| POST | `/api/ai/evaluation` | 8 | Run rubric-based evaluation on a CaseAttempt |
| POST | `/api/ai/feedback` | 8 | Generate coach-style post-case feedback |
| POST | `/api/ai/recommendations` | 9 | Personalized next-steps recommendations |

All currently return 501 with a clear phase message so the frontend repos can flip a single boolean once the service layer ships.

## Prompts — Phase 6 (`/api/prompts`)

**Read-only live routes today** (works via in-memory PromptRegistry). DB persistence for prompts + A/B compare endpoints returns 501 until Phase 6 DB work.

| Method | Route | Auth | Description |
|---|---|---|---|
| GET  | `/api/prompts?purpose=&name=` | Yes | List registered prompt names/versions/techniques |
| GET  | `/api/prompts/{name}/versions` | Yes | Full content of each version with techniques + notes |
| GET  | `/api/prompts/{name}/{version\|latest}` | Yes | Full content of one prompt version |
| POST | `/api/prompts/render` | Yes | Render `{prompt_id, variables}` → system + user prompts |
| POST | `/api/prompts/compare` | Yes | Phase 6 DB work. Side-by-side prompt versions. |
| POST | `/api/prompts` | Yes | Phase 6 DB work. Create persisted prompt. |
| PUT  | `/api/prompts/{id}` | Yes | Phase 6 DB work. Update persisted prompt. |

## Error Responses

All API errors use FastAPI's standard JSON-API style:

```json
{ "detail": <string OR validation_error_list> }
```

Codes:
- `400` — generic bad request
- `401` — missing/invalid JWT. Frontend auto-clears token, redirects to /auth.
- `403` — resource exists but not owned by this user
- `404` — resource not found
- `409` — conflict (e.g., duplicate email on signup)
- `422` — Pydantic validation errors; `detail[]` contains per-field errors
- `501` — stub route for a future phase
- `502` — AI layer failure (LLM provider or validation failures)

All routes NEVER return stack traces in production. Internal stack traces are only visible in structured server logs.

## Health

`GET /api/health` — returns deployment version, current phase, and per-module status:

```json
{
  "status": "ok",
  "version": "0.2.0",
  "phase": "Phase 2 (Applications + Progress) in progress",
  "modules": {
    "auth": "Phase 1 - Complete",
    "profiles": "Phase 1 - Complete",
    "applications": "Phase 2 - API ready",
    "progress": "Phase 2 - API ready",
    "cases": "Phase 3 - Stub routes",
    "assessments": "Phase 4 - Stub routes",
    "drills": "Phase 5 - Stub routes",
    "ai_interview": "Phase 6-7 - Prompt architecture + stub routes",
    "evaluations": "Phase 8 - Stub routes",
    "recommendations": "Phase 9 - Stub routes",
    "prompts": "Phase 6 - Prompt registry exposed"
  }
}
```
