import { useParams, Link } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, ArrowRight, RotateCcw, Lightbulb, Target, Home } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCases, useCaseAttempts } from "@/hooks/use-cases";
import { motion } from "framer-motion";
import { FadeIn, StaggerList, StaggerItem, AnimatedBar } from "@/components/app/AnimatedSection";
import { cn } from "@/lib/utils";

const skillColor = (score: number) =>
  score >= 80 ? "bg-emerald-600" : score >= 65 ? "bg-accent" : "bg-amber-500";

export default function CaseFeedback() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();  const { cases } = useCases();
  const { attempts } = useCaseAttempts(user?.id);
  const caseData = cases.find((c) => c.id === id);
  const completedAttempts = attempts.filter((a) => a.case_id === id && a.status === "completed");
  const latestAttempt = completedAttempts[completedAttempts.length - 1];

  if (!caseData || !latestAttempt) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <h2 className="text-xl font-bold text-slate-900">No completed attempt found</h2>
          <p className="text-muted-foreground mt-2 text-sm">Complete a case to see your feedback.</p>
          <Link to="/practice">
            <Button className="mt-4">Back to Practice</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const overallScore = latestAttempt.overall_score || 0;
  const maxScore = 100;

  const skillBreakdown = [
    { name: "Structuring", score: latestAttempt.structuring_score || 0 },
    { name: "Quantitative Analysis", score: latestAttempt.quantitative_score || 0 },
    { name: "Business Judgment", score: latestAttempt.business_judgment_score || 0 },
    { name: "Communication", score: latestAttempt.communication_score || 0 },
    { name: "Synthesis", score: latestAttempt.synthesis_score || 0 },
  ];

  const weakestSkill = [...skillBreakdown].sort((a, b) => a.score - b.score)[0];

  return (
    <AppLayout>
      {/* Header */}
      <div className="text-center mb-8">
        <Badge variant="secondary" className="mb-3 text-xs">Case Complete</Badge>
        <h1 className="text-2xl font-bold tracking-tight">{caseData.title}</h1>
        <p className="text-muted-foreground mt-1">{caseData.type} Case</p>
      </div>

      {/* Big score */}
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
          <span className="text-6xl font-bold tracking-tight tabular-nums">{overallScore}</span>
          <span className="text-2xl text-muted-foreground">/ {maxScore}</span>
        </div>
      </motion.div>

      {/* Skill breakdown */}
      <FadeIn delay={0.3} className="mb-8">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
          Skill Breakdown
        </p>
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50">
          <StaggerList className="space-y-3">
            {skillBreakdown.map((skill, i) => (
              <StaggerItem key={skill.name}>
                <div className="flex items-center gap-3">
                  <span className="text-sm w-40 text-muted-foreground shrink-0">{skill.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <AnimatedBar
                      width={skill.score}
                      className={`h-full rounded-full ${skillColor(skill.score)}`}
                      delay={0.3 + i * 0.08}
                    />
                  </div>
                  <span className="text-sm font-semibold tabular-nums w-8 text-right">{skill.score}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </div>
      </FadeIn>

      {/* Strengths + Opportunity */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <FadeIn delay={0.4}>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              What You Did Well
            </p>
          </div>
          <div className="space-y-2.5">
            {(latestAttempt.strengths.length > 0 ? latestAttempt.strengths : ["Good effort on the case"]).map((s: string, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-start gap-2.5 pl-6"
              >
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                <p className="text-sm leading-relaxed">{s}</p>
              </motion.div>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.45}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Biggest Opportunity
            </p>
          </div>
          <div className="pl-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-semibold text-sm">{weakestSkill.name}</span>
              <span className="text-sm text-muted-foreground tabular-nums">{weakestSkill.score}/100</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {(latestAttempt.weaknesses.length > 0
                ? latestAttempt.weaknesses[0]
                : "This is your lowest skill. Targeted practice can help improve it quickly.")}
            </p>
          </div>
        </FadeIn>
      </div>

      {/* Better Approach / Feedback */}
      <FadeIn delay={0.5} className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-primary" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Feedback
          </p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4 pl-6">
          <p className="text-sm leading-relaxed">
            {latestAttempt.ai_feedback || "Complete the case to receive detailed feedback."}
          </p>
        </div>
      </FadeIn>

      {/* Recommendation */}
      {latestAttempt.recommendations && (
        <FadeIn delay={0.55} className="mb-8">
          <div className="rounded-lg border bg-purple-50 p-4 pl-6">
            <p className="text-xs font-semibold text-purple-700 uppercase tracking-widest mb-1">
              Recommendation
            </p>
            <p className="text-sm leading-relaxed text-purple-900">{latestAttempt.recommendations || ""}</p>
          </div>
        </FadeIn>
      )}

      {/* Actions */}
      <FadeIn delay={0.6} className="flex flex-col sm:flex-row gap-3">
        <Link to="/practice" className="flex-1">
          <Button className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-200">
            <Target className="h-4 w-4" />
            Practice Weakness
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link to={`/cases/${id}`} className="flex-1">
          <Button variant="outline" className="w-full gap-2 rounded-xl font-bold">
            <RotateCcw className="h-4 w-4" />
            Try Again
          </Button>
        </Link>
        <Link to="/dashboard" className="flex-1">
          <Button variant="ghost" className="w-full gap-2 rounded-xl font-bold">
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
        </Link>
      </FadeIn>
    </AppLayout>
  );
}
