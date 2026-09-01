import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SkillBarProps {
  name: string;
  score: number;
  previousScore?: number;
  showTrend?: boolean;
  highlight?: boolean;
  className?: string;
}

export function SkillBar({
  name,
  score,
  previousScore,
  showTrend = true,
  highlight = false,
  className,
}: SkillBarProps) {
  const diff = previousScore ? score - previousScore : 0;
  const trend = diff > 0 ? "up" : diff < 0 ? "down" : "flat";

  const getBarColor = (score: number) => {
    if (score >= 80) return "bg-emerald-600";
    if (score >= 65) return "bg-primary";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="w-36 shrink-0">
        <span className={cn("text-sm", highlight ? "font-semibold" : "text-muted-foreground")}>
          {name}
        </span>
      </div>
      <div className="flex-1">
        <div className="relative h-2 w-full rounded-full bg-muted">
          <div
            className={cn(
              "absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out",
              getBarColor(score)
            )}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5 w-16 justify-end">
        <span className="text-sm font-semibold tabular-nums">{score}</span>
        {showTrend && previousScore && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs",
              trend === "up" && "text-emerald-600",
              trend === "down" && "text-red-500",
              trend === "flat" && "text-muted-foreground"
            )}
          >
            {trend === "up" && <TrendingUp className="h-3 w-3" />}
            {trend === "down" && <TrendingDown className="h-3 w-3" />}
            {trend === "flat" && <Minus className="h-3 w-3" />}
            {diff !== 0 && (
              <span className="tabular-nums">
                {diff > 0 ? `+${diff}` : diff}
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
