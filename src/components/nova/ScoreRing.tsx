import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { scoreTone, type Tone } from "@/lib/design";

const STROKE_TONES: Record<Tone, string> = {
  strong: "text-emerald-500",
  developing: "text-primary",
  weak: "text-amber-500",
  neutral: "text-muted-foreground/40",
};

interface ScoreRingProps {
  /** 0-100. Values outside the range are clamped. */
  value: number | null | undefined;
  /** Outer pixel size of the ring. */
  size?: number;
  /** Stroke thickness in SVG viewBox units (24 is the viewBox edge). */
  strokeWidth?: number;
  /** Optional caption under the number. */
  caption?: string;
  /** Rendered inside the ring instead of the default value text. */
  children?: ReactNode;
  className?: string;
}

/**
 * Circular score indicator for headline results (quiz score, interview score,
 * readiness). Purely presentational — the numeric value is always visible so
 * meaning never depends on colour alone.
 */
export function ScoreRing({
  value,
  size = 132,
  strokeWidth = 8,
  caption,
  children,
  className,
}: ScoreRingProps) {
  const safe =
    value == null || !Number.isFinite(value)
      ? 0
      : Math.max(0, Math.min(100, value));
  const radius = (24 - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (safe / 100) * circumference;

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 flex-col items-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" className="size-full -rotate-90">
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="text-muted"
          stroke="currentColor"
        />
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke="currentColor"
          className={cn(
            "transition-[stroke-dasharray] duration-700 ease-out",
            STROKE_TONES[scoreTone(value)],
          )}
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children ?? (
          <>
            <span className="font-tabular text-3xl font-bold tracking-tight text-foreground">
              {value == null || !Number.isFinite(value) ? "—" : Math.round(safe)}
            </span>
            {caption ? (
              <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {caption}
              </span>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
