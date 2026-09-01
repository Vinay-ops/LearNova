import { AppLayout } from "@/components/layout/AppLayout";
import { SkillBar } from "@/components/app/SkillBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Lightbulb,
  Target,
  TrendingUp,
} from "lucide-react";
import { caseFeedback, skillScores } from "@/data/mock-data";
import { Link } from "react-router";

const skillColor = (score: number) =>
  score >= 80 ? "bg-emerald-600" : score >= 65 ? "bg-accent" : "bg-amber-500";

export default function CaseFeedback() {
  return (
    <AppLayout>
      {/* Header */}
      <div className="text-center mb-8">
        <Badge variant="secondary" className="mb-3 text-xs">
          Case Complete
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight">Global Coffee Co.</h1>
        <p className="text-muted-foreground mt-1">Profitability Case</p>
      </div>

      {/* Big score — not in a ring, just big number */}
      <div className="text-center mb-8 pb-8 border-b">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">
          Your Score
        </p>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-6xl font-bold tracking-tight tabular-nums">
            {caseFeedback.score}
          </span>
          <span className="text-2xl text-muted-foreground">/ {caseFeedback.maxScore}</span>
        </div>
      </div>

      {/* Skill breakdown — dense rows, not cards */}
      <div className="mb-8">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
          Skill Breakdown
        </p>
        <div className="rounded-xl border bg-card p-5">
          <div className="space-y-3">
            {skillScores.map((skill) => (
              <div key={skill.name} className="flex items-center gap-3">
                <span className="text-sm w-40 text-muted-foreground shrink-0">
                  {skill.name}
                </span>
                <div className="flex-1 h-2 rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${skillColor(skill.score)}`}
                    style={{ width: `${skill.score}%` }}
                  />
                </div>
                <span className="text-sm font-semibold tabular-nums w-8 text-right">
                  {skill.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strengths + Opportunity — side by side, not cards */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              What You Did Well
            </p>
          </div>
          <div className="space-y-2.5">
            {caseFeedback.strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5 pl-6">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                <p className="text-sm leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Biggest Opportunity
            </p>
          </div>
          <div className="pl-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-semibold text-sm">
                {caseFeedback.biggestOpportunity.skill}
              </span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {caseFeedback.biggestOpportunity.score}/100
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {caseFeedback.biggestOpportunity.feedback}
            </p>
          </div>
        </div>
      </div>

      {/* Better Approach */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-primary" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Better Approach
          </p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4 pl-6">
          <p className="text-sm leading-relaxed">{caseFeedback.betterApproach}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/practice" className="flex-1">
          <Button className="w-full gap-2">
            <Target className="h-4 w-4" />
            Practice This Weakness
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link to="/cases/case-1" className="flex-1">
          <Button variant="outline" className="w-full gap-2">
            <RotateCcw className="h-4 w-4" />
            Try Case Again
          </Button>
        </Link>
      </div>
    </AppLayout>
  );
}
