import { useState } from "react";
import { Link } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { aiInterviewApi } from "@/features/ai-interview";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { extractApiMessage } from "@/lib/api-client";
import type {
  ID,
  StructuredEvaluation,
  AIFeedbackResponse,
  Recommendations,
} from "@/types";
import { cn } from "@/lib/utils";

type Phase = "setup" | "live" | "results";

interface ChatMessage {
  role: "interviewer" | "candidate";
  content: string;
}

const skillColor = (score: number) =>
  score >= 80 ? "bg-emerald-600" : score >= 65 ? "bg-accent" : "bg-amber-500";

export default function AIInterview() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("setup");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [sessionId, setSessionId] = useState<ID | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [response, setResponse] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [evaluation, setEvaluation] = useState<StructuredEvaluation | null>(null);
  const [feedback, setFeedback] = useState<AIFeedbackResponse | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);

  const { supported, listening, interim, error: voiceError, start, stop } =
    useSpeechRecognition();

  const startInterview = async () => {
    if (!topic.trim()) {
      setError("Enter a topic to interview you on (e.g. Python, Data Structures, Consulting cases).");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await aiInterviewApi.sendMessage({
        topic: topic.trim(),
        difficulty,
        message: "",
      });
      setSessionId(res.session_id);
      setMessages([{ role: "interviewer", content: res.message }]);
      setPhase("live");
    } catch (e: any) {
      setError(extractApiMessage(e, "Could not start the interview. Try again."));
    } finally {
      setBusy(false);
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
      setPhase("results");
    } catch (e: any) {
      setError(extractApiMessage(e, "Could not finish the interview. Please retry."));
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setPhase("setup");
    setTopic("");
    setDifficulty("Medium");
    setSessionId(undefined);
    setMessages([]);
    setResponse("");
    setError(null);
    setEvaluation(null);
    setFeedback(null);
    setRecommendations(null);
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

  // ── Setup ────────────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-3 text-xs">AI Mock Interview</Badge>
            <h1 className="text-3xl font-extrabold tracking-tight">Practice a realistic AI interview</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              The interviewer adapts follow-up questions to your answers. Voice input
              is transcribed and submitted as your answer.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                What should the interview be about?
              </label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Python, Data Structures, SQL, Consulting case"
                className="mt-2 w-full h-11 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                onKeyDown={(e) => {
                  if (e.key === "Enter") startInterview();
                }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Difficulty
              </label>
              <div className="mt-2 flex gap-2">
                {["Easy", "Medium", "Hard"].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={cn(
                      "flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all",
                      difficulty === level
                        ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={startInterview}
              disabled={busy || !topic.trim()}
              className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl py-5"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Start Interview
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              AI interviews need GROQ_API_KEY configured on the backend.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────
  if (phase === "results") {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-3 text-xs">Interview Complete</Badge>
            <h1 className="text-2xl font-bold tracking-tight">{topic}</h1>
            <div className="flex items-baseline justify-center gap-2 mt-3">
              <span className="text-6xl font-bold tracking-tight tabular-nums">
                {evaluation?.overall_score ?? feedback?.overall_score ?? 0}
              </span>
              <span className="text-2xl text-muted-foreground">/ 100</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Skill breakdown */}
          {(evaluation?.skills?.length ?? 0) > 0 && (
            <div className="mb-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
                Skill Breakdown
              </p>
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

          {/* Strengths / Improvements */}
          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Strengths
                </p>
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
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  To Improve
                </p>
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

          {/* Feedback */}
          {feedback && (
            <div className="mb-6 rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-purple-50/30 p-6 shadow-xl shadow-slate-200/50">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-purple-600" />
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Personalized Feedback
                </p>
              </div>
              {feedback.biggest_opportunity && (
                <p className="text-sm font-semibold mb-1">
                  Biggest opportunity: {feedback.biggest_opportunity.skill} (
                  {feedback.biggest_opportunity.score}/100)
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

          {/* Recommendations */}
          {recommendations && (
            <div className="mb-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-purple-600" />
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Recommended Next Steps
                </p>
              </div>
              {recommendations.next_best_action && (
                <p className="text-sm font-semibold text-slate-800 mb-2">
                  {recommendations.next_best_action}
                </p>
              )}
              {recommendations.recommended_drills.length > 0 && (
                <ul className="space-y-1.5 mb-2">
                  {recommendations.recommended_drills.map((d, i) => (
                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                      <span className="text-purple-600 font-bold">•</span>
                      {d.title}
                      {d.reason ? <span className="text-muted-foreground"> — {d.reason}</span> : null}
                    </li>
                  ))}
                </ul>
              )}
              {recommendations.reasoning && (
                <p className="text-xs text-muted-foreground mt-2">{recommendations.reasoning}</p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={reset} className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl">
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

  // ── Live interview ────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold tracking-tight">{topic}</h1>
            <Badge variant="secondary" className="text-xs">{difficulty}</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl font-semibold"
            disabled={busy}
            onClick={finishInterview}
          >
            Finish &amp; Get Evaluation
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-800 flex-1">{error}</p>
            {error.includes("evaluate") || error.includes("GROQ") ? null : (
              <Button size="sm" variant="outline" className="shrink-0" onClick={() => setError(null)}>
                Dismiss
              </Button>
            )}
          </div>
        )}

        {/* Conversation */}
        <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-xl shadow-slate-200/50 flex flex-col h-[calc(100vh-220px)]">
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
            {interim && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-lg px-4 py-3 text-sm text-muted-foreground italic border border-dashed">
                  {interim}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t px-5 py-4">
            {voiceError && (
              <p className="text-xs text-amber-600 mb-2">{voiceError}</p>
            )}
            <div className="relative">
              <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Type your answer… (or use the mic to answer by voice)"
                className="min-h-[90px] resize-none pr-16"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendAnswer(response);
                  }
                }}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
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
                Listening… speak your answer. It will be transcribed and submitted.
              </p>
            )}
            {!supported && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Voice input isn't available in this browser — type your answers instead.
              </p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}