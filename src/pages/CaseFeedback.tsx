import { AppLayout } from "@/components/layout/AppLayout";
import { ScoreRing } from "@/components/app/ScoreRing";
import { SkillBar } from "@/components/app/SkillBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Lightbulb,
  Target,
} from "lucide-react";
import { caseFeedback, skillScores } from "@/data/mock-data";
import { Link } from "react-router";

export default function CaseFeedback() {
  return (
    <AppLayout>
      {/* Header */}
      <div className="text-center mb-8">
        <Badge variant="secondary" className="mb-3">
          Case Complete
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight">Case Feedback</h1>
        <p className="text-muted-foreground mt-1">
          Global Coffee Co. — Profitability Case
        </p>
      </div>

      {/* Score */}
      <div className="flex justify-center mb-8">
        <ScoreRing score={caseFeedback.score} size={180} strokeWidth={10} />
      </div>

      {/* Skill breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Skill Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {skillScores.map((skill) => (
            <SkillBar
              key={skill.name}
              name={skill.name}
              score={skill.score}
              showTrend={false}
            />
          ))}
        </CardContent>
      </Card>

      {/* Feedback sections */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Strengths */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              What You Did Well
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {caseFeedback.strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                <p className="text-sm leading-relaxed">{s}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Biggest Opportunity */}
        <Card className="border-amber-500/30 bg-amber-500/[0.02]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Biggest Opportunity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-amber-700 border-amber-300">
                {caseFeedback.biggestOpportunity.skill}
              </Badge>
              <span className="text-sm font-semibold tabular-nums">
                {caseFeedback.biggestOpportunity.score}/100
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {caseFeedback.biggestOpportunity.feedback}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Better Approach */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-primary" />
            Better Approach
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{caseFeedback.betterApproach}</p>
        </CardContent>
      </Card>

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
