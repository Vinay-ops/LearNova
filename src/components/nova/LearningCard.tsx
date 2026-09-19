import type { ReactNode } from "react";
import { ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/nova/ProgressBar";
import { IconTile, type TileTone } from "@/components/nova/IconTile";

interface LearningCardProps {
  /** Topic title, e.g. "Python — Object-Oriented Programming". */
  title: string;
  /** Short description of the topic scope. */
  description?: string;
  /** Measured progress 0-100. Null means "not started" — no invented value. */
  progress?: number | null;
  /** Human label for the level, e.g. "Intermediate". */
  level?: string;
  /** Last-studied date string (already formatted). */
  lastStudied?: string;
  /** Number of covered subtopics, when known. */
  topicCount?: number;
  icon?: ReactNode;
  tone?: TileTone;
  /** Primary action label. */
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * A learning topic card for the Learn hub. Progress comes from the caller —
 * this component never derives or fabricates a percentage.
 */
export function LearningCard({
  title,
  description,
  progress,
  level,
  lastStudied,
  topicCount,
  icon,
  tone = "primary",
  actionLabel = "Continue",
  onAction,
  className,
}: LearningCardProps) {
  const measured = progress != null && Number.isFinite(progress);

  return (
    <div
      className={cn(
        "nova-card nova-card-interactive flex flex-col p-5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {icon ? <IconTile tone={tone}>{icon}</IconTile> : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          {description ? (
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {level ? <span className="font-medium">{level}</span> : null}
        {topicCount != null ? <span>{topicCount} topics</span> : null}
        {lastStudied ? (
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" aria-hidden />
            {lastStudied}
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
          <span>{measured ? "Progress" : "Not started"}</span>
          <span className="font-tabular">
            {measured ? `${Math.round(progress)}%` : "—"}
          </span>
        </div>
        <ProgressBar
          value={measured ? progress : 0}
          label={`${title} progress`}
          size="sm"
        />
      </div>

      <button
        type="button"
        onClick={onAction}
        className="mt-4 inline-flex items-center gap-1.5 self-start rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {actionLabel}
        <ArrowRight className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
