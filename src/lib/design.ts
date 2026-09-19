import { cn } from "@/lib/utils";

/**
 * Learnova single source of truth for score / status colour semantics.
 *
 * Every page (Dashboard, Progress, Quiz results, Interview results, History,
 * Practice) reads these helpers so a "78" always looks the same across the
 * product. Thresholds: >=80 strong, >=65 developing, else needs attention.
 */

export type Tone = "strong" | "developing" | "weak" | "neutral";

export interface ToneClasses {
  tone: Tone;
  /** Text colour for scores and numbers. */
  text: string;
  /** Soft background used for chips / tinted surfaces. */
  soft: string;
  /** Solid background used for progress bars and dots. */
  solid: string;
  /** Border colour matched to the tone. */
  border: string;
  /** Human label for screen readers (never colour alone). */
  label: string;
}

export function scoreTone(score: number | null | undefined): Tone {
  if (score == null || !Number.isFinite(score)) return "neutral";
  if (score >= 80) return "strong";
  if (score >= 65) return "developing";
  return "weak";
}

export function toneClasses(tone: Tone): ToneClasses {
  switch (tone) {
    case "strong":
      return {
        tone,
        text: "text-emerald-700 dark:text-emerald-300",
        soft: "bg-emerald-50 dark:bg-emerald-500/10",
        solid: "bg-emerald-500",
        border: "border-emerald-200 dark:border-emerald-500/30",
        label: "Strong",
      };
    case "developing":
      return {
        tone,
        text: "text-amber-700 dark:text-amber-300",
        soft: "bg-amber-50 dark:bg-amber-500/10",
        solid: "bg-amber-500",
        border: "border-amber-200 dark:border-amber-500/30",
        label: "Developing",
      };
    case "weak":
      return {
        tone,
        text: "text-red-700 dark:text-red-300",
        soft: "bg-red-50 dark:bg-red-500/10",
        solid: "bg-red-500",
        border: "border-red-200 dark:border-red-500/30",
        label: "Needs attention",
      };
    default:
      return {
        tone,
        text: "text-muted-foreground",
        soft: "bg-muted",
        solid: "bg-muted-foreground/40",
        border: "border-border",
        label: "No score yet",
      };
  }
}

export function scoreClasses(score: number | null | undefined): ToneClasses {
  return toneClasses(scoreTone(score));
}

/** Tailwind classes for a score chip — includes a text label so status never
 * relies on colour alone. */
export function scoreChipClass(score: number | null | undefined): string {
  const t = scoreClasses(score);
  return cn("border-0 font-semibold", t.soft, t.text);
}

export type Difficulty = "Easy" | "Medium" | "Hard" | string;

export function difficultyClasses(difficulty: Difficulty): string {
  switch (String(difficulty).toLowerCase()) {
    case "easy":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30";
    case "hard":
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30";
  }
}

/**
 * Interview / quiz attempt status. Labels are singular nouns so they read
 * correctly in chips ("In progress", "Completed", "Not started").
 */
export function statusClasses(status: string | null | undefined): string {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30";
    case "active":
    case "in_progress":
    case "paused":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30";
    case "abandoned":
      return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function statusLabel(status: string | null | undefined): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "active":
    case "in_progress":
      return "In progress";
    case "paused":
      return "Paused";
    case "abandoned":
      return "Abandoned";
    case "not_started":
      return "Not started";
    default:
      return status ? String(status) : "Unknown";
  }
}

/* ---------------------------------------------------------------------------
 * Formatting helpers — shared so dates/durations read the same everywhere.
 * ------------------------------------------------------------------------- */

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatClockTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "";
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function percent(value: number | null | undefined, digits = 0): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}
