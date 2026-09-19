import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Timer } from "@/components/app/Timer";
import { IssueTreeNode } from "@/components/app/IssueTreeNode";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Send,
  StickyNote,
  GitBranch,
  Calculator,
  ChevronRight,
  Pause,
  Play,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCases, useCaseAttempt, useCaseQuestions, useCaseAnswers } from "@/hooks/use-cases";
import { cn } from "@/lib/utils";
import { extractApiMessage } from "@/lib/api-client";

const mockIssueTree = {
  label: "Case Structure",
  children: [
    {
      label: "Problem Definition",
      children: [{ label: "Root Cause" }, { label: "Scope" }],
    },
    {
      label: "Analysis",
      children: [{ label: "Quantitative" }, { label: "Qualitative" }],
    },
  ],
};

export default function CaseSimulator() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cases } = useCases();
  const { attempt, createAttempt, evaluateAttempt } = useCaseAttempt(user?.id, id);
  const { questions } = useCaseQuestions(id);
  const { answers: savedAnswers, saveAnswer } = useCaseAnswers(attempt?.id);

  const caseData = cases.find((c) => c.id === id);

  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [response, setResponse] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [evaluating, setEvaluating] = useState(false);
  const [evaluateError, setEvaluateError] = useState<string | null>(null);

  const currentQuestion = questions[currentQIdx];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQIdx === totalQuestions - 1;

  const answeredQuestionIds = savedAnswers
    .filter((a) => a.answer_text && a.answer_text.trim().length > 0)
    .map((a) => a.question_id);

  // Restore progress from a partially-completed attempt.
  useEffect(() => {
    if (answeredQuestionIds.length > 0) {
      const nextUnanswered = questions.findIndex((q) => !answeredQuestionIds.includes(q.id));
      if (nextUnanswered >= 0) {
        setCurrentQIdx(nextUnanswered);
      } else if (questions.length > 0) {
        setCurrentQIdx(questions.length - 1);
        setSubmitted(true);
      }
    }
  }, [savedAnswers, questions]);

  // Timer
  useEffect(() => {
    if (!caseData || isPaused) return;
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (caseData && next >= (caseData.duration_minutes || caseData.duration)) {
          clearInterval(interval);
          handleAutoComplete();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [caseData, isPaused]);

  const handleAutoComplete = useCallback(async () => {
    // Save whatever the candidate is currently typing, then evaluate.
    if (attempt && currentQuestion && response.trim() && !answeredQuestionIds.includes(currentQuestion.id)) {
      await saveAnswer(currentQuestion.id, {
        answer_text: response,
        duration_seconds: Math.round((Date.now() - questionStartTime) / 1000),
      });
    }
    await completeAndEvaluate();
  }, [attempt, currentQuestion, response, answeredQuestionIds, questionStartTime]);

  // Server-authoritative evaluation: the backend runs the evaluator prompt
  // (Prompt Registry → Groq), validates the structured output, and persists
  // the real scores. No client-side scoring happens anywhere.
  const completeAndEvaluate = useCallback(async () => {
    if (!attempt) return;
    setEvaluating(true);
    setEvaluateError(null);
    try {
      await evaluateAttempt(attempt.id);
      navigate(`/cases/${caseData?.id}/feedback`);
    } catch (e: any) {
      setEvaluateError(
        extractApiMessage(
          e,
          "Evaluation failed. Check that the AI provider is configured.",
        ),
      );
      setEvaluating(false);
    }
  }, [attempt, caseData, evaluateAttempt, navigate]);

  const handleSubmitAnswer = async () => {
    if (!response.trim() || !attempt || !currentQuestion) return;

    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    await saveAnswer(currentQuestion.id, {
      answer_text: response,
      duration_seconds: timeSpent,
    });
    setSubmitted(true);
  };

  const handleNextQuestion = async () => {
    if (isLastQuestion) {
      await completeAndEvaluate();
      return;
    }
    setCurrentQIdx((prev) => prev + 1);
    setResponse("");
    setSubmitted(false);
    setQuestionStartTime(Date.now());
  };

  if (!caseData || !currentQuestion) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <h2 className="text-xl font-bold">Case not found</h2>
        </div>
      </AppLayout>
    );
  }

  const durationSeconds = caseData.duration_minutes || caseData.duration;
  const timeRemaining = Math.max(0, durationSeconds - elapsed);

  return (
    <AppLayout>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight">{caseData.title}</h1>
          <Badge variant="secondary" className="text-xs">{caseData.type}</Badge>
        </div>
        <div className="flex items-center gap-4">
          <Timer elapsed={elapsed} total={durationSeconds} variant="countdown" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Question {currentQIdx + 1} of {totalQuestions}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: totalQuestions }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 w-6 rounded-full",
                    answeredQuestionIds.includes(questions[i]?.id)
                      ? "bg-emerald-500"
                      : i === currentQIdx
                      ? "bg-primary"
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsPaused(!isPaused)} disabled={evaluating}>
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {evaluateError && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-900 flex-1">
            <p className="font-semibold">Evaluation failed</p>
            <p className="mt-0.5">{evaluateError}</p>
            <p className="mt-1 text-xs text-amber-700">
              Your answers are saved. Set GROQ_API_KEY on the backend and retry.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            disabled={evaluating}
            onClick={completeAndEvaluate}
          >
            Retry Evaluation
          </Button>
        </div>
      )}

      {/* Two-panel layout */}
      <div className="grid gap-4 lg:grid-cols-[1fr_380px] h-[calc(100vh-140px)]">
        {/* Left: Interviewer panel */}
        <div className="flex flex-col rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-xl shadow-slate-200/50">
          {/* Client Situation */}
          <div className="border-b bg-muted/30 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Client Situation
            </p>
            <p className="text-sm font-semibold">{caseData.company}</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              &ldquo;{caseData.description}&rdquo;
            </p>
          </div>

          {/* Conversation */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {questions.slice(0, currentQIdx + 1).map((q, i) => {
              const savedAnswer = savedAnswers.find((a) => a.question_id === q.id);
              return (
                <div key={q.id} className="space-y-3">
                  {/* Interviewer question */}
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed bg-muted text-foreground">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Interviewer — Q{q.display_order + 1}
                      </p>
                      <p>{q.question_text}</p>
                    </div>
                  </div>

                  {/* Candidate response (if answered) */}
                  {savedAnswer && savedAnswer.answer_text && (
                    <div className="flex justify-end">
                      <div className="max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed bg-primary text-primary-foreground">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70 mb-1.5">
                          Your Response
                        </p>
                        <p>{savedAnswer.answer_text}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Current question if not yet answered */}
            {currentQuestion && !submitted && !answeredQuestionIds.includes(currentQuestion.id) && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed bg-muted text-foreground">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Interviewer — Q{currentQuestion.display_order + 1}
                  </p>
                  <p>{currentQuestion.question_text}</p>
                </div>
              </div>
            )}
          </div>

          {/* Response input */}
          <div className="border-t px-5 py-4">
            {evaluating ? (
              <div className="flex items-center justify-center gap-3 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Evaluating your case with AI… this may take a moment.
              </div>
            ) : submitted ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  {isLastQuestion
                    ? "Answer saved. Complete the case to receive your AI evaluation."
                    : "Answer saved. Move on to the next question."}
                </p>
                <Button
                  onClick={handleNextQuestion}
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                  disabled={evaluating}
                >
                  {isLastQuestion ? "Complete Case" : "Next Question"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Type your response..."
                  className="min-h-[100px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitAnswer();
                    }
                  }}
                />
                <div className="absolute bottom-3 right-3">
                  <Button
                    size="sm"
                    onClick={handleSubmitAnswer}
                    disabled={!response.trim()}
                    className="h-8 gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Submit
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Candidate workspace */}
        <div className="flex flex-col rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-xl shadow-slate-200/50">
          <Tabs defaultValue="notes" className="flex flex-col h-full">
            <TabsList className="mx-4 mt-4 w-auto">
              <TabsTrigger value="notes" className="gap-1.5 text-xs">
                <StickyNote className="h-3 w-3" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="structure" className="gap-1.5 text-xs">
                <GitBranch className="h-3 w-3" />
                Structure
              </TabsTrigger>
              <TabsTrigger value="calculator" className="gap-1.5 text-xs">
                <Calculator className="h-3 w-3" />
                Calculator
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="flex-1 overflow-y-auto px-4 pb-4 mt-0">
              <Textarea
                placeholder="Take notes during the case..."
                className="min-h-full border-0 bg-transparent resize-none focus-visible:ring-0 text-sm leading-relaxed"
              />
            </TabsContent>

            <TabsContent value="structure" className="flex-1 overflow-y-auto px-4 pb-4 mt-0">
              <div className="pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Issue Tree
                </p>
                <IssueTreeNode node={mockIssueTree} />
              </div>
            </TabsContent>

            <TabsContent value="calculator" className="flex-1 overflow-y-auto px-4 pb-4 mt-0">
              <div className="pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Calculator
                </p>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="font-mono text-right text-2xl font-semibold tabular-nums mb-4 h-8">
                    0
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "0", ".", "C", "+"].map(
                      (btn) => (
                        <button
                          key={btn}
                          className={cn(
                            "h-9 rounded-md text-sm font-medium transition-colors",
                            ["÷", "×", "−", "+"].includes(btn)
                              ? "bg-primary/10 text-primary hover:bg-primary/20"
                              : btn === "C"
                              ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                              : "bg-card hover:bg-muted border text-foreground"
                          )}
                        >
                          {btn}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}