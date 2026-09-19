import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  /** Page title — rendered as the single H1 of the view. */
  title: string;
  /** Optional supporting line under the title. */
  subtitle?: string;
  /** Optional icon shown in a tinted tile before the title. */
  icon?: ReactNode;
  /** Right-aligned actions (buttons, filters). Wrap naturally on mobile. */
  actions?: ReactNode;
  /** Optional breadcrumb / eyebrow above the title. */
  eyebrow?: ReactNode;
  className?: string;
}

/**
 * The standard page header used by every authenticated Learnova screen so
 * titles, spacing and action placement are identical across the product.
 */
export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  eyebrow,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3.5">
        {icon ? (
          <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? (
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {eyebrow}
            </div>
          ) : null}
          <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
