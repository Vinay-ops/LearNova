import { useParams, Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useAssessments, useAssessmentAttempts } from "@/hooks/use-assessments";
import { assessmentsApi } from "@/features/assessments";
import { motion } from "framer-motion";
import { FadeIn, AnimatedBar } from "@/components/app/AnimatedSection";
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  RotateCcw,
  ArrowRight,
  Target,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssessmentQuestionReview } from "@/types";

interface SubtopicStat {
  subtopic: string;
  total: number;
  correct: number;
}

const letter = (i?: number) => (typeof i === "number" ? String.fromCharCode(65 + i) : "—");

export default function AssessmentResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { assessments } = useAssessments();
  const { attempts, loading: attemptsLoading } = useAssessmentAttempts(user?.id);
  const assessment = assessments.find((a) => a.id === id);

  const latestAttempt = [...attempts]
    .filter((a) => a.assessment_id === id && a.status === "completed")
    .sort((a, b) => (a.completed_at || a.started_at) < (b.completed_at || b.started_at) ? 1 : -1)[0];

  // The review endpoint is completion-gated by the backend — the answer key
  // and explanations only come back once the attempt is completed.
  const [review, setReview] = useState<AssessmentQuestionReview[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    if (!latestAttempt) return;
    setReviewLoading(true);
    assessmentsApi
      .getReview(latestAttempt.id)
      .then(setReview)
      .catch(() => setReview([]))
      .finally(() => setReviewLoading(false));
  }, [latestAttempt?.id]);

  if (attemptsLoading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto py-24 text-center">
          <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center animate-pulse mx-auto mb-4">
            <div className="h-4 w-4 rounded-lg bg-primary/60" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading results…</p>
        </div>
      </AppLayout>
    );
  }

  if (!latestAttempt) {
    return (
      <AppLayout>
        <div className="text-center py-24">
          <h2 className="text-xl font-bold text-slate-900">No completed attempt found</h2>
          <Link to="/assessments">
            <Button className="mt-4 rounded-xl">Back to Assessments</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  if (reviewLoading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto py-24 text-center">
          <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center animate-pulse mx-auto mb-4">
            <div className="h-4 w-4 rounded-lg bg-primary/60" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading review…</p>
        </div>
      </AppLayout>
    );
  }

  const correctCount = latestAttempt.correct_count;
  const totalQuestions = latestAttempt.total_questions || review.length || 0;
  const score = Math.round(Number(latestAttempt.score) || 0);

  // Review rows are server-ordered by display_order and server-graded.
  const rows = review.slice().sort((a, b) => a.display_order - b.display_order);
  const answeredCount = rows.filter((r) => r.answered).length;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);

  // Subtopic performance (deterministic arithmetic over server-graded rows).
  const bySubtopic = new Map<string, SubtopicStat>();
  rows.forEach((row) => {
    const tag = row.skill_tag || assessment?.category || "General";
    const bucket = bySubtopic.get(tag) || { subtopic: tag, total: 0, correct: 0 };
    if (row.answered) {
      bucket.total += 1;
      if (row.is_correct) bucket.correct += 1;
    }
    bySubtopic.set(tag, bucket);
  });
  const subtopics = Array.from(bySubtopic.values())
    .filter((s) => s.total > 0)
    .sort((a, b) => a.correct / a.total - b.correct / b.total);
  const weakSubtopics = subtopics
    .filter((s) => s.correct / s.total < 0.7)
    .map((s) => s.subtopic);

  const practiceWeak = () => {
    const topic = encodeURIComponent(assessment?.category || assessment?.title || "");
    const focus = encodeURIComponent(weakSubtopics.join(","));
    navigate(`/learn?topic=${topic}&focus=${focus}&quiz=1`);
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-3 text-xs">
            Assessment Complete
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{assessment?.title}</h1>
          <p className="text-muted-foreground mt-1">
            {assessment?.category} · {assessment?.difficulty}
          </p>
        </div>

        {/* Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 180 }}
          className="text-center mb-8 pb-8 border-b"
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">
            Your Score
          </p>
          <div className="flex items-baseline justify-center gap-2">
            <span
              className={cn(
                "text-6xl font-bold tracking-tight tabular-nums",
                score >= 80 ? "text-emerald-600" : score >= 65 ? "text-primary" : "text-amber-600",
              )}
            >
              {score}%
            </span>
          </div>
        </motion.div>

        {/* Stats */}
        <FadeIn delay={0.3} className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-3xl bg-emerald-50 border border-emerald-200/60 p-5 text-center shadow-xl shadow-slate-200/30">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-extrabold text-emerald-900 tabular-nums">{correctCount}</p>
            <p className="text-xs text-emerald-700 font-medium">Correct</p>
          </div>
          <div className="rounded-3xl bg-red-50 border border-red-200/60 p-5 text-center shadow-xl shadow-slate-200/30">
            <XCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-extrabold text-red-900 tabular-nums">
              {Math.max(0, totalQuestions - correctCount - unansweredCount)}
            </p>
            <p className="text-xs text-red-700 font-medium">Incorrect</p>
          </div>
          <div className="rounded-3xl bg-blue-50 border border-blue-200/60 p-5 text-center shadow-xl shadow-slate-200/30">
            <MinusCircle className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-extrabold text-blue-900 tabular-nums">{unansweredCount}</p>
            <p className="text-xs text-blue-700 font-medium">Unanswered</p>
          </div>
        </FadeIn>

        {/* Weak areas → practice */}
        {weakSubtopics.length > 0 && (
          <FadeIn delay={0.35} className="mb-8">
            <div className="rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 p-6 shadow-xl shadow-slate-200/40">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shrink-0">
                  <Target className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-extrabold text-slate-900">
                    Needs practice: {weakSubtopics.join(", ")}
                  </p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Generate a focused quiz on just these subtopics to improve them.
                  </p>
                </div>
                <Button
                  onClick={practiceWeak}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-full px-5 text-xs shadow-md shadow-blue-200 shrink-0"
                  size="sm"
                >
                  Practice Weak Areas
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </FadeIn>
        )}

        {/* Subtopic breakdown */}
        <FadeIn delay={0.4} className="mb-8">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
            Subtopic Performance
          </p>
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 space-y-4">
            {subtopics.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No answered subtopics yet.</p>
            )}
            {subtopics.map((s) => {
              const percent = Math.round((s.correct / s.total) * 100);
              return (
                <div key={s.subtopic} className="flex items-center gap-3">
                  <span className="text-sm w-44 text-muted-foreground shrink-0 font-medium">
                    {s.subtopic}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <AnimatedBar
                      width={percent}
                      className={cn(
                        "h-full rounded-full",
                        percent >= 80
                          ? "bg-emerald-500"
                          : percent >= 70
                            ? "bg-primary"
                            : "bg-amber-500",
                      )}
                    />
                  </div>
                  <span className="text-sm font-bold tabular-nums w-24 text-right text-slate-700">
                    {s.correct}/{s.total}
                  </span>
                </div>
              );
            })}
          </div>
        </FadeIn>

        {/* Question review */}
        <FadeIn delay={0.45}>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
            Review Answers
          </p>
          <div className="space-y-4 mb-10">
            {rows.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">
                No question details available.
              </p>
            )}
            {rows.map((q, i) => {
              const options = Array.isArray(q.options) ? (q.options as string[]) : [];
              const picked = q.selected_option_index;
              const isCorrect = q.answered && !!q.is_correct;
              return (
                <div
                  key={q.question_id}
                  className={cn(
                    "rounded-3xl border bg-white p-5 shadow-sm",
                    isCorrect ? "border-emerald-200/70" : "border-red-200/70",
                  )}
                >
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">
                        {i + 1}. {q.question_text}
                      </p>
                      <div className="mt-2 space-y-1">
                        {options.map((opt, oi) => {
                          const isCorrectOption = oi === q.correct_option_index;
                          const isPicked = oi === picked;
                          return (
                            <div
                              key={oi}
                              className={cn(
                                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium",
                                isCorrectOption
                                  ? "bg-emerald-50 text-emerald-800"
                                  : isPicked
                                    ? "bg-red-50 text-red-700"
                                    : "text-slate-500",
                              )}
                            >
                              <span
                                className={cn(
                                  "flex h-5 w-5 items-center justify-center rounded-md border text-[10px] font-bold shrink-0",
                                  isCorrectOption
                                    ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                                    : isPicked
                                      ? "border-red-300 bg-red-100 text-red-600"
                                      : "border-slate-200 text-slate-400",
                                )}
                              >
                                {letter(oi)}
                              </span>
                              <span className="flex-1">{opt}</span>
                              {isCorrectOption && (
                                <span className="text-emerald-600 font-bold shrink-0">Correct</span>
                              )}
                              {isPicked && !isCorrectOption && (
                                <span className="text-red-500 font-bold shrink-0">Your answer</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {!q.answered && (
                        <p className="mt-3 text-xs text-slate-400 font-semibold">
                          Not answered — counted as incorrect.
                        </p>
                      )}
                      {q.explanation && (
                        <p className="mt-3 text-xs text-slate-500 leading-relaxed bg-slate-50 rounded-xl px-3 py-2.5">
                          <span className="font-bold text-slate-700">Why: </span>
                          {q.explanation}
                        </p>
                      )}
                      {q.skill_tag && (
                        <Badge variant="outline" className="mt-2 text-[10px] border-primary/20 text-primary bg-primary/5">
                          {q.skill_tag}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </FadeIn>

        {/* Actions */}
        <FadeIn delay={0.5} className="flex flex-wrap gap-3 justify-center mb-12">
          <Link to="/assessments">
            <Button variant="outline" className="gap-2 rounded-xl border-border/60">
              <RotateCcw className="h-4 w-4" />
              All Assessments
            </Button>
          </Link>
          <Link to={`/learn?topic=${encodeURIComponent(assessment?.category || "")}`}>
            <Button className="gap-2 rounded-xl shadow-sm">
              <Sparkles className="h-4 w-4" />
              Learn this topic
            </Button>
          </Link>
          <Link to="/practice">
            <Button variant="ghost" className="gap-2 rounded-xl text-slate-500 font-semibold">
              <BookOpen className="h-4 w-4" />
              Practice
            </Button>
          </Link>
        </FadeIn>
      </div>
    </AppLayout>
  );
}
