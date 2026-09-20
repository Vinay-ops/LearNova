# Security launch checklist

Companion to the security implementation. It records the controls that exist,
the ones that are **deliberately not** implemented, and the things that must be
verified in the real deployment — which is the only place they can be verified.

Nothing in this file claims the system is secure. It is a list of what was
built, what is assumed, and what remains open.

---

## 1. Architecture assumptions (state these before trusting anything)

| Assumption | Consequence if wrong |
|---|---|
| The SPA is served over HTTPS by a static host. | `Strict-Transport-Security` matters and mixed content must stay at zero. |
| `JWT_SECRET` is high-entropy and backend-only. | Anyone holding it can mint a token for any user. |
| The database is reachable only by the backend. | Ownership checks in the service layer are the only authorization boundary. |
| The rate limiter runs on a single process, or the platform rate-limits at the edge. | Effective limit becomes `limit × instances`. |
| `ENVIRONMENT=production` is set in production. | Verbose error bodies, verbose `/api/health`, and HSTS gating all misbehave. |

---

## 2. Controls implemented

### Authentication and authorization
- Argon2 password hashing (`argon2-cffi`). Plaintext passwords are never stored
  or logged.
- JWT HS256, `exp` enforced, algorithm **pinned** at decode (`algorithms=["HS256"]`).
  `alg=none` and algorithm-confusion tokens are rejected (tested).
- Identity is always derived from the token. A client-supplied `user_id`, body
  field or header never influences who the request acts as (tested).
- Every user-owned resource is fetched through an ownership-checking service
  method; cross-user access returns 403, not 200 (tested: resumes, progress,
  sessions, quizzes, attempts, applications).

### Input and output
- Pydantic validation on every request body. Validation errors are **scrubbed**
  of submitted values before being returned or logged, so a rejected signup does
  not echo the plaintext password (tested).
- All database access goes through the SQLAlchemy ORM with bound parameters. No
  string-built SQL, no `text()` interpolation of user input, no user-controlled
  sort/order fields (audited).
- AI Markdown is rendered through `react-markdown`, which produces a React
  element tree and never renders embedded HTML — no `dangerouslySetInnerHTML`
  on any user or AI content. URLs pass an explicit allowlist
  (`src/lib/markdown.ts`), so `javascript:`, `data:` and `vbscript:` links are
  dropped (tested with obfuscated payloads including `java\tscript:`).

### Uploads
- Extension allowlist (`.pdf`, `.docx`, `.txt`, `.md`, `.text`) **and** content
  sniffing: a `.pdf` must begin `%PDF-`, a `.docx` must be an OOXML ZIP
  containing `word/document.xml`, and `.txt` must decode as text with no NUL
  bytes.
- Decompression-bomb guards on `.docx`: entry count, declared uncompressed size
  and compression ratio are all checked before python-docx sees the archive.
- 2 MB per-file limit, 4 MB request-body limit.
- Filenames are sanitized (no path separators, no traversal sequences, no
  control characters) and are used for display only — the raw file is never
  written to disk, so a filename can never become a filesystem path.
- Raw parser errors are converted to generic messages; internal paths never
  reach the client.

### Transport, browser and error surfaces
- Security headers on every API response: `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: no-referrer`, `Permissions-Policy` (microphone allowed for
  self, everything else denied), `Cross-Origin-Resource-Policy: same-origin`,
  a `default-src 'none'` CSP for JSON, and `X-Frame-Options: DENY`.
- The SPA's CSP is set where it actually applies: `vercel.json` for production
  and a dev-server plugin in `vite.config.ts` for local parity. The production
  build emits no inline scripts or styles, so the CSP needs no `unsafe-inline`.
- HSTS only when `ENVIRONMENT` is production.
- CORS uses an explicit origin allowlist. `*` is stripped even if configured,
  because the API sends `Access-Control-Allow-Credentials: true` (tested).
- 500 responses in production contain a generic message only — no exception
  class, message or traceback. Full detail goes to the structured server log.
- `/api/health` returns a minimal probe publicly; infrastructure diagnostics
  require `X-Health-Token` or non-production (tested).

