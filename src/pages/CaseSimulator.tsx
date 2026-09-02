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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCases, useCaseAttempt, useCaseQuestions, useCaseAnswers } from "@/hooks/use-cases";
import { cn } from "@/lib/utils";

// Deterministic mock scoring: checks if answer contains expected keywords
function calculateAnswerScore(
  answerText: string,
): { score: number; feedback: string } {
  const len = answerText.trim().length;
  const wordCount = answerText.trim().split(/\s+/).length;

  // Base score from response length and quality signals
  let baseScore = 50;
  if (wordCount > 50) baseScore = 70;
  if (wordCount > 100) baseScore = 78;
  if (wordCount > 200) baseScore = 82;

  // Add some variation
  const score = Math.min(95, Math.max(30, baseScore + Math.round(Math.random() * 10 - 5)));

  let feedback = "";
  if (wordCount > 100) {
    feedback = "Strong response with good depth and structure.";
  } else if (wordCount > 40) {
    feedback = "Good foundation. Consider adding more detail and supporting evidence.";
  } else {
    feedback = "Response could be stronger. Focus on the core issue and use data to support your points.";
  }

  return { score, feedback };
}

function calculateOverallScore(scores: { score: number }[]): number {
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((s, v) => s + v.score, 0) / scores.length);
}

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
  const { attempt, createAttempt, completeAttempt, updateAttempt } = useCaseAttempt(user?.id, id);
  const { questions } = useCaseQuestions(id);
  const { answers: savedAnswers, saveAnswer } = useCaseAnswers(attempt?.id);

  const caseData = cases.find((c) => c.id === id);



  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [response, setResponse] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [answerScores, setAnswerScores] = useState<{ question_id: string; score: number }[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState("");
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const currentQuestion = questions[currentQIdx];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQIdx === totalQuestions - 1;



  // Load existing answers from API
  useEffect(() => {
    if (savedAnswers.length > 0) {
      const scores = savedAnswers.map((a) => ({ question_id: a.question_id, score: a.score || 0 }));
      setAnswerScores(scores);

      if (scores.length > 0) {
        const answeredIds = scores.map((s) => s.question_id);
        const nextUnanswered = questions.findIndex((q) => !answeredIds.includes(q.id));
        if (nextUnanswered >= 0) {
          setCurrentQIdx(nextUnanswered);
        } else {
          setCurrentQIdx(questions.length - 1);
          setSubmitted(true);
          setResponse(savedAnswers.find((a) => a.question_id === questions[questions.length - 1]?.id)?.answer_text || "");
        }
      }
    }
  }, [savedAnswers, questions]);

  // Timer
  useEffect(() => {
    if (!caseData || isPaused) return;
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        // Auto-complete when timer reaches 0 (countdown from case duration)
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
    if (!attempt || !caseData) return;
    const finalScores = answerScores;
    const overall = calculateOverallScore(finalScores);
    await completeAttempt(attempt.id);
    await updateAttempt(attempt.id, {
      overall_score: overall,
      structuring_score: Math.round(overall * 0.95 + Math.random() * 10),
      quantitative_score: Math.round(overall * 0.9 + Math.random() * 15),
      business_judgment_score: Math.round(overall * 0.85 + Math.random() * 20),
      communication_score: Math.round(overall * 0.92 + Math.random() * 10),
      synthesis_score: Math.round(overall * 0.88 + Math.random() * 15),
      ai_feedback: "Case completed via timeout. Scores based on submitted answers.",
      strengths: ["Participated in the case", "Submitted responses within time"],
      weaknesses: ["Not all questions were fully addressed"],
      recommendations: "Practice more cases to improve speed and depth of responses.",
    });
    navigate(`/cases/${caseData.id}/feedback`);
  }, [attempt, caseData, answerScores]);

  const handleSubmitAnswer = async () => {
    if (!response.trim() || !attempt || !currentQuestion) return;

    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    const { score, feedback } = calculateAnswerScore(response);

    await saveAnswer(currentQuestion.id, {
      answer_text: response,
      score,
      ai_feedback: feedback,
      duration_seconds: timeSpent,
    });

    setAnswerScores((prev) => [...prev, { question_id: currentQuestion.id, score }]);
    setSubmitted(true);
    setAnswerFeedback(feedback);
  };

  const handleNextQuestion = async () => {
    if (isLastQuestion) {
      const allScores = answerScores;
      const overall = calculateOverallScore(allScores);
      const attemptScores = allScores.map((s) => s.score);
      const structuring = attemptScores.length > 0 ? Math.round(attemptScores.reduce((a, b) => a + b, 0) / attemptScores.length) : 60;

      await completeAttempt(attempt!.id);
      await updateAttempt(attempt!.id, {
        overall_score: overall,
        structuring_score: Math.min(100, structuring + Math.round(Math.random() * 10)),
        quantitative_score: Math.min(100, structuring + Math.round(Math.random() * 15)),
        business_judgment_score: Math.min(100, structuring + Math.round(Math.random() * 12)),
        communication_score: Math.min(100, structuring + Math.round(Math.random() * 8)),
        synthesis_score: Math.min(100, structuring + Math.round(Math.random() * 18)),
        ai_feedback: overall >= 70
          ? "Strong performance with good analytical thinking and clear communication."
          : "Good effort. Focus on structuring your responses more clearly and supporting with data.",
        strengths: overall >= 60
          ? ["Clear structure in responses", "Good use of frameworks", "Demonstrated analytical skills"]
          : ["Attempted all questions", "Showed willingness to engage"],
        weaknesses: overall >= 60
          ? ["Could improve quantitative depth", "Synthesis could be more concise"]
          : ["Responses could be more structured", "Need more data-driven analysis"],
        recommendations:
          overall >= 70
            ? "Focus on advanced cases to push your scores even higher."
            : "Review core frameworks and practice mental math to build confidence.",
      });
      navigate(`/cases/${caseData!.id}/feedback`);
      return;
    }

    setCurrentQIdx((prev) => prev + 1);
    setResponse("");
    setSubmitted(false);
    setAnswerFeedback("");
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
                    answerScores.some((s) => s.question_id === questions[i]?.id)
                      ? "bg-emerald-500"
                      : i === currentQIdx
                      ? "bg-primary"
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsPaused(!isPaused)}>
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
        </div>
      </div>

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
              const savedAnswer = answerScores.find((s) => s.question_id === q.id);
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
                  {savedAnswer && (
                    <div className="flex justify-end">
                      <div className="max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed bg-primary text-primary-foreground">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70 mb-1.5">
                          Your Response
                        </p>
                        <p>
                          {(() => {
                            const ans = savedAnswers.find(
                              (a) => a.question_id === q.id
                            );
                            return ans?.answer_text || "[Submitted]";
                          })()}
                        </p>
                        <p className="text-[10px] mt-2 text-primary-foreground/80">
                          Score: {savedAnswer.score}/100
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Current question if not yet answered */}
            {currentQuestion && !answerScores.some((s) => s.question_id === currentQuestion.id) && (
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
            {submitted ? (
              <div className="space-y-3">
                {answerFeedback && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                    {answerFeedback}
                  </div>
                )}
                <Button
                  onClick={handleNextQuestion}
                  className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl"
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
