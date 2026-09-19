import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  Bot,
  User,
  Send,
  Mic,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Target,
  ArrowRight,
  Sparkles,
  Home,
  MicOff,
  FileText,
  UploadCloud,
  Trash2,
  Keyboard,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  History,
  Save,
  PlayCircle,
  Library,
  PencilLine,
  Eye,
} from "lucide-react";
import { aiInterviewApi } from "@/features/ai-interview";
import {
  clearActiveSessionId,
  formatDate,
  interviewProgress,
  isInterviewListable,
  persistActiveSessionId,
  practiceTargets,
  resolvePendingSession,
  resumeSummary,
  scoreBadgeClass,
  sessionKind,
  sessionTitle,
  statusLabel,
  storedScore,
  type SessionMeta,
} from "@/features/ai-interview/derive";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { extractApiMessage } from "@/lib/api-client";
import type {
  ID,
  StructuredEvaluation,
  AIFeedbackResponse,
  Recommendations,
  ResumeData,
  ResumeRecord,
  AISession,
  AIMessage,
  InterviewRole,
} from "@/types";
import { cn } from "@/lib/utils";

type Phase = "setup" | "live" | "results";
type InputMode = "chat" | "voice";

interface ChatMessage {
  role: "interviewer" | "candidate";
  content: string;
}

const ROLE_OPTIONS: Array<{ label: string; icon: string; hint: string }> = [
  { label: "Software Engineer", icon: "💻", hint: "Algorithms, systems, coding depth" },
  { label: "Data Analyst", icon: "📊", hint: "SQL, analysis, data storytelling" },
  { label: "Product Manager", icon: "🧭", hint: "Strategy, tradeoffs, stakeholder skills" },
  { label: "Consulting", icon: "📈", hint: "Case-style problem solving" },
  { label: "Custom", icon: "✏️", hint: "Type any role or focus area" },
];

const skillColor = (score: number) =>
  score >= 80 ? "bg-emerald-600" : score >= 65 ? "bg-blue-500" : "bg-amber-500";

function commaJoin(items: string[] | undefined): string {
  return (items ?? []).join(", ");
}

