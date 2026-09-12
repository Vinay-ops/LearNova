# AGENTS.md — Learnova

## Database / test lifecycle (footgun)
- pytest's autouse `setup_database` fixture in `backend/tests/conftest.py` drops **all** tables on the shared dev DB (`backend/test_casepilot.db`). After running tests, any running dev backend breaks (tables gone, and `alembic_version` is gone too, so `alembic upgrade head` is a silent no-op).
- Rebuild recipe: kill uvicorn on :8000 → `cd backend && rm -f test_casepilot.db && python -m alembic upgrade head` → restart uvicorn.
- `alembic check` only reports clean when the DB was built by migrations; a pytest `create_all` DB (no alembic_version stamp) makes it report every table as "new upgrade operations". That is expected noise, not drift.
- There is no SQLite separate from dev: the app and tests share `backend/test_casepilot.db` (gitignored; `backend/supabase_schema.sql` is the manual Supabase bootstrap).

## Answer-key contract (assessment/quiz security)
- `GET /api/assessments/{id}/questions` is deliberately sanitized: `correct_option_index`, `correct_answer`, `explanation` are **null** even though the keys exist in the JSON schema. It feeds quiz taking.
- The key is revealed ONLY by `GET /api/assessments/attempts/{id}/review`, gated on ownership + `status == completed` (422 while in progress, 403 for other users).
- The FE must never compute or send `is_correct`/`points_earned` — the server grades `selected_option_index` against the stored key and overrides any client claim (MCQs only). Results page must use the review endpoint, not questions+answers reconstruction.

## Auth API shape (non-obvious)
- `POST /api/auth/login` takes **JSON** `{email, password}` (not OAuth2 form data). Signup requires `full_name` too.
- Frontend stores the JWT in `localStorage["access_token"]`; `AuthContext` rehydrates via `/api/auth/me` and exposes camelCase fields (`user.name`, `profile.experienceLevel`, `targetFirms`, `interviewDate`) as getters over snake_case backend fields — do not look for those keys in raw API responses.
- Rotating `JWT_SECRET` invalidates all existing sessions — expect users to re-login.

## FastAPI route-order shadowing
- In `backend/app/api/{cases,assessments,drills}.py`, static GET routes (e.g. `/attempts`) MUST be declared before parameterized `GET /{id}`, or the static path matches `/{id}` and 404s. The list functions under shadowed routes were never executed until the reorder — they had missing model imports that only surfaced then. Check the same pattern when adding routes.

## Error-code mapping (custom AppError)
- `ValidationError` → 422, `AuthorizationError` → 403, `NotFoundError` → 404, `AuthenticationError` → 401, `AIError`/`AIValidationError` → 502. Tests assert these exact codes.

## Quiz + learning architecture (reused tables, no migration)
- AI-generated quizzes persist as `assessments` rows (title `"<topic> Quiz · <difficulty>"`, `category` = topic, `skill_tag` per question = subtopic) — the existing attempts/answers/scoring stack is reused; `alembic check` stays clean.
- Tutor sessions reuse `ai_sessions`/`ai_messages` with `session_type='learning'`; topic/learner_level live in `metadata_`. Chat history passed to the LLM is the last 12 messages, each truncated (user 800 chars, tutor 1500).
- `POST /api/quizzes/generate`: question_count 3–10 (UI offers 3/5/10; pydantic and service both enforce), difficulties Easy/Medium/Hard. Invalid LLM questions regenerate in bounded rounds (max 2) instead of failing.

## Frontend prod-only rendering bug class
- Route pages mount inside a framer-motion wrapper; on **minified production builds** the enter animation can never fire, leaving content in the DOM at `opacity: 0` (blank screen). Dev server masks it. Fix already applied: `initial={false}` on the wrapper in `src/main.tsx`; keep it.
- To reproduce prod-only issues: `npm run build` then serve `dist/` (e.g. a scratch node server on :5198 that proxies `/api/*` → localhost:8000) and test in a real browser. Plain static serving of `dist/` is the closest local proxy to the Vercel single-project setup.

## Vercel/deployment topology
- `VITE_API_URL` must stay **empty/unset** in Vercel — the api-client uses same-origin `/api/*` and `vercel.json` rewrites to the FastAPI service. Never set localhost.
- Supabase `DATABASE_URL` must be the **Session pooler** host (`aws-0-<region>.pooler.supabase.com:6543`, IPv4) — Vercel Functions are IPv4-only and can't reach Supabase's IPv6 direct-connection host (`2406:` / `db.<ref>.supabase.co:5432`), failing with "Cannot assign requested address". Add `?sslmode=require`; plain `postgresql://` URLs are normalized to psycopg v3 in `app/db/database.py`.
- New tables on Supabase are applied manually via `backend/supabase_schema.sql` (stamps alembic to `0002_remaining_tables`) or `alembic upgrade head` against the pooler URL.

## Windows / Git Bash quirks (dev machine)
- `kill <pid>` does not stop Windows processes from Git Bash — use `taskkill //PID <pid> //F` (double slashes). Find listeners with `netstat -ano | grep ":<port>" | grep LISTEN`.
- Windows `python` in heredocs writes `/tmp/...` to a literal `C:\tmp\...`, which differs from Git Bash's `/tmp` — keep temp files and tokens in the project dir or bash-written `/tmp`.
- Never use `nul` redirects; POSIX syntax only.

## Verification commands
- Backend: `cd backend && python -m pytest -q` (70 tests; quiz/learning tests in `backend/tests/test_learning_quiz.py` use a fake LLM — no network).
- Frontend: `npx tsc -b` then `npm run build` from repo root.
- LLM features return stub content locally until `GROQ_API_KEY` is set — that is the expected fallback behavior (`get_llm_client` → `StubLLMClient`), not a bug.
- Env is consolidated to **6 vars**: backend `DATABASE_URL`, `GROQ_API_KEY`, `JWT_SECRET`, `FRONTEND_URL`, `ENVIRONMENT`; frontend `VITE_API_URL`. Everything else is a code constant — Groq endpoint/model in `backend/app/ai/client.py` (`GROQ_BASE_URL` / `GROQ_MODEL`), log level in `app/core/logging.py` (`LOG_LEVEL`), JWT alg/expiry + `LLM_TEMPERATURE` as `Settings` defaults. There are no OpenRouter vars or client code (it was removed; only a stale pytest-cache nodeid remains).
- Groq model availability changes often: `llama-3.3-70b-versatile` was decommissioned 2026-08-16. Verify ids at console.groq.com/docs/models before editing the `GROQ_MODEL` constant.
- AI provider is Groq via its OpenAI-compatible endpoint, called through the **`openai` SDK** pointed at `GROQ_BASE_URL` (there is no Groq SDK dependency). `GROQ_BASE_URL`/`GROQ_MODEL` are code constants in `backend/app/ai/client.py`; `models/prompt.py`, `db/seed.py`, `BaseLLMClient.DEFAULT_MODEL`, and `GroqLLMClient.DEFAULT_MODEL_FALLBACK` all import them, so a model swap is a one-line edit. A per-prompt `model` field (prompt registry / `prompts` table) still overrides the constant per request, so individual prompts can be re-pointed without a redeploy. Voice/TTS/STT never use this model (browser-native SpeechRecognition).

