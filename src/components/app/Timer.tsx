import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerProps {
  elapsed: number;
  total?: number;
  variant?: "default" | "compact" | "countdown";
  className?: string;
}

export function Timer({ elapsed, total, variant = "default", className }: TimerProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (variant === "compact") {
    return (
      <span className={cn("tabular-nums text-sm font-medium", className)}>
        {formatTime(elapsed)}
      </span>
    );
  }

  if (variant === "countdown" && total) {
    const remaining = Math.max(0, total - elapsed);
    const isLow = remaining < 300; // Less than 5 minutes
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Clock className={cn("h-4 w-4", isLow ? "text-red-500" : "text-muted-foreground")} />
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            isLow ? "text-red-500" : "text-foreground"
          )}
        >
          {formatTime(remaining)}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Clock className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium tabular-nums">{formatTime(elapsed)}</span>
    </div>
  );
}
