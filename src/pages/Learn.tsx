import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { extractApiMessage } from "@/lib/api-client";
import { learningApi, type LearningMessage, type LearningSession } from "@/features/learning/api";
import { quizzesApi } from "@/features/quizzes/api";
import { cn } from "@/lib/utils";
import { GraduationCap, Send, Sparkles, ArrowRight, Loader2, BookOpen, RefreshCw } from "lucide-react";

const EXAMPLE_TOPICS = [
  "Python",
  "Machine Learning",
  "Operating Systems",
  "SQL joins",
  "Data Structures",
  "Physics",
  "Finance",
  "Marketing",
];

const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;

function toLearnerLevel(raw: string | null | undefined): string {
  const v = raw || "";
  if (/advanced/i.test(v)) return "Advanced";
  if (/intermediate/i.test(v)) return "Intermediate";
  return "Beginner";
}

export default function Learn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();

  const topicFromUrl = searchParams.get("topic") || "";
  const focusFromUrl = (searchParams.get("focus") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const autoQuiz = searchParams.get("quiz") === "1";

  const [topic, setTopic] = useState(topicFromUrl);
  const [learnerLevel] = useState<string>(() => toLearnerLevel(profile?.experienceLevel));
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [active, setActive] = useState<LearningSession | null>(null);
  const [messages, setMessages] = useState<LearningMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  // Quiz panel state
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizDifficulty, setQuizDifficulty] = useState<(typeof DIFFICULTIES)[number]>("Medium");
  const [quizCount, setQuizCount] = useState(5);
  const [focusSubtopics, setFocusSubtopics] = useState<string[]>([]);
  const [quizBusy, setQuizBusy] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadSessions = useCallback(async () => {
    try {
      const data = await learningApi.listSessions();
      setSessions(data);
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (autoQuiz && topicFromUrl) {
      setQuizOpen(true);
      setFocusSubtopics(focusFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const openSession = useCallback(async (session: LearningSession) => {
    setActive(session);
    setSessionLoading(true);
    setError(null);
    try {
      const msgs = await learningApi.listMessages(session.id);
      setMessages(msgs);
    } catch (e: any) {
      setError(extractApiMessage(e, "Failed to load conversation"));
    } finally {
      setSessionLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, []);

  const startLearning = async () => {
    const t = (topic || "").trim();
    if (t.length < 2) {
      setError("Enter a topic first, e.g. “Python decorators”");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const session = await learningApi.createSession(t, learnerLevel);
      setTopic("");
      setActive(session);
      setMessages([]);
      await loadSessions();
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (e: any) {
      setError(extractApiMessage(e, "Could not start the session"));
    } finally {
      setBusy(false);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || busy || !active) return;
    setInput("");
    setError(null);
    const optimistic: LearningMessage = {
      id: `tmp-${Date.now()}`,
      session_id: active.id,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setBusy(true);
    try {
      const result = await learningApi.sendMessage(active.id, text);
      setMessages((prev) => [
        ...prev,
        {
          id: result.message_id,
          session_id: active.id,
          role: result.role,
          content: result.reply,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (e: any) {
      setError(extractApiMessage(e, "The tutor could not reply right now"));
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setBusy(false);
    }
  };

  const generateQuiz = async () => {
    const t = (active?.topic || topic || topicFromUrl || "").trim();
    if (!t) return;
    setQuizError(null);
    setQuizBusy(true);
    try {
      const result = await quizzesApi.generate({
        topic: t,
        difficulty: quizDifficulty,
        question_count: quizCount,
        focus_subtopics: focusSubtopics,
      });
      navigate(`/assessments/${result.assessment_id}`);
    } catch (e: any) {
      setQuizError(extractApiMessage(e, "Quiz generation failed — please try again."));
    } finally {
      setQuizBusy(false);
    }
  };

  const resetToNew = () => {
    setActive(null);
    setMessages([]);
    setQuizOpen(false);
    setQuizError(null);
    setTopic("");
  };

  const chatVisible = !!active;
  const activeTopic = active?.topic || topicFromUrl || "";

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Learn with AI</h1>
            <p className="text-xs text-slate-500 font-medium">
              Pick any topic — a tutor explains, then turns it into a quiz.
            </p>
          </div>
        </div>

        {/* Session list (recent) */}
        {!chatVisible && sessions.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-500 mb-2">Recent sessions</p>
            <div className="flex flex-wrap gap-2">
              {sessions.slice(0, 5).map((s) => (
                <button
                  key={s.id}
                  onClick={() => openSession(s)}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-700 transition-all"
                >
                  {s.topic}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 ring-1 ring-red-100 text-red-700 px-4 py-3 text-sm font-medium">
            {error}
          </div>
        )}

        {!chatVisible ? (
          /* ---------------- Start screen ---------------- */
          <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-10 shadow-xl shadow-slate-200/40 text-center">
            <p className="text-2xl font-extrabold text-slate-900">What do you want to learn today?</p>
            <p className="text-sm text-slate-500 mt-2 font-medium max-w-md mx-auto">
              Type any topic — the AI tutor teaches it step by step, answers your questions, and
              can test you with a generated quiz.
            </p>
            <div className="mt-6 max-w-lg mx-auto flex gap-2">
              <Input
                ref={inputRef}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && startLearning()}
                placeholder="e.g. Python decorators, SQL joins, OS scheduling…"
                className="h-12 rounded-xl border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
              <Button
                onClick={startLearning}
                disabled={busy}
                className="h-12 px-5 rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-200 shrink-0"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Learn
              </Button>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {EXAMPLE_TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className="px-3 py-1.5 rounded-full bg-slate-100 text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-transparent transition-all"
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  const t = (topic || topicFromUrl || "").trim();
                  if (!t) {
                    setError("Enter a topic first to generate a quiz.");
                    return;
                  }
                  setQuizOpen(true);
                }}
                className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Generate Quiz for Topic
              </Button>
            </div>
          </div>
        ) : (
          /* ---------------- Chat screen ---------------- */
          <>
            <div className="rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/40 overflow-hidden">
              {/* Chat header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/70 to-white">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                    <GraduationCap className="h-4.5 w-4.5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 truncate">{activeTopic}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{learnerLevel} level</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setQuizOpen(true)}
                    className="gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm px-4"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Generate Quiz
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={resetToNew}
                    className="rounded-xl text-slate-500 hover:text-slate-700"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="h-[52vh] overflow-y-auto px-5 py-5 space-y-4 bg-gradient-to-b from-white to-slate-50/60">
                {sessionLoading ? (
                  <div className="flex items-center justify-center py-16 text-sm text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading conversation…
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-14 px-6">
                    <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">You're learning {activeTopic}</p>
                    <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                      Ask anything — e.g. “Explain {activeTopic?.split(" ")[0] || "this topic"} simply”, “give me an
                      example”, or “test me”.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                          m.role === "user"
                            ? "bg-blue-600 text-white rounded-br-md shadow-md shadow-blue-200"
                            : "bg-white border border-slate-100 text-slate-700 rounded-bl-md shadow-sm",
                        )}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))
                )}
                {busy && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-100 text-slate-400 text-xs rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Tutor is thinking…
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Composer */}
              <div className="px-5 py-4 border-t border-slate-100 bg-white">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder={`Ask about ${activeTopic}…`}
                    className="rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={busy || !input.trim()}
                    className="h-10 w-10 p-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shrink-0 disabled:opacity-50"
                    aria-label="Send"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-3 font-medium">
              The tutor stays focused on {activeTopic} and adapts to your level. Tap “Generate Quiz” when
              you're ready to be tested.
            </p>
          </>
        )}

        {/* Quiz config panel */}
        {quizOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-slate-900">Generate a Quiz</p>
                  <p className="text-xs text-slate-500 font-medium">
                    {focusSubtopics.length > 0
                      ? `Focused on: ${focusSubtopics.join(", ")}`
                      : `Topic: ${(active?.topic || topic || topicFromUrl || "").trim()}`}
                  </p>
                </div>
              </div>

              {focusSubtopics.length > 0 && (
                <div className="mb-4 rounded-xl bg-amber-50 ring-1 ring-amber-200/60 px-3 py-2 text-xs text-amber-800 font-medium">
                  Targeting your weak areas — questions will focus on the subtopics you missed.
                </div>
              )}

              <Label className="text-xs font-bold text-slate-600 mb-1.5 block">Difficulty</Label>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setQuizDifficulty(d)}
                    className={cn(
                      "py-2.5 rounded-xl text-sm font-semibold border-2 transition-all",
                      quizDifficulty === d
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300",
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <Label className="text-xs font-bold text-slate-600 mb-1.5 block">Number of questions</Label>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[3, 5, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQuizCount(n)}
                    className={cn(
                      "py-2.5 rounded-xl text-sm font-semibold border-2 transition-all",
                      quizCount === n
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {quizError && (
                <div className="mb-4 rounded-xl bg-red-50 ring-1 ring-red-100 text-red-700 px-4 py-2.5 text-xs font-medium">
                  {quizError}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl border-border/60"
                  onClick={() => {
                    setQuizOpen(false);
                    setQuizError(null);
                  }}
                  disabled={quizBusy}
                >
                  Cancel
                </Button>
                <Button
                  onClick={generateQuiz}
                  disabled={quizBusy}
                  className="flex-[2] rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-200"
                >
                  {quizBusy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Generate
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-slate-400 mt-3 text-center font-medium">
                Generated quizzes are validated before they're shown to you.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
