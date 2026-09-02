import { useNavigate } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Clock,
  Calculator,
  Brain,
  BarChart3,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAssessments, useAssessmentAttempts } from "@/hooks/use-assessments";
import { cn } from "@/lib/utils";
import { FadeIn, StaggerList, StaggerItem } from "@/components/app/AnimatedSection";

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Numerical Reasoning": Calculator,
  "Logical Reasoning": Brain,
  "Data Interpretation": BarChart3,
  "Situational Judgment": Briefcase,
};

export default function Assessments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { assessments } = useAssessments();
  const { attempts } = useAssessmentAttempts(user?.id);

  const getAssessmentStatus = (assessmentId: string) => {
    const assessmentAttempts = attempts.filter((a) => a.assessment_id === assessmentId);
    if (assessmentAttempts.length > 0) {
      const latest = assessmentAttempts[assessmentAttempts.length - 1];
      return { completed: true, score: latest.score };
    }
    return { completed: false, score: undefined };
  };

  return (
    <AppLayout>
      <FadeIn>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Assessments</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Evaluate your numerical, logical, and analytical skills.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-xl shadow-slate-200/50">
          <StaggerList>
            {assessments.map((a) => {
              const Icon = categoryIcons[a.category] || Calculator;
              const { completed, score } = getAssessmentStatus(a.id);
              const questionCount = a.total_questions || a.questions || 0;
              const difficultyColor =
                a.difficulty === "Easy"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : a.difficulty === "Medium"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-red-50 text-red-700 border-red-200";

              return (
                <StaggerItem key={a.id}>
                  <div className="flex items-center gap-4 px-5 py-4 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors group">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 shrink-0">
                      <Icon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{a.title}</span>
                        {completed && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="outline" className={cn("text-[10px] font-medium px-1.5 py-0", difficultyColor)}>
                          {a.difficulty}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{questionCount} questions</span>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-xs text-muted-foreground">{a.time_limit_minutes || a.time_minutes} min</span>
                      </div>
                    </div>
                    {completed && score != null && (
                      <span className={cn(
                        "text-sm font-bold tabular-nums shrink-0",
                        score >= 80 ? "text-emerald-600" : score >= 65 ? "text-primary" : "text-amber-600"
                      )}>
                        {score}%
                      </span>
                    )}
                    <Button
                      variant={completed ? "ghost" : "default"}
                      size="sm"
                      className={cn(
                        "gap-1.5 shrink-0 rounded-xl",
                        !completed && "shadow-sm hover:shadow-md hover:shadow-primary/20"
                      )}
                      onClick={() => navigate(`/assessments/${a.id}`)}
                    >
                      {completed ? "Retake" : "Start"}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerList>
        </div>
      </FadeIn>
    </AppLayout>
  );
}
