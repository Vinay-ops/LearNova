import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  difficultyClasses,
  scoreChipClass,
  statusClasses,
  statusLabel,
} from "@/lib/design";

interface ChipProps {
  children: ReactNode;
  className?: string;
}

/** Neutral metadata chip (topic tags, counts, categories). */
export function Chip({ children, className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Easy / Medium / Hard. Colour plus the literal word, never colour alone. */
export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: string | null | undefined;
  className?: string;
}) {
  if (!difficulty) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        difficultyClasses(difficulty),
        className,
      )}
    >
      {difficulty}
    </span>
  );
}

/** Attempt / session status chip with a human label. */
export function StatusBadge({
  status,
  className,
}: {
  status: string | null | undefined;
  className?: string;
}) {
  if (!status) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        statusClasses(status),
        className,
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

/**
 * Score chip. Always renders the number so the chip is self-describing even
 * without colour perception or a legend.
 */
export function ScoreBadge({
  score,
  suffix = "",
  label,
  className,
}: {
  score: number | null | undefined;
  suffix?: string;
  /** Screen-reader context, e.g. "Quiz score". */
  label?: string;
  className?: string;
}) {
  const measured = score != null && Number.isFinite(score);
  return (
    <span
      aria-label={label ? `${label}: ${measured ? Math.round(score) : "no score"}` : undefined}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 font-tabular text-[11px] font-semibold",
        measured ? scoreChipClass(score) : "bg-muted text-muted-foreground",
        className,
      )}
    >
      {measured ? `${Math.round(score)}${suffix}` : "No score"}
    </span>
  );
}
