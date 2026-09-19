import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TileTone = "primary" | "accent" | "success" | "warning" | "danger" | "neutral";

const TILE_TONES: Record<TileTone, string> = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
  danger: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300",
  neutral: "bg-muted text-muted-foreground",
};

const TILE_SIZES = {
  sm: "size-9 rounded-xl [&_svg]:size-4",
  md: "size-11 rounded-2xl [&_svg]:size-5",
  lg: "size-14 rounded-2xl [&_svg]:size-6",
} as const;

interface IconTileProps {
  children: ReactNode;
  /** Semantic colour family — matches the meaning of the number beside it. */
  tone?: TileTone;
  size?: keyof typeof TILE_SIZES;
  className?: string;
}

/** Square icon container used on stat cards, list rows and section headers. */
export function IconTile({
  children,
  tone = "primary",
  size = "md",
  className,
}: IconTileProps) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center",
        TILE_SIZES[size],
        TILE_TONES[tone],
        className,
      )}
      aria-hidden
    >
      {children}
    </span>
  );
}
