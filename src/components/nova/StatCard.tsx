import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconTile, type TileTone } from "@/components/nova/IconTile";

interface StatCardProps {
  /** Lucide icon element. */
  icon: ReactNode;
  /** The headline number, already formatted (e.g. "82%", "24", "—"). */
  value: string;
  /** Short label under the number. */
  label: string;
  /** Optional secondary line — trend, context or an explicit empty note. */
  hint?: string;
  tone?: TileTone;
  className?: string;
}

/**
 * Single metric tile used on the Dashboard / Progress summary rows.
 * The value is caller-formatted so no page can invent a number here.
 */
export function StatCard({
  icon,
  value,
  label,
  hint,
  tone = "primary",
  className,
}: StatCardProps) {
  return (
    <div className={cn("nova-card nova-card-interactive p-5", className)}>
      <IconTile tone={tone} size="sm">
        {icon}
      </IconTile>
      <p className="mt-3.5 font-tabular text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
      {hint ? (
        <p className="mt-2 text-[11px] font-medium text-muted-foreground/80">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
