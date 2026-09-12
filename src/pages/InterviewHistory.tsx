import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  sessionKind,
  sessionTitle,
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

function ModeIcon({ session }: { session: AISession }) {
  const kind = sessionKind(session.metadata_ ?? undefined);
  if (kind === "role") return <FileText className="h-3.5 w-3.5" />;
  if (kind === "case") return <BookOpen className="h-3.5 w-3.5" />;
  return <MessageSquare className="h-3.5 w-3.5" />;
}

function statusBadgeClass(status: string): string {
  if (status === "completed") return "bg-emerald-100 text-emerald-700 border-0";
  if (status === "active") return "bg-amber-100 text-amber-700 border-0";
  return "bg-slate-100 text-slate-500 border-0";
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

  const handleDelete = async (session: AISession) => {
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

        {/* Loading skeleton */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
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
              const totalQ = typeof meta.total_questions === "number"
                ? meta.total_questions
                : null;

              return (
                <div
                  key={session.id}
                  className={cn(
                    "rounded-2xl border bg-white px-5 py-4 flex items-center gap-4 shadow-sm shadow-slate-100/60 transition-shadow hover:shadow-md",
                    isActive
                      ? "border-amber-200"
                      : "border-slate-100",
                  )}
                >
                  {/* Mode icon */}
                  <div
                    className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                      isActive
                        ? "bg-amber-50 text-amber-600"
                        : kind === "role"
                          ? "bg-purple-50 text-purple-500"
                          : "bg-slate-50 text-slate-400",
                    )}
                  >
                    <ModeIcon session={session} />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {sessionTitle(meta)}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {modeLabel(session)}
                      </span>
                      {(meta.difficulty as string) && (
                        <>
                          <span className="text-[11px] text-slate-300">·</span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {String(meta.difficulty)}
                          </span>
                        </>
                      )}
                      {totalQ !== null && (
                        <>
                          <span className="text-[11px] text-slate-300">·</span>
                          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {totalQ}q
                          </span>
                        </>
                      )}
                      <span className="text-[11px] text-slate-300">·</span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {formatDate(session.started_at)}
                      </span>
                    </div>
                  </div>

                  {/* Score */}
                  {score !== null && (
                    <Badge
                      variant="secondary"
                      className="shrink-0 text-[11px] bg-emerald-100 text-emerald-700 border-0 font-bold"
                    >
                      {score}/100
                    </Badge>
                  )}

                  {/* Status */}
                  <Badge
                    variant="secondary"
                    className={cn("shrink-0 text-[11px] font-semibold", statusBadgeClass(session.status))}
                  >
                    {statusLabel(session.status)}
                  </Badge>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => openSession(session)}
                      className={cn(
                        "h-8 rounded-xl text-[11px] px-3 font-bold gap-1.5",
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
                      onClick={() => handleDelete(session)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 rounded-xl"
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
    </AppLayout>
  );
}
