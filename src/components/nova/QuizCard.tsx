import { cn } from "@/lib/utils";
import { DifficultyBadge, ScoreBadge, StatusBadge } from "@/components/nova/Chip";
import { ProgressBar } from "@/components/nova/ProgressBar";

interface QuizCardProps {
  /** Quiz title, e.g. "Python Functions". */
  title: string;
  /** Topic the quiz covers, shown as a secondary label. */
  topic?: string;
  difficulty?: string | null;
  /** Total number of questions in the assessment. */
  questionCount?: number | null;
  /** Correct answers, when the attempt is complete. */
  correctCount?: number | null;
  /** Score 0-100, when measured. */
  score?: number | null;
  /** Attempt status: "completed" | "in_progress" | null. */
  status?: string | null;
  /** Formatted date of the latest attempt. */
  date?: string;
  /** Primary action — label changes with status. */
  onOpen?: () => void;
  actionLabel?: string;
  className?: string;
}

/**
 * Quiz / assessment card used on the Quizzes hub and Dashboard recommendations.
 * Score, counts and status are all caller-supplied real values.
 */
export function QuizCard({
  title,
  topic,
  difficulty,
  questionCount,
  correctCount,
  score,
  status,
  date,
  onOpen,
  actionLabel,
  className,
}: QuizCardProps) {
  const hasScore = score != null && Number.isFinite(score);
  const pct =
    hasScore && correctCount != null && questionCount
      ? score
      : hasScore
        ? score
        : null;

  return (
    <div className={cn("nova-card nova-card-interactive flex flex-col p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          {topic ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{topic}</p>
          ) : null}
        </div>
        {status ? <StatusBadge status={status} /> : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {difficulty ? <DifficultyBadge difficulty={difficulty} /> : null}
        {questionCount != null ? (
          <span className="text-[11px] font-medium text-muted-foreground">
            {questionCount} questions
          </span>
        ) : null}
        {date ? (
          <span className="text-[11px] text-muted-foreground">{date}</span>
        ) : null}
      </div>

      {pct != null ? (
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              Score
            </span>
            <span className="font-tabular text-sm font-semibold text-foreground">
              {correctCount != null && questionCount
                ? `${correctCount} / ${questionCount}`
                : `${Math.round(pct)}%`}
            </span>
          </div>
          <ProgressBar value={pct} label={`${title} score`} size="sm" />
        </div>
      ) : (
        <div className="mt-4">
          <ScoreBadge score={null} label="Quiz score" />
        </div>
      )}

      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          className="mt-4 self-start rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {actionLabel ?? (hasScore ? "Review" : "Start quiz")}
        </button>
      ) : null}
    </div>
  );
}
