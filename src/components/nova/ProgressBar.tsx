import { cn } from "@/lib/utils";
import { scoreTone, type Tone } from "@/lib/design";

const BAR_TONES: Record<Tone, string> = {
  strong: "bg-emerald-500",
  developing: "bg-primary",
  weak: "bg-amber-500",
  neutral: "bg-muted-foreground/30",
};

interface ProgressBarProps {
  /** 0-100. Values outside the range are clamped. */
  value: number | null | undefined;
  /** Accessible label, e.g. "Python progress". */
  label?: string;
  size?: "sm" | "md" | "lg";
  /** Colour by score threshold; pass an explicit tone to override. */
  tone?: Tone;
  className?: string;
}

/**
 * Horizontal progress meter. Exposes real ARIA values so the bar reads the
 * same to assistive technology as it does visually.
 */
export function ProgressBar({
  value,
  label,
  size = "md",
  tone,
  className,
}: ProgressBarProps) {
  const safe =
    value == null || !Number.isFinite(value)
      ? 0
      : Math.max(0, Math.min(100, value));
  const resolved = tone ?? scoreTone(value);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safe)}
      aria-label={label}
      className={cn(
        "w-full overflow-hidden rounded-full bg-muted",
        size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          BAR_TONES[resolved],
        )}
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}