### AI
- All system prompts are rendered through `PromptTemplate.render_system`, which
  appends a non-negotiable security boundary declaring user/document content to
  be untrusted data that cannot override instructions (tested for every
  registered prompt).
- No free-form user field is interpolated into any system prompt — verified by
  test, so an injected instruction cannot be hoisted into the instruction layer.
- AI output is data. It is never executed, never becomes SQL, never becomes a
  shell command and never becomes HTML.
- Secrets are never placed in prompts. `GROQ_API_KEY` is read server-side only.

### Abuse control
- Per-user sliding-window limits on all AI endpoints (quiz generation, chat,
  evaluation, feedback, recommendations, resume parse, resume upload, case
  generation).
- Per-account/IP limits on signup and login, keyed by email so rotating source
  IPs does not bypass a login limit.

---

### CSP: the two deliberate exceptions, and the one deployment trap

The SPA policy in `vercel.json` was written against the real bundle, not copied
from a template. Two relaxations are intentional:

- **`style-src 'unsafe-inline'`** — required, not laziness. React applies
  inline `style` attributes (chart bars, score rings, progress widths, table
  column alignment), and an inline `style` attribute is governed by
  `style-src`. Without this the layout breaks. **`script-src` is a bare
  `'self'` with no `unsafe-inline` and no `unsafe-eval`** — that is where XSS
  actually executes, and it is fully locked down.
- **`https://fonts.googleapis.com` / `https://fonts.gstatic.com`** — Inter is
  loaded from Google Fonts in `index.html`, so these are needed. If the font is
  ever self-hosted, remove both entries.

**Deployment trap — `connect-src 'self'`.** The documented deployment routes
`/api/*` to the backend on the same origin (Vercel services), so `'self'` is
correct. If `VITE_API_URL` is ever set to a backend on a *different* origin,
`connect-src 'self'` will block every API call and the app will appear broken
with only CSP violations in the console. Fix by adding that origin to
`connect-src` in `vercel.json` — do not weaken it to `*`.

Note also that `vercel.json` cannot carry comments, which is why the
justifications live here.

---

## 3. Deliberately NOT implemented (documented trade-offs)

These are conscious decisions, not oversights. Each has a trigger that should
force the decision to be revisited.

| Not implemented | Why | Revisit when |
|---|---|---|
| **Server-side JWT revocation / denylist** | Bearer tokens are stateless; logout is client-side. A denylist adds a store every authenticated request must consult. | Any need to force-logout a user (compromise, ban, password change) or when moving to cookie sessions. |
| **Distributed rate limiting (Redis/Upstash)** | The project explicitly avoids adding Redis. Per-process limiting is real protection on one instance and stops runaway clients everywhere. | Running more than one backend instance, or on any platform that fans out lambdas — the effective limit multiplies by instance count. |
| **CSRF tokens** | Authentication is `Authorization: Bearer` from `localStorage`, not cookies, so the browser attaches no ambient credential and classic CSRF does not apply. | If auth ever moves to cookies. Then HttpOnly + Secure + SameSite **and** CSRF protection become mandatory together. |
| **Refresh tokens** | A single 60-minute access token. Simpler, but a token is valid for its full lifetime once issued. | Building "stay logged in", or shortening the token lifetime. |
| **MFA** | Not built. | Any paid tier, or any B2B customer. |
| **Encryption at rest / column-level encryption for resume data** | Relies on the database provider's at-rest encryption. | Handling data that makes provider-level encryption insufficient. |
| **Automated dependency scanning in CI** | Audits were run manually for this review. | Any CI pipeline is set up — see §5 for the exact commands. |
| **Content Security Policy reporting endpoint** | No collector exists. | A CSP report-uri is configured; until then CSP violations are invisible. |

---

## 4. Remaining risks and open items

### Must be verified in the real deployment (cannot be proven here)
1. **Supabase schema is current.** The `resumes` and `readiness_snapshots`
   tables were missing from the live database and caused real 500s. Run
   `alembic upgrade head` and confirm `alembic current` reports head.
2. **Production CORS.** Confirm `FRONTEND_ORIGINS` is set and that a request
   from an unrelated origin receives no `Access-Control-Allow-Origin`.
3. **HTTPS and HSTS.** Confirm the redirect, confirm HSTS only appears once TLS
   is genuinely serving.
