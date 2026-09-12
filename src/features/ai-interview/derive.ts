import type {
  AIMessage,
  AISession,
  ResumeData,
  StructuredEvaluation,
} from "@/types";

/**
 * Pure derivation helpers for the interview UI. Kept free of React and
 * network code so the rules (progress math, weak-skill targeting, resume
 * summaries) are deterministic and unit-testable.
 */

export type SessionMeta = Record<string, unknown> | null | undefined;

export function sessionKind(meta: SessionMeta): string {
  const mode = meta?.mode;
  if (mode === "role") return "role";
  if (mode === "case") return "case";
  if (mode === "learning") return "learning";
  return "generative";
}

export function sessionTitle(meta: SessionMeta): string {
  const kind = sessionKind(meta);
  if (kind === "role") return String(meta?.role || meta?.topic || "Interview");
  if (kind === "case") return String(meta?.case_title || meta?.topic || "Case interview");
  return String(meta?.topic || "General interview");
}

/** Interview questions asked so far, from the actual message history. */
export function interviewerQuestionCount(
  messages: Array<{ role: string }>,
): number {
  return messages.filter((m) => m.role === "interviewer").length;
}

/**
 * Progress math — Question N of M. N is always the real number of questions
 * asked (persisted messages); M is the session's configured target, never a
 * made-up number. Returns null when there is no configured target yet.
 */
export function interviewProgress(
  messages: Array<{ role: string }>,
  meta: SessionMeta,
): { asked: number; total: number } | null {
  const asked = interviewerQuestionCount(messages);
  if (asked === 0) return null;
  const raw = meta?.total_questions;
  const total = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(total) || total <= 0) return null;
  return { asked: Math.min(asked, total), total };
}

const META_SKILLS = new Set([
  "communication",
  "confidence",
  "completeness",
  "problem solving",
  "technical knowledge",
  "resume alignment",
  "behavioral",
  "structuring",
  "quantitative analysis",
]);

/**
 * Skill names that describe a learnable topic (SQL, Python, System Design…)
 * rather than an interview meta-dimension (Communication, Confidence…).
 * Interview meta-skills still map to practice, just not to a single topic.
 */
export function isTopicLikeSkill(skill: string): boolean {
  const key = (skill || "").trim().toLowerCase();
  if (!key) return false;
  return !META_SKILLS.has(key);
}

/** Weakest measured skills first — the basis for targeted practice links. */
export function weakestSkills(
  evaluation: Pick<StructuredEvaluation, "skills"> | null | undefined,
  limit = 3,
): Array<{ skill: string; score: number }> {
  const skills = evaluation?.skills ?? [];
  if (skills.length === 0) return [];
  return [...skills]
    .filter((s) => Number.isFinite(s.score))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((s) => ({ skill: s.skill, score: s.score }));
}

export interface PracticeTarget {
  label: string;
  href: string;
  reason?: string;
}

/**
 * Interview → learning loop targets. Derived deterministically from the real
 * evaluation: the weakest measured skills get a Learn link when they are a
 * concrete topic, otherwise the practice hub (weak-area practice).
 */
export function practiceTargets(
  evaluation: Pick<StructuredEvaluation, "skills" | "recommendations"> | null | undefined,
  limit = 3,
): PracticeTarget[] {
  const weak = weakestSkills(evaluation, limit);
  return weak.map((w) =>
    isTopicLikeSkill(w.skill)
      ? {
          label: `Practice ${w.skill}`,
          href: `/learn?topic=${encodeURIComponent(w.skill.trim())}`,
          reason: `Weakest measured area (${w.score}/100)`,
        }
      : {
          label: `Practice ${w.skill}`,
          href: "/practice",
          reason: `Weakest measured area (${w.score}/100)`,
        },
  );
}

export function resumeSummary(r: ResumeData | null | undefined): string {
  if (!r) return "";
  const parts: string[] = [];
  if (r.name) parts.push(r.name);
  if (r.title) parts.push(r.title);
  if (r.skills?.length) parts.push(`${r.skills.length} skills`);
  if (r.projects?.length) parts.push(`${r.projects.length} projects`);
  if (r.experience?.length) parts.push(`${r.experience.length} roles`);
  if (r.technologies?.length) parts.push(`${r.technologies.length} technologies`);
  return parts.length ? parts.join(" · ") : "";
}

/** Safe numeric score for a completed interview session, if one was stored. */
export function storedScore(meta: SessionMeta): number | null {
  const evaluation = meta?.evaluation as { overall_score?: unknown } | undefined;
  const score = evaluation?.overall_score;
  return typeof score === "number" && Number.isFinite(score) ? Math.round(score) : null;
}

export function isInterviewSession(session: Pick<AISession, "session_type">): boolean {
  // Learning-tutor sessions use session_type "learning"; everything stored as
  // "case_interview" is an AI interview (case, role/resume, or topic).
  return session.session_type === "case_interview";
}

/**
 * Returns true when a session should appear in the interview list / recovery
 * banner — i.e. it is a real interview session (not a learning session).
 * Centralised here so AIInterview.tsx and InterviewHistory.tsx stay consistent.
 */
export function isInterviewListable(session: Pick<AISession, "session_type" | "metadata_">): boolean {
  if (!isInterviewSession(session)) return false;
  return sessionKind(session.metadata_ ?? undefined) !== "learning";
}

// ---------------------------------------------------------------------------
// sessionStorage helpers — safety net for duplicate-tab / StrictMode cases.
// The source of truth for "active session" is always GET /api/ai/sessions;
// sessionStorage is only used to guard against double-creates on the same tab.
// ---------------------------------------------------------------------------

const SESSION_STORAGE_KEY = "learnova_active_interview_id";

export function persistActiveSessionId(id: string): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, id);
  } catch {
    // sessionStorage may be blocked (private browsing, storage quota).
  }
}

export function clearActiveSessionId(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // noop
  }
}

export function getStoredActiveSessionId(): string | null {
  try {
    return sessionStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function statusLabel(status: string): string {
  if (status === "active") return "In progress";
  if (status === "completed") return "Completed";
  if (status === "abandoned") return "Abandoned";
  return status;
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
