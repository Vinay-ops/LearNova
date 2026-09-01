import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Flag,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Brain,
  BarChart3,
  Briefcase,
} from "lucide-react";
import { assessments, assessmentQuestions } from "@/data/mock-data";
import { cn } from "@/lib/utils";

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Numerical Reasoning": Calculator,
  "Logical Reasoning": Brain,
  "Data Interpretation": BarChart3,
  "Situational Judgment": Briefcase,
};

function AssessmentCard({
  title,
  questions,
  timeMinutes,
  difficulty,
  completed,
  score,
  onStart,
}: {
  title: string;
  questions: number;
  timeMinutes: number;
  difficulty: string;
  completed: boolean;
  score?: number;
  onStart: () => void;
}) {
  const Icon = categoryIcons[title] || Calculator;

  return (
    <Card className="group hover:border-primary/30 transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{title}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span>{questions} questions</span>
              <span>·</span>
              <span>{timeMinutes} min</span>
              <span>·</span>
              <span>{difficulty}</span>
            </div>
          </div>
          {completed && score && (
            <Badge
              variant="secondary"
              className={cn(
                "text-xs tabular-nums",
                score >= 80
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-primary/10 text-primary"
              )}
            >
              {score}%
            </Badge>
          )}
        </div>
        {completed && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 mb-3">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Completed</span>
          </div>
        )}
        <Button
          variant={completed ? "outline" : "default"}
          size="sm"
          className="w-full gap-1.5"
          onClick={onStart}
        >
          {completed ? "Retake" : "Start Assessment"}
          <ArrowRight className="h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
}

function ActiveAssessment({ onExit }: { onExit: () => void }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(assessmentQuestions.length).fill(null)
  );
  const [flagged, setFlagged] = useState<Set<number>>(new Set());

  const q = assessmentQuestions[currentQ];
  const progress = ((currentQ + 1) / assessmentQuestions.length) * 100;

  const toggleFlag = () => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentQ)) next.delete(currentQ);
      else next.add(currentQ);
      return next;
    });
  };

  return (
    <div>
      {/* Assessment header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={onExit}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Exit
        </Button>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="tabular-nums">
            Question {currentQ + 1} / {assessmentQuestions.length}
          </Badge>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="tabular-nums">24:32</span>
          </div>
        </div>
      </div>

      <Progress value={progress} className="mb-8" />

      {/* Question */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <p className="text-base font-medium leading-relaxed pr-4">{q.question}</p>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "shrink-0 h-8 w-8",
                flagged.has(currentQ) && "text-amber-600"
              )}
              onClick={toggleFlag}
            >
              <Flag className="h-4 w-4" />
            </Button>
          </div>

          {/* Answer options */}
          <div className="space-y-2">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => {
                  const newAnswers = [...answers];
                  newAnswers[currentQ] = i;
                  setAnswers(newAnswers);
                }}
                className={cn(
                  "w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors",
                  answers[currentQ] === i
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/30 hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium shrink-0",
                      answers[currentQ] === i
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span>{opt}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
          disabled={currentQ === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="flex gap-1">
          {assessmentQuestions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={cn(
                "h-8 w-8 rounded-md text-xs font-medium transition-colors",
                i === currentQ
                  ? "bg-primary text-primary-foreground"
                  : answers[i] !== null
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
        {currentQ < assessmentQuestions.length - 1 ? (
          <Button onClick={() => setCurrentQ((p) => p + 1)}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="gap-1.5">
            Submit Assessment
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function Assessments() {
  const [activeAssessment, setActiveAssessment] = useState(false);

  if (activeAssessment) {
    return (
      <AppLayout>
        <ActiveAssessment onExit={() => setActiveAssessment(false)} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Assessments</h1>
        <p className="text-muted-foreground mt-1">
          Evaluate your numerical, logical, and analytical skills.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {assessments.map((a) => (
          <AssessmentCard
            key={a.id}
            {...a}
            onStart={() => setActiveAssessment(true)}
          />
        ))}
      </div>
    </AppLayout>
  );
}
