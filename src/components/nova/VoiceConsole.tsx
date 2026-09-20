import {
  AlertTriangle,
  Keyboard,
  Loader2,
  Mic,
  MicOff,
  RotateCw,
  Send,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownMessage } from "@/components/nova/MarkdownMessage";

/**
 * The immersive voice-interview surface.
 *
 * Voice is an INPUT METHOD, not a second engine: the browser's speech
 * recognition produces a transcript, the candidate can edit it, and it is
 * submitted through the exact same interview API as a typed answer. No audio
 * ever reaches the backend and there is no separate voice evaluation path.
 *
 * Five states are always explicit so the user is never left guessing:
 *   idle → listening → processing → transcribed → (back to idle)
 * with a self-contained `error` state.
 */

export type VoicePhase = "idle" | "listening" | "processing" | "transcribed" | "error";

interface VoiceConsoleProps {
  /** Browser supports the Web Speech API. */
  supported: boolean;
  listening: boolean;
  /** Live (not yet final) recognition text. */
  interim: string;
  /** User-readable speech error from the hook — never a raw browser error. */
  error: string | null;
  /** True while the interview engine is handling the submitted answer. */
  busy: boolean;
  transcript: string;
  onChangeTranscript: (value: string) => void;
  onStart: () => void;
  onStop: () => void;
  onSubmit: () => void;
  onDiscard: () => void;
  onSwitchToChat: () => void;
  /** The interviewer's current question (Markdown). */
  prompt?: string;
  questionLabel?: string;
}

/** Static bar heights for the animated listening meter. */
const LEVEL_BARS = [10, 20, 30, 20, 12];

