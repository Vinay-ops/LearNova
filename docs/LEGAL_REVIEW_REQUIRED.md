# Legal review required — do not launch on this text

**Status: DRAFT. Not reviewed by qualified legal counsel. Not legal advice.**

The shipping Terms & Conditions (`src/pages/Terms.tsx`) and Privacy Policy
(`src/pages/Privacy.tsx`) are *structured placeholders*. They were written to
describe **how the product actually behaves** — what is stored, what is sent to
the AI provider, how consent is recorded — so that a lawyer can review real
behaviour instead of inventing it. They are not binding policy.

Both pages display a prominent "Draft — pending legal review" notice, and every
open question is marked inline as `[REVIEW REQUIRED: …]`. This document collects
those open items so nothing is lost.

**Do not remove the draft notice or this file until the items below are closed
and the reviewed text is published.**

---

## Open items, by document

### Terms & Conditions

| # | Item | Section | Why it matters |
|---|---|---|---|
| T1 | **Minimum age** and any parental-consent requirement | Your account | Age of digital consent varies (13–16 in the EU/UK, 13 in the US under COPPA, higher with local variations). Must be decided, enforced and stated. |
| T2 | **AI-output disclaimer wording** and any required model-output disclosure | AI-generated content | Several jurisdictions now regulate AI disclosure. The current wording is a reasonable plain-language draft, not reviewed language. |
| T3 | **Payment, tax and consumer-cancellation terms** | Fees | The product is free today. These must exist *before* any charge is taken. |
| T4 | **Liability caps and exclusions** | Disclaimers | Enforceability and permissible caps differ sharply by jurisdiction; some consumer protections cannot be excluded at all. |
| T5 | **Governing law and venue** | Governing law | Must be chosen with the incorporating entity and the target market in mind. Currently unset. |
| T6 | **Legal contact address** | Footer | Entity name, registered address and a monitored legal contact are all missing. |
| T7 | **Account-termination and appeal process** | Suspension and termination | Should state notice, appeal route and data-export rights on termination. |

### Privacy Policy

