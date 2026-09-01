import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  BookOpen,
  Target,
  BarChart3,
  CheckCircle2,
  Brain,
  Zap,
  Clock,
  TrendingUp,
  Shield,
} from "lucide-react";
import { Link } from "react-router";
import { ScoreRing } from "@/components/app/ScoreRing";
import { SkillBar } from "@/components/app/SkillBar";

const steps = [
  { label: "Assess", icon: Target },
  { label: "Diagnose", icon: Brain },
  { label: "Practice", icon: BookOpen },
  { label: "Simulate", icon: Zap },
  { label: "Improve", icon: TrendingUp },
];

const features = [
  {
    icon: BookOpen,
    title: "AI Case Simulator",
    description:
      "Practice realistic consulting cases with an AI interviewer that adapts to your skill level.",
  },
  {
    icon: Target,
    title: "Targeted Practice",
    description:
      "Build specific skills with drills designed around the exact competencies consulting firms test.",
  },
  {
    icon: BarChart3,
    title: "Performance Feedback",
    description:
      "Get detailed, evidence-based feedback on every practice session with actionable improvement tips.",
  },
  {
    icon: TrendingUp,
    title: "Interview Readiness",
    description:
      "Track your overall readiness score and skill development over time with clear metrics.",
  },
  {
    icon: Brain,
    title: "Assessment Practice",
    description:
      "Sharpen numerical reasoning, logical thinking, and data interpretation with timed assessments.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              CP
            </div>
            <span className="font-semibold text-sm tracking-tight">CasePilot</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="gap-1.5">
                Start Practicing
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4 text-xs">
              AI-Powered Interview Preparation
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl leading-[1.1] text-balance">
              Train for the consulting interview you actually want.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-xl">
              Practice realistic cases, identify your weaknesses, and build measurable
              interview readiness before the real interview.
            </p>
            <div className="flex items-center gap-3 mt-8">
              <Link to="/auth">
                <Button size="lg" className="gap-2">
                  Start Practicing
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg">
                See How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Product Preview */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-xl border bg-card p-6 shadow-lg">
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            {/* Left: Skill bars */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Interview Readiness
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold tracking-tight tabular-nums">
                      78
                    </span>
                    <span className="text-lg text-muted-foreground">/ 100</span>
                  </div>
                  <p className="text-xs text-emerald-600 font-medium mt-0.5">
                    +12 this month
                  </p>
                </div>
              </div>
              <div className="space-y-2.5">
                <SkillBar name="Structuring" score={82} showTrend={false} />
                <SkillBar name="Quantitative" score={89} showTrend={false} />
                <SkillBar name="Business Judgment" score={64} showTrend={false} />
                <SkillBar name="Communication" score={73} showTrend={false} />
                <SkillBar name="Synthesis" score={61} showTrend={false} />
              </div>
            </div>
            {/* Right: Score ring */}
            <div className="flex items-center justify-center">
              <ScoreRing score={78} size={180} strokeWidth={10} />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight">How It Works</h2>
            <p className="text-muted-foreground mt-2">
              A systematic approach to consulting interview preparation.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border bg-card">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{step.label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 mt-[-20px]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold tracking-tight">Built for Consulting Prep</h2>
          <p className="text-muted-foreground mt-2">
            Every feature is designed around how consulting interviews actually work.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="border-border/60">
                <CardContent className="pt-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-xl bg-primary text-primary-foreground px-8 py-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Ready to start preparing?
          </h2>
          <p className="mt-2 text-primary-foreground/80 max-w-md mx-auto">
            Join candidates who are building measurable interview readiness with
            CasePilot.
          </p>
          <Link to="/auth">
            <Button
              variant="secondary"
              size="lg"
              className="mt-6 gap-2 bg-white text-primary hover:bg-white/90"
            >
              Start Practicing
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground font-bold text-[10px]">
              CP
            </div>
            <span className="text-xs text-muted-foreground">
              © 2026 CasePilot. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
