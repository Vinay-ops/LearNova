import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Lucide icon element, e.g. <Inbox className="size-6" />. */
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Primary call to action (button/link). */
  action?: ReactNode;
  /** Secondary link rendered under the primary action. */
  secondaryAction?: ReactNode;
  className?: string;
  /** Use "inline" inside a card, "page" for a full-page empty view. */
  variant?: "inline" | "page";
}

/**
 * Intentional empty state used everywhere data can legitimately be absent.
 * Never leaves a blank surface — always explains why and what to do next.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  variant = "inline",
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 text-center",
        variant === "page" ? "px-6 py-16" : "px-6 py-10",
        className,
      )}
    >
      {icon ? (
        <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          {icon}
        </span>
      ) : null}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
      {secondaryAction ? <div className="mt-2.5">{secondaryAction}</div> : null}
    </div>
  );
}
