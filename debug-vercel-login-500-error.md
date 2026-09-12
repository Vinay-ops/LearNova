# Debug Session: vercel-login-500-error

- **Status**: [RESOLVED — missing python-multipart in backend/requirements.txt; add dep and redeploy]
- **Created**: 2026-09-12
- **Session ID**: vercel-login-500-error
- **Symptom**: `POST https://learnova-ai-8.vercel.app/api/auth/login` returns HTTP 500 with no visible error detail in console. Generic "Failed to load resource: the server responded with a status of 500 ()".
- **Expected**: Login returns 200 with access_token + user/profile, or a structured 4xx error with message.
- **Environment**: Vercel production (frontend + FastAPI backend). Supabase Session Pooler (aws-0-ap-southeast-2.pooler.supabase.com) visible in user's screenshot.
- **Local**: 132 backend tests PASS (including auth).

---

## Hypotheses (Falsifiable)

| # | Hypothesis | Predicted Evidence | Falsification |
|---|------------|--------------------|---------------|
| H1 | **`DATABASE_URL` port is 5432 instead of 6543 on pooler** | `error_type = "OperationalError"` with msg containing "timeout" / "Connection refused" / "server closed the connection unexpectedly" / pooler. PG pooler *only* listens on 6543; 5432 on pooler host is closed. | Connection succeeds on 6543, response 200/401 |
| H2 | **`JWT_SECRET` missing / empty** on backend service | `error_type = "JWTError"` or `"TypeError"` with msg "secret must be str" or "algorithm" / `jwt.encode(None, ...)` throws | Login succeeds once JWT_SECRET is set |
| H3 | **`DATABASE_URL` missing `?sslmode=require`** | `error_type = "OperationalError"` "SSL connection is required" from Supabase pooler — pooler enforces SSL. No SSL = connection rejected. | Adding sslmode=require resolves |
| H4 | **`DATABASE_URL` password contains special chars (unencoded)** or password mismatch (was "Reset database password" clicked in Supabase?) | `error_type = "OperationalError"` "password authentication failed" for role "postgres.qzecgwcqakinhdsbhjzk" | Re-encoding password or resetting password + URL resolves |
| H5 | **Frontend `VITE_API_URL` is SET** (non-empty) → wrong host hit | Login 500 but `/api/health` also 404/500 on same origin; or request URL shows a different host prefix than `https://learnova-ai-8.vercel.app/api/...` | Unsetting VITE_API_URL fixes rewrite routing |

---

## Evidence Log

| Time | Event | Detail |
|------|-------|--------|
| - | Hypotheses drafted | H1–H5 above |
| 2026-09-12 | Vercel runtime logs (`vercel logs dpl_…`) | **Root cause:** import crash — `RuntimeError: Form data requires "python-multipart" to be installed` while loading `app/api/ai_interview.py` (`/resume/parse` UploadFile). Entire Lambda exits → `FUNCTION_INVOCATION_FAILED` on every `/api/*` route including login. **Fix:** `python-multipart` in `backend/requirements.txt`, redeploy. Supabase/JWT hypotheses not reached. |
