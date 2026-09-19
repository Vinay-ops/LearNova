import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Loading surfaces for Learnova. Every one of these replaces an indefinite
 * spinner with a skeleton that mirrors the shape of the content that is
 * arriving, so the layout never jumps and the wait reads as intentional.
 */

interface LoadingStateProps {
  /** Meaningful, specific copy — "Generating quiz…", "Analyzing your interview…". */
  label?: string;
  className?: string;
}

/** Inline status row for a single pending action (button-level waits). */
export function LoadingState({
  label = "Loading…",
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center gap-2.5 rounded-2xl border border-border bg-card px-6 py-10 text-sm font-medium text-muted-foreground",
        className,
      )}
    >
      <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
      {label}
    </div>
  );
}

/** Skeleton for a grid of stat / summary cards. */
export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="nova-card p-5">
          <Skeleton className="mb-4 size-10 rounded-xl" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="mt-2 h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for a vertical list of rows (quizzes, interviews, skills). */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="nova-card divide-y divide-border overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-8 w-20 shrink-0 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for card grids (learning topics, interview roles). */
export function CardGridSkeleton({
  count = 6,
  columns = 3,
}: {
  count?: number;
  columns?: 2 | 3;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2",
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="nova-card space-y-3 p-5">
          <Skeleton className="size-10 rounded-xl" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for a conversation transcript while messages load. */
export function ChatSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}
        >
          <Skeleton
            className={cn("h-16 rounded-2xl", i % 2 === 0 ? "w-3/5" : "w-2/5")}
          />
        </div>
      ))}
    </div>
  );
}
