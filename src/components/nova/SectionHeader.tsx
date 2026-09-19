import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  /** Section label — rendered as an H2 so hierarchy stays semantic. */
  title: string;
  /** Optional supporting copy under the label. */
  description?: string;
  /** Right side: "View all" links, counters, small buttons. */
  action?: ReactNode;
  className?: string;
}

/**
 * Section label inside a page (e.g. "Performance", "Weak areas",
 * "Recommended for you"). Keeps every in-page section header identical.
 */
export function SectionHeader({
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-3 flex items-end justify-between gap-3 sm:mb-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
