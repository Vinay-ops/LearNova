import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  ArrowLeft,
  Flag,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function AssessmentTaking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    assessments,
    getAssessmentQuestionsForAssessment,
    createAssessmentAttempt,
    completeAssessmentAttempt,
    saveAssessmentAnswer,
  } = useData();

  const assessment = assessments.find((a) => a.id === id);
  const questions = id ? getAssessmentQuestionsForAssessment(id) : [];

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const totalSeconds = (assessment?.timeMinutes || 25) * 60;
  const timeRemaining = Math.max(0, totalSeconds - elapsed);
  const progress = questions.length > 0 ? ((currentQ + 1) / questions.length) * 100 : 0;

  // Create attempt on mount
  useEffect(() => {
    if (user && id && !attemptId) {
      const attempt = createAssessmentAttempt(user.id, id);
      setAttemptId(attempt.id);
    }
  }, [user, id]);

  // Timer
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= totalSeconds) {
          clearInterval(interval);
          handleSubmit();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, totalSeconds, attemptId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleFlag = () => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentQ)) next.delete(currentQ);
      else next.add(currentQ);
      return next;
    });
  };

  const selectAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = optionIndex;
    setAnswers(newAnswers);

    // Save immediately
    if (attemptId && questions[currentQ]) {
      saveAssessmentAnswer({
        attemptId,
        questionId: questions[currentQ].id,
        userId: user?.id || "",
        selectedIndex: optionIndex,
        isCorrect: optionIndex === questions[currentQ].correctIndex,
      });
    }
  };

  const handleSubmit = useCallback(() => {
    if (!attemptId) return;

    // Calculate score
    let correct = 0;
    answers.forEach((ans, i) => {
      if (ans != null && questions[i] && ans === questions[i].correctIndex) {
        correct++;
      }
    });

    const totalQs = questions.length;
    const score = totalQs > 0 ? Math.round((correct / totalQs) * 100) : 0;

    completeAssessmentAttempt(attemptId, {
      score,
      totalQuestions: totalQs,
      correctAnswers: correct,
      startedAt: new Date(Date.now() - elapsed * 1000).toISOString(),
      completedAt: new Date().toISOString(),
    });

    navigate(`/assessments/${id}/results`);
  }, [attemptId, answers, questions, elapsed, id]);

  if (!assessment) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <h2 className="text-xl font-bold">Assessment not found</h2>
        </div>
      </AppLayout>
    );
  }

  const q = questions[currentQ];
  if (!q) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <h2 className="text-xl font-bold">No questions available</h2>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        {/* Assessment header */}
        <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl border border-border/50 shadow-sm">
          <Button variant="ghost" size="sm" onClick={() => navigate("/assessments")} className="rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Exit
          </Button>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="tabular-nums border-primary/20 bg-primary/5 text-primary">
              Question {currentQ + 1} / {questions.length}
            </Badge>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground bg-muted/50 px-3 py-1.5 rounded-xl border border-border/40">
              <Clock className={cn("h-4 w-4", timeRemaining < 300 ? "text-red-500" : "text-primary")} />
              <span className={cn("tabular-nums", timeRemaining < 300 ? "text-red-500" : "")}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        </div>

        <Progress value={progress} className="mb-8 h-2 bg-muted [&>div]:bg-primary" />

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-border/50 bg-white p-6 sm:p-8 mb-6 shadow-sm"
          >
            <div className="flex items-start justify-between mb-6">
              <p className="text-lg font-semibold leading-relaxed pr-4 text-foreground">
                {q.question}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "shrink-0 h-9 w-9 rounded-xl",
                  flagged.has(currentQ) && "text-amber-600 bg-amber-50"
                )}
                onClick={toggleFlag}
              >
                <Flag className="h-4.5 w-4.5" />
              </Button>
            </div>

            <div className="space-y-3">
              {q.options.map((opt: any, i: number) => (
                <button
                  key={i}
                  onClick={() => selectAnswer(i)}
                  className={cn(
                    "w-full text-left rounded-xl border-2 px-5 py-4 text-sm transition-all",
                    answers[currentQ] === i
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30 hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg border text-sm font-bold shrink-0 transition-colors",
                        answers[currentQ] === i
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30 text-muted-foreground"
                      )}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span
                      className={cn(
                        "font-medium",
                        answers[currentQ] === i ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {opt}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button
            variant="outline"
            className="rounded-xl border-border/60 w-full sm:w-auto"
            onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
            disabled={currentQ === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="flex flex-wrap justify-center gap-1.5 max-w-[280px]">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={cn(
                  "h-8 w-8 rounded-lg text-xs font-semibold transition-all",
                  i === currentQ
                    ? "bg-primary text-primary-foreground shadow-sm scale-110"
                    : answers[i] !== null
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-white border border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
          {currentQ < questions.length - 1 ? (
            <Button
              className="rounded-xl shadow-sm w-full sm:w-auto"
              onClick={() => setCurrentQ((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <>
              {confirmSubmit ? (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setConfirmSubmit(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="gap-1.5 rounded-xl shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleSubmit}
                  >
                    Confirm Submit
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  className="gap-1.5 rounded-xl shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
                  onClick={() => setConfirmSubmit(true)}
                >
                  Submit Assessment
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
