import { cn } from "@/lib/utils";
import { scoreClasses } from "@/lib/design";
import { ProgressBar } from "@/components/nova/ProgressBar";

interface SkillBarProps {
  /** Skill name, e.g. "SQL Joins". */
  name: string;
  /** 0-100 measured score. Null renders as "Not measured". */
  score: number | null | undefined;
  /** Optional delta versus the previous measurement. */
  previousScore?: number | null;
  /** Optional short evidence line shown under the name. */
  evidence?: string;
  className?: string;
}

/**
 * A named skill with its measured score, a proportional bar and the change
 * since the last measurement. Reads the shared score semantics so a 78 looks
 * identical here and on the Dashboard.
 */
export function SkillBar({
  name,
  score,
  previousScore,
  evidence,
  className,
}: SkillBarProps) {
  const tone = scoreClasses(score);
  const measured = score != null && Number.isFinite(score);
  const delta =
    measured && previousScore != null && Number.isFinite(previousScore)
      ? score - previousScore
      : null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          {evidence ? (
            <p className="truncate text-xs text-muted-foreground">{evidence}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-baseline gap-2">
          <span
            className={cn(
              "font-tabular text-sm font-semibold",
              measured ? tone.text : "text-muted-foreground",
            )}
          >
            {measured ? Math.round(score) : "—"}
          </span>
          {delta != null && delta !== 0 ? (
            <span
              className={cn(
                "font-tabular text-[11px] font-semibold",
                delta > 0 ? "text-emerald-600" : "text-red-600",
              )}
            >
              {delta > 0 ? "+" : ""}
              {Math.round(delta)}
            </span>
          ) : null}
        </div>
      </div>
      <ProgressBar
        value={measured ? score : 0}
        label={`${name} ${measured ? Math.round(score) : "not measured"}`}
        size="sm"
        tone={tone.tone}
      />
      {!measured ? (
        <p className="text-[11px] text-muted-foreground">Not measured yet</p>
      ) : null}
    </div>
  );
}