function splitComma(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function ResumeReviewCard({
  resume,
  resumeFilename,
  editable,
  onChange,
}: {
  resume: ResumeData;
  resumeFilename?: string | null;
  editable: boolean;
  onChange?: (next: ResumeData) => void;
}) {
  const [open, setOpen] = useState(false);
  const set = (patch: Partial<ResumeData>) => onChange?.({ ...resume, ...patch });

  return (
    <div className="rounded-xl border border-blue-100 bg-white/80 px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-bold text-blue-700">
          <PencilLine className="h-3.5 w-3.5" />
          Review &amp; edit what the interviewer will see
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-blue-400" /> : <ChevronDown className="h-4 w-4 text-blue-400" />}
      </button>
      {open && (
        <div className="mt-3 space-y-3 text-sm">
          {resumeFilename && (
            <p className="text-[11px] text-slate-400 font-medium break-all">Source file: {resumeFilename}</p>
          )}
          {editable ? (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input value={resume.name ?? ""} onChange={(e) => set({ name: e.target.value })} placeholder="Full name" />
                <Input value={resume.title ?? ""} onChange={(e) => set({ title: e.target.value })} placeholder="Headline / title" />
              </div>
              <Textarea
                value={resume.summary ?? ""}
                onChange={(e) => set({ summary: e.target.value })}
                placeholder="Professional summary"
                className="min-h-[60px] resize-none"
              />
              <Input
                value={commaJoin(resume.skills)}
                onChange={(e) => set({ skills: splitComma(e.target.value) })}
                placeholder="Skills (comma separated)"
              />
              <Input
                value={commaJoin(resume.technologies)}
                onChange={(e) => set({ technologies: splitComma(e.target.value) })}
                placeholder="Technologies (comma separated)"
              />
              <Input
                value={commaJoin(resume.certifications)}
                onChange={(e) => set({ certifications: splitComma(e.target.value) })}
                placeholder="Certifications (comma separated)"
              />
            </>
          ) : (
            <p className="text-[11px] text-slate-500">
              Saved resumes are read-only here — upload a new file to replace the content.
            </p>
          )}
          {(resume.projects?.length ?? 0) > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Projects</p>
              <ul className="space-y-1">
                {(resume.projects ?? []).map((p, i) => (
                  <li key={i} className="text-xs text-slate-600">
                    <span className="font-semibold">{p.name}</span>
                    {p.description ? <span className="text-slate-400"> — {p.description}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(resume.experience?.length ?? 0) > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Experience</p>
              <ul className="space-y-1">
                {(resume.experience ?? []).map((e, i) => (
                  <li key={i} className="text-xs text-slate-600">
                    <span className="font-semibold">{e.role}</span>
                    {e.company ? <span> @ {e.company}</span> : null}
                    {e.duration ? <span className="text-slate-400"> · {e.duration}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(resume.education?.length ?? 0) > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Education</p>
              <ul className="space-y-1">
                {(resume.education ?? []).map((ed, i) => (
                  <li key={i} className="text-xs text-slate-600">
                    {ed.degree}
                    {ed.institution ? ` — ${ed.institution}` : ""}
                    {ed.year ? ` (${ed.year})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AIInterview() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [roleType, setRoleType] = useState<string>("Software Engineer");
  const [customRole, setCustomRole] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [sessionId, setSessionId] = useState<ID | undefined>(undefined);
  const [sessionMeta, setSessionMeta] = useState<SessionMeta>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [response, setResponse] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("chat");
  const [resultsTitle, setResultsTitle] = useState<string | null>(null);

  const [evaluation, setEvaluation] = useState<StructuredEvaluation | null>(null);
  const [feedback, setFeedback] = useState<AIFeedbackResponse | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);

  // Resume state
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [savedResumeId, setSavedResumeId] = useState<ID | null>(null);
  const [parsingResume, setParsingResume] = useState(false);
  const [savingResume, setSavingResume] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Library + history
  const [savedResumes, setSavedResumes] = useState<ResumeRecord[]>([]);
  const [interviews, setInterviews] = useState<AISession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [resumeNotice, setResumeNotice] = useState<string | null>(null);
  // Confirmation gate for the inline history delete (same pattern as /interviews).
  const [pendingDeleteInterview, setPendingDeleteInterview] = useState<AISession | null>(null);
  // True once the first GET /api/ai/sessions has settled (success or failure),
  // so the pending-session resolver knows the list is authoritative.
  const [libraryLoaded, setLibraryLoaded] = useState(false);

  // StrictMode / double-invoke guard: prevents startInterview() from firing
  // twice on the same user click or from a React StrictMode double-effect.
  const startInFlight = useRef(false);

  const { supported, listening, interim, error: voiceError, start, stop } =
    useSpeechRecognition();

  const selectedRole =
    roleType === "Custom" ? (customRole.trim() || "Custom") : roleType;

  // ── library + history loaders ─────────────────────────────────────────────
  const loadLibrary = useCallback(async () => {
    try {
      const [resumes, sessions] = await Promise.all([
        aiInterviewApi.listResumes(),
        aiInterviewApi.listSessions(""),
      ]);
      setSavedResumes(resumes);
      setInterviews(sessions);
    } catch {
      /* non-fatal: library loads lazily on demand */
    } finally {
      setLibraryLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (phase === "setup") loadLibrary();
  }, [phase, loadLibrary]);

  const activeInterview = useMemo(
    () =>
      interviews.find(
        (s) => s.status === "active" && isInterviewListable(s),
      ) ?? null,
    [interviews],
  );

  const recentInterviews = useMemo(
    () =>
      interviews
        .filter(
          (s) =>
            isInterviewListable(s) &&
            !(s.status === "active" && s.id === activeInterview?.id),
        )
        .slice(0, 8),
    [interviews, activeInterview],
  );

  // ── session loading (recovery + history review) ──────────────────────────
  const loadSession = useCallback(
    async (session: AISession) => {
      setLoadingSession(true);
      setError(null);
      try {
        const meta = session.metadata_ ?? {};
        const msgs = await aiInterviewApi.listMessages(session.id);
        setSessionId(session.id);
        setSessionMeta(meta);
        setMessages(
          msgs
            .filter((m: AIMessage) => m.role === "interviewer" || m.role === "candidate")
            .map((m: AIMessage): ChatMessage => ({
              role: m.role === "candidate" ? "candidate" : "interviewer",
              content: m.content,
            })),
        );
        setDifficulty((meta.difficulty as string) || "Medium");

        const role = (meta.role as string) || "";
        if (role) {
          if (ROLE_OPTIONS.some((o) => o.label === role)) {
            setRoleType(role);
            setCustomRole("");
          } else {
            setRoleType("Custom");
            setCustomRole(role);
          }
        }

        // Restore the resume context indicator (inline or saved asset).
        const inlineResume = meta.resume as ResumeData | undefined;
        const resumeId = (meta.resume_id as string) || null;
        setResume(inlineResume ?? null);
        setResumeName(inlineResume ? "resume attached" : null);
        setSavedResumeId(resumeId);
        if (resumeId) {
          const record = savedResumes.find((r) => r.id === resumeId);
          setResumeName(record?.filename ?? "resume attached");
        }

        if (session.status === "completed") {
          // Review mode — show persisted results without new AI calls.
          const evalData = meta.evaluation as StructuredEvaluation | undefined;
          const fbData = meta.feedback as AIFeedbackResponse | undefined;
          const recData = meta.recommendations as Recommendations | undefined;
          setEvaluation(evalData ?? null);
          setFeedback(fbData ?? null);
          setRecommendations(recData ?? null);
          setResultsTitle(sessionTitle(meta));
          // Completed sessions don't need the sessionStorage safety net.
          clearActiveSessionId();
          setPhase("results");
        } else {
          setResultsTitle(null);
          // Re-persist the active session ID so the tab's sessionStorage
          // safety net is current after a recovery load.
          persistActiveSessionId(session.id);
          setPhase("live");
        }
      } catch (e: any) {
        setError(extractApiMessage(e, "Could not load the interview session."));
      } finally {
        setLoadingSession(false);
      }
    },
    [savedResumes],
  );

  // When navigated here from InterviewHistory with a specific session to open
  // (e.g. "View" or "Continue" from the history page), wait for the library to
  // load so savedResumes is populated, then call loadSession.
  const location = useLocation();
  const navigate = useNavigate();
  const pendingLoadId = (location.state as any)?.loadSessionId as string | undefined;

  // Guard keyed on the *session id* (not a boolean): a StrictMode remount or a
  // re-render mid-flight may re-run this effect, but once a given id has
  // settled (opened or failed) it never retries again. Navigating to a
  // *different* session id still runs because the key differs.
  const settledLoadIdRef = useRef<string | null>(null);
  const [pendingLoadError, setPendingLoadError] = useState<{
    id: string;
    message: string;
  } | null>(null);

  /** Strip the one-shot navigation state so a settled request isn't replayed. */
  const clearPendingLoadState = useCallback(() => {
    navigate(location.pathname, { replace: true, state: {} });
  }, [navigate, location.pathname]);

  useEffect(() => {
    if (!pendingLoadId || !libraryLoaded) return;
    if (settledLoadIdRef.current === pendingLoadId) return;

    let cancelled = false;
    const id = pendingLoadId;
    (async () => {
      // The first sessions list can miss a just-created session (create → list
      // fetch race); resolvePendingSession re-fetches with backoff, bounded so
      // this can never spin forever.
      const outcome = await resolvePendingSession({
        sessionId: id,
        initialSessions: interviews,
        fetchSessions: () => aiInterviewApi.listSessions(""),
        isCancelled: () => cancelled,
      });
      if (cancelled) return;

      if (outcome.status === "found") {
        settledLoadIdRef.current = id;
        setPendingLoadError(null);
        setInterviews(outcome.sessions);
        clearPendingLoadState();
        loadSession(outcome.session);
      } else if (outcome.status === "not_found") {
        // Never leave a silent waiting state — fail visibly, fall back to the
        // normal setup phase, and offer a manual retry.
        settledLoadIdRef.current = id;
        setPendingLoadError({
          id,
          message:
            "Couldn't load that interview — it may still be starting up. Check your history and try again.",
        });
        clearPendingLoadState();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pendingLoadId, libraryLoaded, interviews, loadSession, clearPendingLoadState]);

  const retryPendingLoad = () => {
    const id = pendingLoadError?.id;
    if (!id) return;
    setPendingLoadError(null);
    // Re-arm the id guard and re-seed navigation state so the effect runs again.
    settledLoadIdRef.current = null;
    navigate(location.pathname, { replace: true, state: { loadSessionId: id } });
  };

  // ── resume helpers ────────────────────────────────────────────────────────
  const pickResumeFile = () => fileInputRef.current?.click();

  const handleResumeFile = async (file: File | undefined) => {
    if (!file) return;
    const isSupported = /\.(pdf|docx|txt|md)$/i.test(file.name);
    if (!isSupported) {
      setError("Unsupported file type. Upload a PDF, DOCX, or TXT resume.");
      return;
    }
    setParsingResume(true);
    setError(null);
    try {
      const parsed = await aiInterviewApi.parseResume(file, selectedRole);
      setResume(parsed.resume);
      setResumeName(file.name);
      setSavedResumeId(null);
      setResumeNotice(
        "Parsed successfully — review it below, then start the interview or save it for reuse.",
      );
    } catch (e: any) {
      setError(
        extractApiMessage(
          e,
          "Could not parse the resume. Check that the AI provider is configured, or skip the resume and try again.",
        ),
      );
    } finally {
      setParsingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const useSavedResume = (record: ResumeRecord) => {
    setResume(record.data);
    setResumeName(record.filename);
    setSavedResumeId(record.id);
    setError(null);
  };

  const saveCurrentResume = async () => {
    if (!resume) return;
    setSavingResume(true);
    setError(null);
    try {
      const saved = await aiInterviewApi.saveResume({
        filename: resumeName || "my_resume",
        role: selectedRole,
        resume,
      });
      setSavedResumes((prev) => [saved, ...prev.filter((r) => r.id !== saved.id)]);
      setSavedResumeId(saved.id);
      setResumeNotice("Saved to My Resumes — you can reuse it for future interviews.");
    } catch (e: any) {
      setError(extractApiMessage(e, "Could not save the resume."));
    } finally {
      setSavingResume(false);
    }
  };

  const deleteResume = async (record: ResumeRecord) => {
    try {
      await aiInterviewApi.deleteResume(record.id);
      setSavedResumes((prev) => prev.filter((r) => r.id !== record.id));
      if (savedResumeId === record.id) {
        setSavedResumeId(null);
        setResume(null);
        setResumeName(null);
      }
    } catch (e: any) {
      setError(extractApiMessage(e, "Could not delete the resume."));
    }
  };

  // ── interview flow ────────────────────────────────────────────────────────
  const startInterview = async () => {
    if (roleType === "Custom" && !customRole.trim()) {
      setError("Type the role or focus area for your custom interview.");
      return;
    }
    // StrictMode / double-invoke guard: only one creation request at a time.
    if (startInFlight.current || busy) return;
    startInFlight.current = true;
    setError(null);
    setBusy(true);
    try {
      const res = await aiInterviewApi.sendMessage({
        topic: selectedRole,
        difficulty,
        role: selectedRole,
        resume: savedResumeId ? undefined : resume || undefined,
        resumeId: savedResumeId || undefined,
        message: "",
      });
      setSessionId(res.session_id);
      setSessionMeta({ total_questions: res.total_questions ?? 6, difficulty });
      setMessages([{ role: "interviewer", content: res.message }]);
      setResultsTitle(null);
      // Track the new session in sessionStorage so a StrictMode second-mount
      // can detect the already-created session before the library re-fetches.
      persistActiveSessionId(res.session_id);
      setPhase("live");
    } catch (e: any) {
      setError(extractApiMessage(e, "Could not start the interview. Try again."));
    } finally {
      setBusy(false);
      startInFlight.current = false;
    }
  };

  const sendAnswer = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setResponse("");
    setError(null);
    setMessages((prev) => [...prev, { role: "candidate", content: trimmed }]);
    setBusy(true);
    try {
      const res = await aiInterviewApi.sendMessage({
        sessionId,
        message: trimmed,
      });
      setMessages((prev) => [...prev, { role: "interviewer", content: res.message }]);
      // Keep sessionStorage up to date on every successful turn.
      if (sessionId) persistActiveSessionId(sessionId);
    } catch (e: any) {
      setError(extractApiMessage(e, "The interviewer could not respond. Please retry."));
    } finally {
      setBusy(false);
    }
  };

  const finishInterview = async () => {
    if (!sessionId || busy) return;
    setError(null);
    setBusy(true);
    try {
      const evalRes = await aiInterviewApi.evaluateSession(sessionId);
      setEvaluation(evalRes.evaluation);
      const [fb, recs] = await Promise.all([
        aiInterviewApi.generateFeedbackForSession(sessionId),
        aiInterviewApi.generateRecommendations(sessionId),
      ]);
      setFeedback(fb);
      setRecommendations(recs);
      setResultsTitle(sessionTitle(sessionMeta));
      // Session is now completed — clear the sessionStorage safety net.
      clearActiveSessionId();
      setPhase("results");
    } catch (e: any) {
      setError(extractApiMessage(e, "Could not finish the interview. Please retry."));
    } finally {
      setBusy(false);
    }
  };

  const regenerateAnalysis = async () => {
    if (!sessionId || busy) return;
    setError(null);
    setBusy(true);
    try {
      const [fb, recs] = await Promise.all([
        aiInterviewApi.generateFeedbackForSession(sessionId),
        aiInterviewApi.generateRecommendations(sessionId),
      ]);
      setFeedback(fb);
      setRecommendations(recs);
    } catch (e: any) {
      setError(extractApiMessage(e, "Could not generate feedback right now."));
    } finally {
      setBusy(false);
    }
  };

  const deleteInterview = async (session: AISession) => {
    setPendingDeleteInterview(null);
    try {
      await aiInterviewApi.deleteSession(session.id);
      setInterviews((prev) => prev.filter((s) => s.id !== session.id));
    } catch (e: any) {
      setError(extractApiMessage(e, "Could not delete the interview."));
    }
  };

  const reset = () => {
    setPhase("setup");
    setRoleType("Software Engineer");
    setCustomRole("");
    setDifficulty("Medium");
    setSessionId(undefined);
    setSessionMeta(null);
    setMessages([]);
    setResponse("");
    setError(null);
    setEvaluation(null);
    setFeedback(null);
    setRecommendations(null);
    setResultsTitle(null);
    setResume(null);
    setResumeName(null);
    setSavedResumeId(null);
    setInputMode("chat");
    setResumeNotice(null);
    // Clear the sessionStorage safety net on any explicit reset.
    clearActiveSessionId();
    loadLibrary();
  };

  /**
   * Abandons the currently-active session (sets status="abandoned" on the
   * server) then resets the page to the clean setup state.  Called when the
   * user clicks "Start New Interview" while a recovery banner is showing.
   */
  const abandonActiveAndReset = async (session: AISession) => {
    try {
      await aiInterviewApi.abandonSession(session.id);
    } catch {
      // Non-fatal: the session will stay "active" in the DB but we still
      // navigate away.  The recovery banner will re-appear next visit;
      // the user can abandon again or continue then finish it.
    }
    reset();
  };

  const micStart = () => {
    if (listening) {
      stop();
      return;
    }
    start((text) => {
      setResponse((prev) => (prev ? `${prev} ${text}` : text));
    });
  };

  const progress = useMemo(
    () => interviewProgress(messages, sessionMeta),
    [messages, sessionMeta],
  );

  const practice = useMemo(() => practiceTargets(evaluation, 3), [evaluation]);
  const usedResumeSummary = resume ? resumeSummary(resume) : "";
  const liveTitle = resultsTitle || selectedRole;

  // ══════════════════════════════ SETUP ═══════════════════════════════════
  if (phase === "setup") {
    // Pre-joined so a long custom role name can never collide with the metadata
    // chips (role name gets its own wrapping line; chips get their own row).
    const activeMeta = activeInterview?.metadata_ ?? undefined;
    const recoveryMeta: string[] = [];
    if (activeInterview) {
      if (sessionKind(activeMeta) === "role") {
        recoveryMeta.push(`${String(activeMeta?.difficulty || "Medium")} difficulty`);
      }
      if (
        typeof activeMeta?.total_questions === "number" &&
        activeMeta.total_questions > 0
      ) {
        recoveryMeta.push(`${String(activeMeta.total_questions)} questions`);
      }
      if (activeInterview.updated_at) {
        recoveryMeta.push(`updated ${formatDate(activeInterview.updated_at)}`);
      }
    }
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-3 text-xs">AI Mock Interview</Badge>
            <h1 className="text-3xl font-extrabold tracking-tight">Practice a realistic AI interview</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Pick a role, optionally use a resume, and the interviewer will ask questions
              grounded in your actual experience. Voice input is transcribed and submitted
              like a typed answer.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-800 flex-1">{error}</p>
              <Button size="sm" variant="outline" className="shrink-0" onClick={() => setError(null)}>Dismiss</Button>
            </div>
          )}

          {/* A requested session (from /interviews) never showed up in the list.
              Fail visibly with a manual retry instead of a silent wait. */}
          {pendingLoadError && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex flex-wrap items-start gap-3"
            >
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-900 flex-1 min-w-[12rem]">{pendingLoadError.message}</p>
              <div className="flex items-center gap-2 shrink-0 ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg border-amber-300 text-amber-800 hover:bg-amber-100"
                  onClick={retryPendingLoad}
                >
                  Try again
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-lg text-amber-800 hover:bg-amber-100"
                  onClick={() => setPendingLoadError(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* Session recovery — never silently create a second session */}
          {activeInterview && (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-sm font-bold text-amber-900 flex items-center gap-2">
                <PlayCircle className="h-4 w-4" />
                You have an interview in progress
              </p>
              {/* Long custom role names wrap here instead of colliding with the
                  metadata chips below. */}
              <p className="text-sm font-semibold text-amber-900 mt-1 break-words">
                {sessionTitle(activeInterview.metadata_ ?? undefined)}
              </p>
              {recoveryMeta.length > 0 && (
                <p className="text-xs text-amber-800 mt-0.5">{recoveryMeta.join(" · ")}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => loadSession(activeInterview)}
                  disabled={loadingSession}
                  className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold"
                >
                  {loadingSession ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
                  Continue Interview
                </Button>
                {/* Abandon the in-progress session before allowing a new one.
                    This writes status="abandoned" to the DB so the old session
                    is no longer surfaced as "active" in future visits. */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => abandonActiveAndReset(activeInterview)}
                  className="rounded-xl font-semibold border-amber-200 text-amber-800 hover:bg-amber-100"
                >
                  Start New Interview
                </Button>
              </div>
            </div>
          )}

          {/* My Resumes library */}
          {savedResumes.length > 0 && (
            <div className="mb-5 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <Library className="h-4 w-4 text-blue-600" />
                <p className="text-xs font-bold text-slate-700">My Resumes</p>
                <span className="text-[10px] text-slate-400 font-medium">reusable assets — select one or upload below</span>
              </div>
              <div className="space-y-2">
                {savedResumes.map((record) => {
                  const selected = savedResumeId === record.id;
                  return (
                    <div
                      key={record.id}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-xl border px-3 py-2",
                        selected ? "border-blue-300 bg-blue-50" : "border-slate-100 bg-slate-50/60",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => useSavedResume(record)}
                        className="flex items-center gap-2 min-w-0 text-left flex-1"
                      >
                        <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                        <span className="min-w-0">
                          <span className="block text-xs font-bold text-slate-700 truncate">{record.filename}</span>
                          <span className="block text-[10px] text-slate-400 truncate">
                            {record.role ? `${record.role} · ` : ""}
                            {resumeSummary(record.data) || "parsed resume"} · updated {formatDate(record.updated_at)}
                          </span>
                        </span>
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" variant={selected ? "default" : "outline"} className="h-7 rounded-lg text-[11px] px-2.5 font-bold" onClick={() => useSavedResume(record)}>
                          {selected ? "Selected" : "Use"}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-red-600" onClick={() => deleteResume(record)} aria-label="Delete resume">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 space-y-6">
            {/* Interview type */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                1 · What role are you interviewing for?
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => setRoleType(opt.label as InterviewRole)}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left transition-all",
                      roleType === opt.label
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    <span className="text-lg leading-none">{opt.icon}</span>
                    <p className="text-sm font-bold mt-1.5">{opt.label}</p>
                    <p className={cn("text-[10px] mt-0.5 leading-tight", roleType === opt.label ? "text-white/80" : "text-slate-400")}>
                      {opt.hint}
                    </p>
                  </button>
                ))}
              </div>
              {roleType === "Custom" && (
                <input
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="e.g. Data Scientist, DevOps Engineer, Sales Manager…"
                  className="mt-3 w-full h-11 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              )}
            </div>

            {/* Resume upload / attach */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                2 · Resume
                <span className="normal-case font-medium text-slate-400 ml-1">(optional — skip to interview generically for the role)</span>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                onChange={(e) => handleResumeFile(e.target.files?.[0])}
              />
              {resume ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-emerald-900 truncate">{resumeName || "Resume"}</p>
                        <p className="text-xs text-emerald-700 truncate">{usedResumeSummary || "parsed resume"}</p>
                      </div>
                    </div>
                    {savedResumeId && (
                      <Badge variant="outline" className="shrink-0 text-[10px] text-blue-700 border-blue-200 bg-white">
                        saved resume
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 text-slate-500 hover:text-red-600"
                      onClick={() => {
                        setResume(null);
                        setResumeName(null);
                        setSavedResumeId(null);
                        setResumeNotice(null);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {(resume.skills ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {resume.skills!.slice(0, 12).map((s) => (
                        <Badge key={s} variant="secondary" className="bg-emerald-100/70 text-emerald-700 border-0 text-[10px]">
                          {s}
                        </Badge>
                      ))}
                      {(resume.skills?.length ?? 0) > 12 && (
                        <Badge variant="secondary" className="text-[10px]">+{resume.skills!.length - 12}</Badge>
                      )}
                    </div>
                  )}
                  <div className="mt-3">
                    <ResumeReviewCard resume={resume} resumeFilename={resumeName} editable={!savedResumeId} onChange={setResume} />
                  </div>
                  {resumeNotice && <p className="text-[11px] text-emerald-700/80 mt-2">{resumeNotice}</p>}
                  {!savedResumeId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={saveCurrentResume}
                      disabled={savingResume}
                      className="mt-3 rounded-lg text-emerald-700 border-emerald-200 hover:bg-emerald-100 gap-1.5 text-xs font-bold"
                    >
                      {savingResume ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save to My Resumes
                    </Button>
                  )}
                  <p className="text-[11px] text-emerald-700/80 mt-2">
                    The interviewer will ask about your projects and skills. Replace it any time.
                  </p>
                </div>
              ) : (
                <button
                  onClick={pickResumeFile}
                  disabled={parsingResume}
                  className="w-full rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 px-4 py-5 text-center transition-colors disabled:opacity-60"
                >
                  {parsingResume ? (
                    <span className="flex items-center justify-center gap-2 text-sm font-semibold text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Parsing resume with AI…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-500">
                      <UploadCloud className="h-4 w-4" />
                      Upload PDF / DOCX / TXT resume
                    </span>
                  )}
                  <span className="block text-[11px] text-slate-400 mt-1">
                    Questions will reference your real projects and experience. You can also skip.
                  </span>
                </button>
              )}
            </div>

            {/* Difficulty */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                3 · Difficulty
              </p>
              <div className="flex gap-2">
                {["Easy", "Medium", "Hard"].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={cn(
                      "flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all",
                      difficulty === level
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={startInterview}
              disabled={busy || (roleType === "Custom" && !customRole.trim())}
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-5"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {resume ? `Start ${selectedRole} Interview` : `Start ${selectedRole} Interview (no resume)`}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              AI interviews need GROQ_API_KEY configured on the backend.
            </p>
          </div>

          {/* Interview history */}
          {(recentInterviews.length > 0 || interviews.length > 0) && (
            <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/40">
              <button
                type="button"
                onClick={() => setShowHistory((o) => !o)}
                className="w-full flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <History className="h-4 w-4 text-blue-500" />
                  Past Interviews
                </span>
                {showHistory ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </button>
              {showHistory && (
                <div className="mt-3 space-y-2">
                  {recentInterviews.length === 0 && (
                    <p className="text-xs text-slate-400 py-2">No past interviews yet — completed ones appear here.</p>
                  )}
                  {recentInterviews.map((s) => {
                    const meta = s.metadata_ ?? {};
                    const score = storedScore(meta);
                    const isRole = sessionKind(meta) === "role";
                    return (
                      <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-700 truncate">{sessionTitle(meta)}</p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {isRole ? "Resume/role interview · " : ""}
                            {statusLabel(s.status)} · {formatDate(s.started_at)}
                          </p>
                        </div>
                        {score !== null && (
                          <Badge
                            variant="secondary"
                            className={cn("text-[10px] shrink-0", scoreBadgeClass(score))}
                          >
                            {score}/100
                          </Badge>
                        )}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => loadSession(s)}
                            disabled={loadingSession}
                            className={cn(
                              "h-7 rounded-lg text-[11px] px-2.5 font-bold gap-1",
                              // amber = in progress, purple = review (same as /interviews)
                              s.status === "active"
                                ? "bg-amber-600 hover:bg-amber-700 text-white"
                                : "bg-blue-600 hover:bg-blue-700 text-white",
                            )}
                          >
                            {s.status === "active" ? <PlayCircle className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            {s.status === "active" ? "Continue" : "View"}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-red-600" onClick={() => setPendingDeleteInterview(s)} aria-label="Delete interview">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete is destructive — confirm before calling the API. */}
        <AlertDialog
          open={pendingDeleteInterview !== null}
          onOpenChange={(open) => {
            if (!open) setPendingDeleteInterview(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this interview?</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingDeleteInterview
                  ? `"${sessionTitle(pendingDeleteInterview.metadata_ ?? undefined)}" and its full transcript will be permanently removed. This can't be undone.`
                  : "This interview and its full transcript will be permanently removed."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={() => {
                  if (pendingDeleteInterview) deleteInterview(pendingDeleteInterview);
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

  // ══════════════════════════════ RESULTS ═══════════════════════════════════
  if (phase === "results") {
    const transcriptPairs: Array<{ q: string; a: string }> = [];
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role === "interviewer") {
        const a = messages[i + 1]?.role === "candidate" ? messages[i + 1].content : "";
        transcriptPairs.push({ q: messages[i].content, a });
      }
    }
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-3 text-xs">Interview Complete</Badge>
            <h1 className="text-2xl font-bold tracking-tight">{liveTitle}</h1>
            <div className="flex items-baseline justify-center gap-2 mt-3">
              <span className="text-6xl font-bold tracking-tight tabular-nums">
                {evaluation?.overall_score ?? feedback?.overall_score ?? 0}
              </span>
              <span className="text-2xl text-muted-foreground">/ 100</span>
            </div>
            {storedScore(sessionMeta) === null && !busy && !evaluation && (
              <p className="text-xs text-amber-600 mt-2">Reviewing a past interview — persisted evaluation shown below.</p>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-800 flex-1">{error}</p>
              <Button size="sm" variant="outline" className="shrink-0" onClick={() => setError(null)}>Dismiss</Button>
            </div>
          )}

          {busy && (
            <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Evaluating your interview…
            </div>
          )}

          {!busy && evaluation && sessionId && (!feedback || !recommendations) && (
            <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/60 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-blue-800 font-medium">
                Feedback for this past interview isn't stored yet — you can generate it now (AI).
              </p>
              <Button size="sm" onClick={regenerateAnalysis} className="rounded-lg gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">
                <Lightbulb className="h-3.5 w-3.5" /> Generate feedback &amp; recommendations
              </Button>
            </div>
          )}

          {(evaluation?.skills?.length ?? 0) > 0 && (
            <div className="mb-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">Skill Breakdown</p>
              <div className="space-y-3">
                {evaluation!.skills.map((skill) => (
                  <div key={skill.skill} className="flex items-center gap-3">
                    <span className="text-sm w-44 text-muted-foreground shrink-0">{skill.skill}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", skillColor(skill.score))}
                        style={{ width: `${Math.min(100, Math.max(0, skill.score))}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold tabular-nums w-8 text-right">{skill.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Strengths</p>
              </div>
              <ul className="space-y-2">
                {(evaluation?.strengths ?? []).map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                    {s}
                  </li>
                ))}
                {(evaluation?.strengths ?? []).length === 0 && (
                  <li className="text-sm text-muted-foreground">No strengths recorded.</li>
                )}
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">To Improve</p>
              </div>
              <ul className="space-y-2">
                {(evaluation?.improvements ?? []).map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                    {s}
                  </li>
                ))}
                {(evaluation?.improvements ?? []).length === 0 && (
                  <li className="text-sm text-muted-foreground">No improvement areas recorded.</li>
                )}
              </ul>
            </div>
          </div>

          {feedback && (
            <div className="mb-6 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-50/30 p-6 shadow-xl shadow-slate-200/50">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Personalized Feedback</p>
              </div>
              {feedback.biggest_opportunity && (
                <p className="text-sm font-semibold mb-1">
                  Biggest opportunity: {feedback.biggest_opportunity.skill} ({feedback.biggest_opportunity.score}/100)
                </p>
              )}
              {feedback.better_approach && (
                <p className="text-sm text-slate-600 leading-relaxed mb-2">{feedback.better_approach}</p>
              )}
              {feedback.recommended_drill && (
                <div className="mt-3 rounded-xl border bg-white px-4 py-3 text-sm">
                  <span className="font-bold">Next drill: </span>
                  {feedback.recommended_drill.title}
                  {feedback.recommended_drill.duration ? ` · ${feedback.recommended_drill.duration} min` : ""}
                </div>
              )}
            </div>
          )}

          {recommendations && (
            <div className="mb-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-blue-600" />
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recommended Next Steps</p>
              </div>
              {recommendations.next_best_action && (
                <p className="text-sm font-semibold text-slate-800 mb-2">{recommendations.next_best_action}</p>
              )}
              {recommendations.recommended_drills.length > 0 && (
                <ul className="space-y-1.5 mb-2">
                  {recommendations.recommended_drills.map((d, i) => (
                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      {d.title}
                      {d.reason ? <span className="text-muted-foreground"> — {d.reason}</span> : null}
                    </li>
                  ))}
                </ul>
              )}
              {recommendations.reasoning && <p className="text-xs text-muted-foreground mt-2">{recommendations.reasoning}</p>}
            </div>
          )}

          {/* Interview → learning loop */}
          {practice.length > 0 && (
            <div className="mb-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Turn weaknesses into practice</p>
              </div>
              <p className="text-xs text-slate-400 mb-4">Based on your lowest measured skills from this interview.</p>
              <div className="flex flex-wrap gap-2">
                {practice.map((p) => (
                  <Link key={p.label} to={p.href}>
                    <Button size="sm" variant="outline" className="rounded-xl gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold">
                      <ArrowRight className="h-3.5 w-3.5" />
                      {p.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {transcriptPairs.length > 0 && (
            <div className="mb-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Your interview transcript</p>
              <div className="space-y-4">
                {transcriptPairs.map((pair, i) => (
                  <div key={i} className="space-y-2">
                    <div className="rounded-xl bg-muted px-4 py-3 text-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                        <Bot className="h-3 w-3" /> Question {i + 1}
                      </p>
                      {pair.q}
                    </div>
                    {pair.a ? (
                      <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900 ml-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1 flex items-center gap-1">
                          <User className="h-3 w-3" /> Your answer
                        </p>
                        {pair.a}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={reset} className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
              <Sparkles className="h-4 w-4" />
              New Interview
            </Button>
            <Link to="/practice" className="flex-1">
              <Button variant="outline" className="w-full gap-2 rounded-xl font-bold">
                <ArrowRight className="h-4 w-4" />
                Practice Weak Areas
              </Button>
            </Link>
            <Link to="/dashboard" className="flex-1">
              <Button variant="ghost" className="w-full gap-2 rounded-xl font-bold">
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ══════════════════════════════ LIVE ═══════════════════════════════════
  const pct = progress ? Math.round((progress.asked / progress.total) * 100) : null;
  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-lg font-bold tracking-tight truncate">{liveTitle}</h1>
            <Badge variant="secondary" className="text-xs shrink-0">{difficulty}</Badge>
            {resumeName && (
              <Badge variant="outline" className="text-[10px] shrink-0 gap-1 max-w-[160px]">
                <FileText className="h-3 w-3" />
                <span className="truncate">{resumeName}</span>
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl font-semibold shrink-0"
            disabled={busy}
            onClick={finishInterview}
          >
            Finish &amp; Get Evaluation
          </Button>
        </div>

        {/* Real progress — derived from persisted messages + session config */}
        {progress && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-bold text-slate-500">
                Question {progress.asked} of {progress.total}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">Finish any time to get your evaluation</p>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${Math.max(6, Math.min(100, pct ?? 0))}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-800 flex-1">{error}</p>
            <Button size="sm" variant="outline" className="shrink-0" onClick={() => setError(null)}>Dismiss</Button>
          </div>
        )}

        {/* Conversation */}
        <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-xl shadow-slate-200/50 flex flex-col h-[calc(100vh-260px)]">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.map((m, i) =>
              m.role === "interviewer" ? (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed bg-muted text-foreground">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                      <Bot className="h-3 w-3" /> Interviewer
                    </p>
                    <p>{m.content}</p>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed bg-primary text-primary-foreground">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70 mb-1.5 flex items-center gap-1">
                      <User className="h-3 w-3" /> You
                    </p>
                    <p>{m.content}</p>
                  </div>
                </div>
              ),
            )}
            {busy && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Interviewer is thinking…
                </div>
              </div>
            )}
            {listening && interim && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-lg px-4 py-3 text-sm text-muted-foreground italic border border-dashed border-emerald-300">
                  {interim}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t px-5 py-4">
            {voiceError && <p className="text-xs text-amber-600 mb-2">{voiceError}</p>}

            {/* Chat / Voice segmented control — voice is only an input method */}
            <div className="mb-3 inline-flex rounded-full border border-slate-200 bg-slate-50 p-0.5">
              {(["chat", "voice"] as InputMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setInputMode(mode)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all capitalize",
                    inputMode === mode
                      ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                      : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  {mode === "chat" ? <Keyboard className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                  {mode}
                </button>
              ))}
            </div>

            <div className="relative">
              <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder={
                  inputMode === "voice"
                    ? "Speak with the mic below — your words appear here and you can edit them before sending."
                    : "Type your answer…"
                }
                className="min-h-[90px] resize-none pr-24"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendAnswer(response);
                  }
                }}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                {inputMode === "voice" && (
                  <Button
                    size="sm"
                    variant={listening ? "default" : "outline"}
                    onClick={micStart}
                    disabled={!supported}
                    title={
                      supported
                        ? "Answer by voice (speech-to-text)"
                        : "Voice input not supported in this browser"
                    }
                    className="h-8 w-8 p-0 rounded-full"
                  >
                    {supported ? (
                      listening ? <Mic className="h-3.5 w-3.5 animate-pulse" /> : <Mic className="h-3.5 w-3.5" />
                    ) : (
                      <MicOff className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => sendAnswer(response)}
                  disabled={!response.trim() || busy}
                  className="h-8 gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send
                </Button>
              </div>
            </div>

            {listening && (
              <p className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Listening… speak your answer. Review the transcript below the mic before sending.
              </p>
            )}
            {inputMode === "voice" && !supported && (
              <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Voice input isn't available in this browser — use the Chat tab to type instead.
              </p>
            )}
            {inputMode === "chat" && (
              <p className="mt-2 text-[11px] text-muted-foreground">Press Enter to send. Switch to Voice to answer by speech.</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
