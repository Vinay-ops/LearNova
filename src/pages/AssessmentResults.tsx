import { useParams, Link } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { FadeIn, AnimatedBar } from "@/components/app/AnimatedSection";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  Target,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AssessmentResults() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const {
    assessments,
    getAssessmentAttempts,
    getAssessmentAnswers,
    getAssessmentQuestionsForAssessment,
  } = useData();

  const assessment = assessments.find((a) => a.id === id);
  const attempts = user ? getAssessmentAttempts(user.id) : [];
  const assessmentAttempts = attempts.filter((a) => a.assessmentId === id);
  const latestAttempt = assessmentAttempts[assessmentAttempts.length - 1];

  if (!assessment || !latestAttempt) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <h2 className="text-xl font-bold">No completed attempt found</h2>
          <Link to="/assessments">
            <Button className="mt-4">Back to Assessments</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const questions = getAssessmentQuestionsForAssessment(assessment.id);
  const answers = getAssessmentAnswers(latestAttempt.id);

  const correctCount = latestAttempt.correctAnswers;
  const totalQuestions = latestAttempt.totalQuestions;
  const score = latestAttempt.score;
  const avgTimePerQuestion = totalQuestions > 0
    ? Math.round(((new Date(latestAttempt.completedAt).getTime() - new Date(latestAttempt.startedAt).getTime()) / 1000) / totalQuestions)
    : 0;

  // Category breakdown
  const categoryBreakdown = [
    {
      name: assessment.category,
      score,
      correct: correctCount,
      total: totalQuestions,
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-3 text-xs">Assessment Complete</Badge>
          <h1 className="text-2xl font-bold tracking-tight">{assessment.title}</h1>
          <p className="text-muted-foreground mt-1">{assessment.difficulty} · {assessment.timeMinutes} min</p>
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
            <span className={cn(
              "text-6xl font-bold tracking-tight tabular-nums",
              score >= 80 ? "text-emerald-600" : score >= 65 ? "text-primary" : "text-amber-600"
            )}>
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
            <p className="text-2xl font-extrabold text-red-900 tabular-nums">{totalQuestions - correctCount}</p>
            <p className="text-xs text-red-700 font-medium">Incorrect</p>
          </div>
          <div className="rounded-3xl bg-blue-50 border border-blue-200/60 p-5 text-center shadow-xl shadow-slate-200/30">
            <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-extrabold text-blue-900 tabular-nums">{avgTimePerQuestion}s</p>
            <p className="text-xs text-blue-700 font-medium">Avg per question</p>
          </div>
        </FadeIn>

        {/* Topic Breakdown */}
        <FadeIn delay={0.4} className="mb-8">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
            Topic Breakdown
          </p>
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50">
            {categoryBreakdown.map((cat) => (
              <div key={cat.name} className="flex items-center gap-3">
                <span className="text-sm w-40 text-muted-foreground shrink-0">{cat.name}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <AnimatedBar
                    width={cat.score}
                    className={cn(
                      "h-full rounded-full",
                      cat.score >= 80 ? "bg-emerald-600" : cat.score >= 65 ? "bg-primary" : "bg-amber-500"
                    )}
                    delay={0.3}
                  />
                </div>
                <span className="text-sm font-semibold tabular-nums w-16 text-right">
                  {cat.correct}/{cat.total}
                </span>
                <span className="text-sm font-bold tabular-nums w-12 text-right">
                  {cat.score}%
                </span>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Question Review */}
        <FadeIn delay={0.5} className="mb-8">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
            Question Review
          </p>
          <div className="space-y-3">
            {questions.map((q, i) => {
              const userAnswer = answers.find((a) => a.questionId === q.id);
              const isCorrect = userAnswer ? userAnswer.isCorrect : false;
              const wasAnswered = userAnswer != null;

              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className={cn(
                    "rounded-xl border p-4",
                    wasAnswered
                      ? isCorrect
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-red-200 bg-red-50/50"
                      : "border-border bg-white"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      wasAnswered ? (isCorrect ? "bg-emerald-100" : "bg-red-100") : "bg-muted"
                    )}>
                      {wasAnswered ? (
                        isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 mb-2">{q.question}</p>
                      <div className="space-y-1">
                        {q.options.map((opt: any, j: number) => (
                          <p
                            key={j}
                            className={cn(
                              "text-xs px-2 py-1 rounded",
                              j === q.correctIndex
                                ? "bg-emerald-100 text-emerald-800 font-medium"
                                : j === (userAnswer?.selectedIndex ?? -1)
                                ? "bg-red-100 text-red-800"
                                : "text-muted-foreground"
                            )}
                          >
                            {String.fromCharCode(65 + j)}. {opt}
                            {j === q.correctIndex && " ✓"}
                            {j === (userAnswer?.selectedIndex ?? -1) && j !== q.correctIndex && " ✗"}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </FadeIn>

        {/* Actions */}
        <FadeIn delay={0.6} className="flex flex-col sm:flex-row gap-3">
          <Link to="/practice" className="flex-1">
            <Button className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-200">
              <Target className="h-4 w-4" />
              Practice Weak Topics
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to={`/assessments/${id}`} className="flex-1">
            <Button variant="outline" className="w-full gap-2 rounded-xl font-bold">
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
          </Link>
        </FadeIn>
      </div>
    </AppLayout>
  );
}
