import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  AlertTriangle,
  PlayCircle,
  Eye,
  Trash2,
  Mic,
  MessageSquare,
  FileText,
  BookOpen,
  Clock,
  ChevronRight,
} from "lucide-react";
import { aiInterviewApi } from "@/features/ai-interview";
import {
  formatDate,
  isInterviewListable,
  scoreBadgeClass,
  sessionKind,
  sessionTitle,
  statusBadgeClass,
  statusLabel,
  storedScore,
} from "@/features/ai-interview/derive";
import { extractApiMessage } from "@/lib/api-client";
import type { AISession } from "@/types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function modeLabel(session: AISession): string {
  const kind = sessionKind(session.metadata_ ?? undefined);
  if (kind === "role") return "Resume / Role";
  if (kind === "case") return "Case";
  return "Chat";
}

/** Tile tone reuses the app palette: amber = in progress, purple = role, blue = case. */
function modeIconTone(kind: string, isActive: boolean): string {
  if (isActive) return "bg-amber-50 text-amber-600";
  if (kind === "role") return "bg-purple-50 text-purple-600";
  if (kind === "case") return "bg-blue-50 text-blue-600";
  return "bg-slate-50 text-slate-500";
}

function ModeIcon({ kind }: { kind: string }) {
  // Rendered at 16px (h-4) — large enough that role/case/chat stay
  // distinguishable inside the 40px tile.
  if (kind === "role") return <FileText className="h-4 w-4" />;
  if (kind === "case") return <BookOpen className="h-4 w-4" />;
  return <MessageSquare className="h-4 w-4" />;
}

/** Score/status colours come from derive.ts so they match Progress everywhere. */
function ScoreBadge({ score }: { score: number }) {
  return (
    <Badge
      variant="secondary"
      className={cn("text-[11px] font-bold", scoreBadgeClass(score))}
    >
      {score}/100
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn("text-[11px] font-semibold", statusBadgeClass(status))}
    >
      {statusLabel(status)}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InterviewHistory() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<AISession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Delete is destructive — never fire it on a single click.
  const [pendingDelete, setPendingDelete] = useState<AISession | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await aiInterviewApi.listSessions("");
      setSessions(all);
    } catch (e: any) {
      setError(extractApiMessage(e, "Could not load your interview history."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Apply the same filter used in AIInterview.tsx: exclude learning sessions.
  const interviews = useMemo(
    () => sessions.filter(isInterviewListable),
    [sessions],
  );

  const confirmDelete = async (session: AISession) => {
    setPendingDelete(null);
    setDeletingId(session.id);
    try {
      await aiInterviewApi.deleteSession(session.id);
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
    } catch (e: any) {
      setError(extractApiMessage(e, "Could not delete the interview."));
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Navigate to /interview and pass the session via location state so
   * AIInterview.tsx can call loadSession() on mount — no second results UI
   * needed; we reuse the one that already exists there.
   */
  const openSession = (session: AISession) => {
    navigate("/interview", { state: { loadSessionId: session.id } });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Badge variant="secondary" className="mb-3 text-xs">History</Badge>
          <h1 className="text-3xl font-extrabold tracking-tight">My Interviews</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            All your past and in-progress AI mock interviews. Continue an active
            session or review the results of a completed one.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-800 flex-1">{error}</p>
            <Button size="sm" variant="outline" className="shrink-0" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </div>
        )}

        {/* Loading — same spinner pattern as AIInterview's loadingSession */}
        {loading && (
          <div
            aria-busy="true"
            className="flex min-h-[12rem] items-center justify-center gap-2 py-16 text-muted-foreground"
          >
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading interviews…</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && interviews.length === 0 && (
          <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-lg shadow-slate-200/40">
            <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center">
              <Mic className="h-6 w-6 text-purple-400" />
            </div>
            <p className="text-base font-bold text-slate-700">No interviews yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-5">
              Start your first AI mock interview to see it here.
            </p>
            <Button
              onClick={() => navigate("/interview")}
              className="gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl"
            >
              Start an Interview
            </Button>
          </div>
        )}

        {/* Interview list */}
        {!loading && interviews.length > 0 && (
          <div className="space-y-3">
            {interviews.map((session) => {
              const meta = session.metadata_ ?? {};
              const score = storedScore(meta);
              const kind = sessionKind(meta);
              const isActive = session.status === "active";
              const isDeleting = deletingId === session.id;
              const totalQ =
                typeof meta.total_questions === "number"
                  ? meta.total_questions
                  : null;

              return (
                <div
                  key={session.id}
                  className={cn(
                    "rounded-2xl border bg-white p-4 shadow-lg shadow-slate-200/40 transition-shadow hover:shadow-xl hover:shadow-slate-200/60 sm:px-5 sm:py-4",
                    isActive ? "border-amber-200" : "border-slate-100",
                  )}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    {/* Mode tile + title/meta. Badges live in the wrapping meta
                        row, so they reflow instead of overlapping at 375px. */}
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div
                        aria-hidden="true"
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                          modeIconTone(kind, isActive),
                        )}
                      >
                        <ModeIcon kind={kind} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-800">
                          {sessionTitle(meta)}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-[11px] font-medium text-slate-500">
                            {modeLabel(session)}
                          </span>
                          {meta.difficulty ? (
                            <>
                              <span className="text-[11px] text-slate-300">·</span>
                              <span className="text-[11px] font-medium text-slate-500">
                                {String(meta.difficulty)}
                              </span>
                            </>
                          ) : null}
                          {totalQ !== null && (
                            <>
                              <span className="text-[11px] text-slate-300">·</span>
                              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-500">
                                <Clock className="h-3 w-3" />
                                {totalQ} questions
                              </span>
                            </>
                          )}
                          <span className="text-[11px] text-slate-300">·</span>
                          <span className="text-[11px] font-medium text-slate-500">
                            {formatDate(session.started_at)}
                          </span>
                          {score !== null && <ScoreBadge score={score} />}
                          <StatusBadge status={session.status} />
                        </div>
                      </div>
                    </div>

                    {/* Actions — drop below the card body on mobile. */}
                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                      <Button
                        size="sm"
                        onClick={() => openSession(session)}
                        className={cn(
                          "h-8 gap-1.5 rounded-xl px-3 text-[11px] font-bold",
                          isActive
                            ? "bg-amber-600 hover:bg-amber-700 text-white"
                            : "bg-purple-600 hover:bg-purple-700 text-white",
                        )}
                      >
                        {isActive ? (
                          <>
                            <PlayCircle className="h-3.5 w-3.5" />
                            Continue
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isDeleting}
                        onClick={() => setPendingDelete(session)}
                        className="h-8 w-8 rounded-xl p-0 text-slate-400 hover:text-red-600"
                        aria-label="Delete interview"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer CTA */}
        {!loading && interviews.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={() => navigate("/interview")}
              className="gap-2 rounded-xl font-semibold border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <ChevronRight className="h-4 w-4" />
              Start a new interview
            </Button>
          </div>
        )}
      </div>

      {/* Destructive-action confirmation (portaled above the sticky nav) */}
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this interview?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `"${sessionTitle(pendingDelete.metadata_ ?? undefined)}" and its full transcript will be permanently removed. This can't be undone.`
                : "This interview and its full transcript will be permanently removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                if (pendingDelete) confirmDelete(pendingDelete);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