| # | Item | Why it matters |
|---|---|---|
| P1 | **Controller identity and contact details** | Required by GDPR Art. 13 / UK GDPR. Currently unset. |
| P2 | **Lawful basis per processing activity** | Contract vs. legitimate interest must be decided per activity, not asserted globally. |
| P3 | **International transfer mechanism** | Groq (LLM inference) and Supabase (hosting) are US-based processors. Transfers need a documented mechanism (SCCs / DPF status) and a Transfer Impact Assessment. |
| P4 | **Retention schedule** | Needs concrete retention periods for resumes, transcripts, chat messages and readiness snapshots. See "Data lifecycle" below. |
| P5 | **Sub-processor list and change notice** | Groq, Supabase, Vercel. Must be disclosed with an update mechanism. |
| P6 | **Data-subject request process** | Access, rectification, erasure, portability, objection — with an SLA and a named owner. |
| P7 | **Cookie / storage disclosure** | The app uses `localStorage` for the auth token. Whether that requires a consent banner is jurisdiction-specific and must be decided. |
| P8 | **AI-specific disclosures** | What user content is sent to the model, that output is not used for training (confirm with the provider's current terms), and that evaluations are automated with no human reviewer. |
| P9 | **Children's data statement** | Follows from T1. |
| P10 | **Security-incident notification** | 72-hour breach-notification obligations and the internal runbook they depend on. |

---

## Data lifecycle (must be aligned with P4 and P7)

### What is stored today

| Data | Where | Notes |
|---|---|---|
| Email, password hash (Argon2), active flag | `users` | Password is hashed; plaintext is never stored or logged. |
| Terms/Privacy version + acceptance timestamp | `users` | Versioned consent; server timestamp. |
| Full name, avatar URL, experience level, target firms, interview date, readiness score | `profiles` | |
| Resume **structure** (skills, projects, experience), display filename, role | `resumes` | **The raw uploaded file is never persisted** — it is parsed in memory and discarded. |
| Interview sessions, messages, transcripts | `ai_sessions`, `ai_messages` | Includes typed and voice (browser-transcribed) content. |
| Quiz/case/drill attempts, answers, scores | `assessment_*`, `case_*`, `drills` | |
| Readiness snapshots | `readiness_snapshots` | Point-in-time scores. |
| Prompt templates and versions | `prompts` | Contains no user data. |

### What is *not* stored (verified)

- Raw uploaded resume files — parsed in memory, never written to disk.
- Audio from the voice interview — browser speech recognition runs locally; only
  the resulting transcript reaches the server.
- Passwords in plaintext, JWTs, API keys or authorization headers — never logged.
- Request bodies in error logs — validation errors are scrubbed before logging.

### Account deletion — NOT YET IMPLEMENTED

There is no account-deletion endpoint. The Terms and Privacy Policy promise a
deletion route, so this is a **launch blocker**, not a nice-to-have.

A deletion implementation must cover, in dependency order:

1. `resumes`, `assessment_*`, `case_*`, `drills`, `readiness_snapshots`,
   `applications`
2. `ai_messages` (child of `ai_sessions`)
3. `ai_sessions`
4. `profiles`
5. `users`

Because every user-owned table carries a `user_id` foreign key to `users` with
`ON DELETE CASCADE` where declared, the safe shape is an authenticated
`DELETE /api/auth/account` that deletes the `users` row inside one transaction
and lets cascades handle children — with an explicit test asserting that no
rows survive for that `user_id` in any table. Rows whose FK lacks `ON DELETE
CASCADE` must be removed explicitly first.

Decide and document before building:

- **Soft delete vs. hard delete.** Hard delete is simpler to defend in a
  privacy claim; soft delete supports recovery and abuse investigation.
- **Retention obligations.** Billing records, security/audit logs and
  legal-hold data may need to survive account deletion. This must match P4.
- **Confirmation UX.** Deletion must require re-authentication and a typed
  confirmation, and must warn that it is irreversible.
- **Propagation.** Backups and any analytics/warehouse copies need a documented
  expiry, since deleting the primary row does not delete them.

---

## Compliance claims: do not make them yet

The UI and docs must not state or imply that Learnova is "GDPR compliant",
"CCPA compliant", "SOC 2 certified", "HIPAA compliant" or otherwise legally
compliant. No such assessment has been performed. Describing implemented
*controls* (Argon2 hashing, versioned consent, server-side ownership checks) is
accurate; claiming certification or legal compliance is not.

---

## What *is* implemented and worth telling counsel

So the review starts from fact rather than from scratch:

- **Versioned, timestamped consent.** Each document has an explicit version
  (`backend/app/core/legal.py`). Acceptance is recorded per document with a
  server-side UTC timestamp. A version bump re-prompts every user who has not
  accepted the current revision; nothing is auto-accepted.
- **Server-side enforcement.** Consent is validated on `POST /api/auth/signup`
  itself, so it cannot be bypassed by calling the API directly. The client
  cannot supply the version or the timestamp.
- **Data minimisation.** Raw resume files are never written to disk; no audio is
  stored; the AI receives only the text needed for the requested feature.
- **Owner-only access.** Every user-owned resource is scoped by the authenticated
  identity from the JWT, verified by tests (`backend/tests/test_security.py`).
- **No training on user content.** User content is sent to the AI provider only
  to serve the requested feature. This needs confirming against the provider's
  current terms before it is stated publicly (P8).

---

## Sign-off checklist

- [ ] Every `[REVIEW REQUIRED]` marker resolved or deliberately removed
- [ ] T1–T7 and P1–P10 closed
- [ ] Retention schedule agreed and matched to the deletion implementation
- [ ] Account deletion shipped (see above)
- [ ] Entity name, addresses and legal contact inserted
- [ ] Draft notice removed from both pages
- [ ] `TERMS_VERSION` / `PRIVACY_VERSION` bumped to the publication date
- [ ] Counsel sign-off recorded against a specific revision