4. **`ENVIRONMENT=production`.** Without it, verbose error bodies and the
   verbose health payload are exposed.
5. **`JWT_SECRET`.** Generate with
   `python -c "import secrets; print(secrets.token_urlsafe(64))"`.
   **Important:** an early commit in this repository tracked a `backend/.env`
   containing the placeholder `JWT_SECRET=test-secret-key-for-testing-only`. No
   real secret was ever committed, but if any deployment ever ran with that
   value, every token it issued is forgeable by anyone with repository history —
   rotate it.
6. **Database least privilege.** Confirm the application role is not a superuser
   and cannot create or drop roles.
7. **Security headers on the SPA.** Confirm the `vercel.json` headers appear on
   the HTML document, not just on API responses. Check with `curl -I`.
8. **CSP against the real bundle.** A third-party script or font added later
   will be blocked; check the browser console for CSP violations after the first
   production load. Also confirm `connect-src` still covers the API origin (see
   the `connect-src 'self'` deployment trap above).
9. **Rate limits under real traffic.** Values were tuned for human usage and are
   unvalidated against real patterns. Watch for legitimate 429s.
10. **Voice interview.** Browser speech recognition, microphone permission
    denial and audio cleanup can only be verified in a real browser.

### Known open items
- **Account deletion does not exist**, yet the legal pages reference it. This is
  a launch blocker. See `docs/LEGAL_REVIEW_REQUIRED.md`.
- **Legal text is an unreviewed draft.** See `docs/LEGAL_REVIEW_REQUIRED.md`.
- **`python-jose` has one advisory with no fix** (PYSEC-2025-185 / CVE-2024-29370,
  JWE decompression DoS). Learnova decodes JWS only and never JWEs, so it is not
  reachable. Track upstream and consider migrating to `PyJWT` if it stays open.
- **Pre-existing lint debt.** 16 `@typescript-eslint/no-explicit-any` errors and
  several `react-hooks` warnings remain in page components (`Learn.tsx`,
  `Auth.tsx`, `AIInterview.tsx`, `Progress.tsx`, `Dashboard.tsx`). None affect
  the security posture or the build; they are untidy rather than unsafe.
- **`pip check` reports three pre-existing environment conflicts**
  (`datasets`/`requests`, `mysql-connector-python`/`protobuf`,
  `streamlit`/`starlette`). These come from unrelated packages in a shared
  global Python environment, not from this project's requirements.

---

## 5. Re-running the security verification

```bash
# Backend suite — includes the security regression tests
cd backend && python -m pytest tests -q

# Security suite only
cd backend && python -m pytest tests/test_security.py -q

# Schema is in sync with the models
cd backend && DATABASE_URL="sqlite:///./_check.db" alembic upgrade head
cd backend && DATABASE_URL="sqlite:///./_check.db" alembic check   # "No new upgrade operations"
cd backend && alembic current                                      # head

# Frontend
npm test          # includes Markdown/XSS rendering tests
npm run build
npx tsc -b

# Dependency audit
npm audit
python -m pip install pip-audit && python -m pip_audit -r backend/requirements.txt
```

---

## 6. Response runbook (what to do when something fires)

| Signal | First moves |
|---|---|
| 5xx spike on one route | Check the structured log for the request path and exception class. Confirm the DB schema is current (`alembic current`). Remember production responses deliberately hide the cause — the log has it. |
| 401/403 spike | Suspect token expiry on a long-lived tab, or an ownership bug. 403 across users is a security incident, not a UI bug: capture the user IDs and stop, do not "fix" it by relaxing the check. |
| 429 spike | Distinguish abuse from a limit set too low. Check whether the same account is retrying in a loop before changing any value. |
| Suspected key compromise | Rotate `GROQ_API_KEY`, rotate `JWT_SECRET` (which invalidates every session), rotate the database password, then review the audit log for `login` and `legal_terms_accepted` events. |
| Unexpected prompt behaviour | Treat as a possible prompt-injection attempt. Capture the input and the rendered prompt, then add the payload to the prompt regression suite. |
| Upload errors | Check content sniffing first — a legitimate file failing `_looks_like_pdf` or the `.docx` ZIP check is a false positive worth fixing, not a control to remove. |
