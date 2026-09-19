import type { ReactNode } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  /** User-facing message. Never pass a raw stack trace here. */
  title?: string;
  message?: string;
  /** Retry handler — renders a "Try again" button when provided. */
  onRetry?: () => void;
  retryLabel?: string;
  /** Optional extra content (e.g. a secondary action). */
  children?: ReactNode;
  className?: string;
}

/**
 * Standard failure surface for API-driven views: network failure, timeout,
 * server error or AI provider error. Always actionable, never a stack trace.
 */
export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this right now. Please try again.",
  onRetry,
  retryLabel = "Try again",
  children,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/70 px-6 py-10 text-center dark:border-red-500/30 dark:bg-red-500/10",
        className,
      )}
    >
      <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300">
        <AlertTriangle className="size-6" />
      </span>
      <p className="text-sm font-semibold text-red-900 dark:text-red-200">{title}</p>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-red-700/90 dark:text-red-200/80">
        {message}
      </p>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          className="mt-5 gap-2 border-red-200 bg-white text-red-700 hover:bg-red-50 dark:bg-transparent dark:text-red-200 dark:hover:bg-red-500/10"
        >
          <RotateCw className="size-4" />
          {retryLabel}
        </Button>
      ) : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