export function VoiceConsole({
  supported,
  listening,
  interim,
  error,
  busy,
  transcript,
  onChangeTranscript,
  onStart,
  onStop,
  onSubmit,
  onDiscard,
  onSwitchToChat,
  prompt,
  questionLabel,
}: VoiceConsoleProps) {
  const phase: VoicePhase = busy
    ? "processing"
    : listening
      ? "listening"
      : error
        ? "error"
        : transcript.trim()
          ? "transcribed"
          : "idle";

  // ── Unsupported browser: clean fallback, never a dead end ────────────────
  if (!supported) {
    return (
      <div className="nova-card nova-gradient-surface flex flex-col items-center px-6 py-14 text-center">
        <span className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <MicOff className="size-7" aria-hidden />
        </span>
        <p className="text-lg font-bold text-foreground">Voice isn't available here</p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Speech recognition needs a browser that supports the Web Speech API (Chrome, Edge or
          Safari). You can answer this interview by typing instead — the evaluation is identical.
        </p>
        <Button onClick={onSwitchToChat} className="mt-6 gap-2 rounded-xl font-bold">
          <Keyboard className="size-4" />
          Switch to Chat
        </Button>
      </div>
    );
  }

  const isActive = phase === "listening";

  return (
    <div className="nova-card nova-gradient-surface overflow-hidden">
      <div className="flex flex-col items-center px-6 py-10 sm:px-10 sm:py-14">
        {/* Current question — context so the mic is never anonymous */}
        {prompt ? (
          <div className="mb-10 w-full max-w-xl rounded-2xl border border-border bg-white/80 px-5 py-4 text-left">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {questionLabel ?? "Current question"}
            </p>
            <MarkdownMessage content={prompt} className="text-[13px] text-slate-700 sm:text-sm" />
          </div>
        ) : null}

        {/* Microphone */}
        <div className="relative flex items-center justify-center">
          {/* Soft blue/purple glow */}
          <span
            aria-hidden
            className="pointer-events-none absolute size-40 rounded-full bg-primary/25 blur-3xl sm:size-48"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute size-32 rounded-full bg-accent/20 blur-3xl sm:size-40"
          />

          {isActive ? (
            <>
              <span
                aria-hidden
                className="absolute size-32 animate-ping rounded-full bg-primary/25 sm:size-40"
              />
              <span
                aria-hidden
                className="absolute size-40 animate-pulse rounded-full border border-primary/30 sm:size-48"
              />
            </>
          ) : null}

          <button
            type="button"
            onClick={isActive ? onStop : onStart}
            disabled={phase === "processing"}
            aria-label={isActive ? "Stop listening" : "Start speaking"}
            className={
              isActive
                ? "relative flex size-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-[0_20px_60px_-15px_rgba(37,99,235,0.7)] transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500 disabled:opacity-60 sm:size-40"
                : "relative flex size-32 items-center justify-center rounded-full border border-blue-100 bg-white text-primary shadow-[0_20px_50px_-15px_rgba(37,99,235,0.45)] transition-all hover:scale-[1.03] hover:border-blue-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500 disabled:opacity-60 sm:size-40"
            }
          >
            {phase === "processing" ? (
              <Loader2 className="size-10 animate-spin" aria-hidden />
            ) : (
              <Mic className="size-10 sm:size-12" aria-hidden />
            )}
          </button>
        </div>

        {/* Status + supporting copy */}
        <div className="mt-8 text-center" aria-live="polite">
          {phase === "idle" ? (
            <>
              <p className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Click to start speaking
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                I'm listening to your response and will respond once you finish.
              </p>
            </>
          ) : null}

          {phase === "listening" ? (
            <>
              <p className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Listening…
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Speak naturally. I'll listen until you're finished.
              </p>
              {/* Subtle animated listening indicator */}
              <span aria-hidden className="mt-5 flex items-end justify-center gap-1.5">
                {LEVEL_BARS.map((h, i) => (
                  <span
                    key={i}
                    className="w-1.5 animate-pulse rounded-full bg-primary"
                    style={{ height: `${h}px`, animationDelay: `${i * 140}ms` }}
                  />
                ))}
              </span>
            </>
          ) : null}

          {phase === "processing" ? (
            <>
              <p className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Processing your response…
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                The interviewer is reading your answer and preparing the next question.
              </p>
            </>
          ) : null}
        </div>

        {/* Listening: live interim text + obvious stop control */}
        {phase === "listening" ? (
          <div className="mt-6 w-full max-w-xl">
            {interim ? (
              <p className="mb-4 rounded-xl border border-dashed border-primary/30 bg-white/70 px-4 py-3 text-sm italic text-muted-foreground">
                {interim}
              </p>
            ) : null}
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={onStop}
                className="gap-2 rounded-xl border-slate-200 font-semibold"
              >
                <Square className="size-3.5 fill-current" />
                Finish speaking
              </Button>
            </div>
          </div>
        ) : null}

        {/* Transcribed: the editable transcript card */}
        {phase === "transcribed" ? (
          <div className="mt-6 w-full max-w-xl">
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                You said
              </p>
              <Textarea
                value={transcript}
                onChange={(e) => onChangeTranscript(e.target.value)}
                aria-label="Your transcribed answer"
                className="min-h-[110px] resize-none border-slate-200 bg-slate-50 text-sm focus:bg-white"
              />
              <p className="mt-2 text-[11px] text-muted-foreground">
                Edit anything that was misheard, then send it to the interviewer.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Button
                onClick={onSubmit}
                disabled={!transcript.trim() || busy}
                className="gap-2 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700"
              >
                <Send className="size-4" />
                Send answer
              </Button>
              <Button
                variant="outline"
                onClick={onDiscard}
                disabled={busy}
                className="gap-2 rounded-xl font-semibold"
              >
                <RotateCw className="size-4" />
                Record again
              </Button>
            </div>
          </div>
        ) : null}

        {/* Error: clean inline state, never a raw browser error string */}
        {phase === "error" ? (
          <div
            role="alert"
            className="mt-6 w-full max-w-xl rounded-2xl border border-red-200 bg-red-50/80 px-5 py-4 text-left"
          >
            <p className="flex items-center gap-2 text-sm font-bold text-red-900">
              <AlertTriangle className="size-4 shrink-0" />
              Something went wrong
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-red-700/90">
              {error ?? "We couldn't start the microphone. Please try again."}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={onStart}
                className="gap-2 rounded-xl border-red-200 bg-white font-semibold text-red-700 hover:bg-red-50"
              >
                <RotateCw className="size-4" />
                Try again
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onSwitchToChat}
                className="gap-2 rounded-xl font-semibold text-red-800 hover:bg-red-100"
              >
                <Keyboard className="size-4" />
                Type instead
              </Button>
            </div>
          </div>
        ) : null}

        {/* Always-available escape hatch back to typing */}
        {phase !== "error" ? (
          <button
            type="button"
            onClick={onSwitchToChat}
            className="mt-10 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            <Keyboard className="size-3.5" />
            Switch to Chat
          </button>
        ) : null}
      </div>
    </div>
  );
}
