import { useState } from "react";
import { Check, Copy, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatClockTime } from "@/lib/design";

export type ChatRole = "user" | "assistant" | "interviewer" | "candidate" | "system";

interface ChatMessageProps {
  role: ChatRole;
  content: string;
  /** ISO timestamp — shown on hover / under the bubble when present. */
  createdAt?: string | null;
  /** Label for the speaker, e.g. "AI Interviewer" or "AI Tutor". */
  speakerLabel?: string;
  /** Pending optimistic message (not yet confirmed by the server). */
  pending?: boolean;
  className?: string;
}

const ASSISTANT_ROLES: ChatRole[] = ["assistant", "interviewer", "system"];

/**
 * One transcript bubble. Used by the AI Learning chat, the case interview and
 * the AI mock interview so conversations look identical across the product.
 */
export function ChatMessage({
  role,
  content,
  createdAt,
  speakerLabel,
  pending,
  className,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isAssistant = ASSISTANT_ROLES.includes(role);
  const who = speakerLabel ?? (isAssistant ? "AI" : "You");

  async function copy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  if (role === "system") {
    return (
      <p
        className={cn(
          "mx-auto max-w-md rounded-full bg-muted px-3 py-1 text-center text-[11px] font-medium text-muted-foreground",
          className,
        )}
      >
        {content}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "group flex w-full gap-3",
        isAssistant ? "justify-start" : "justify-end",
        className,
      )}
    >
      {isAssistant ? (
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="size-4" aria-hidden />
        </span>
      ) : null}

      <div
        className={cn(
          "relative min-w-0 max-w-[85%] sm:max-w-[78%]",
          isAssistant ? "items-start" : "items-end",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isAssistant
              ? "rounded-tl-md border border-border bg-card text-foreground"
              : "rounded-tr-md bg-primary text-primary-foreground",
            pending && "opacity-70",
          )}
        >
          <p className="whitespace-pre-wrap break-words">{content}</p>
        </div>

        <div
          className={cn(
            "mt-1 flex items-center gap-2 px-1 text-[10px] text-muted-foreground",
            isAssistant ? "justify-start" : "justify-end",
          )}
        >
          <span className="font-medium">{who}</span>
          {createdAt ? (
            <time dateTime={createdAt}>{formatClockTime(createdAt)}</time>
          ) : null}
          {pending ? <span>· sending…</span> : null}
          {!pending && isAssistant ? (
            <button
              type="button"
              onClick={copy}
              aria-label="Copy message"
              className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 opacity-0 transition-opacity hover:bg-muted focus-visible:opacity-100 group-hover:opacity-100"
            >
              {copied ? (
                <>
                  <Check className="size-3 text-emerald-600" /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-3" /> Copy
                </>
              )}
            </button>
          ) : null}
        </div>
      </div>

      {!isAssistant ? (
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <User className="size-4" aria-hidden />
        </span>
      ) : null}
    </div>
  );
}

interface TypingIndicatorProps {
  label?: string;
  className?: string;
}

/** Pending assistant turn — a chat-specific loading state. */
export function TypingIndicator({
  label = "Thinking…",
  className,
}: TypingIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Sparkles className="size-4" aria-hidden />
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3">
        <span className="sr-only">{label}</span>
        <span className="flex gap-1" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </span>
      </span>
    </div>
  );
}
