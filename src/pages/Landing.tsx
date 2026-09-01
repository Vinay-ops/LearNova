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
  Play,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router";

const steps = [
  { label: "Assess", desc: "Find your baseline" },
  { label: "Diagnose", desc: "Identify weaknesses" },
  { label: "Practice", desc: "Targeted drills" },
  { label: "Simulate", desc: "Real interviews" },
  { label: "Improve", desc: "Measure progress" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary font-bold text-[11px] text-primary-foreground tracking-tight">
              CP
            </div>
            <span className="font-bold text-sm tracking-tight">CasePilot</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="gap-1.5">
                Get Started
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-accent mb-4 tracking-wide uppercase">
              Consulting interview prep
            </p>
            <h1 className="text-4xl font-bold tracking-tight lg:text-[3.25rem] leading-[1.08] text-balance">
              Train for the consulting interview you actually want.
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-lg">
              Practice realistic cases, identify your weaknesses, and build
              measurable interview readiness — before the real interview.
            </p>
            <div className="flex items-center gap-3 mt-7">
              <Link to="/auth">
                <Button size="lg" className="gap-2 px-6">
                  Start Practicing
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="ghost" size="lg" className="gap-2 text-muted-foreground">
                  <Play className="h-4 w-4" />
                  See How It Works
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Product Preview — not in a card, shown as real interface */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-xl border bg-card overflow-hidden shadow-lg">
            {/* Fake app toolbar */}
            <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              </div>
              <div className="ml-4 flex-1 rounded-md bg-background border h-7 px-3 flex items-center">
                <span className="text-[11px] text-muted-foreground">casepilot.app/dashboard</span>
              </div>
            </div>
            {/* Dashboard preview content */}
            <div className="p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs text-muted-foreground">Good evening, Alex</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Your interview is in <span className="font-semibold text-foreground">12 days</span>.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Readiness</p>
                    <p className="text-2xl font-bold tabular-nums leading-none mt-1">78<span className="text-sm font-normal text-muted-foreground">/100</span></p>
                  </div>
                  {/* Mini ring */}
                  <svg width="52" height="52" className="-rotate-90">
                    <circle cx="26" cy="26" r="22" fill="none" stroke="oklch(0.92 0.004 260)" strokeWidth="4" />
                    <circle cx="26" cy="26" r="22" fill="none" stroke="oklch(0.48 0.14 245)" strokeWidth="4" strokeDasharray="138.2" strokeDashoffset="30.4" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              {/* Skill rows — not cards, just data rows */}
              <div className="grid gap-x-12 gap-y-2.5 lg:grid-cols-2">
                {[
                  { name: "Structuring", score: 82, color: "bg-emerald-600" },
                  { name: "Quantitative", score: 89, color: "bg-emerald-600" },
                  { name: "Business Judgment", score: 64, color: "bg-amber-500" },
                  { name: "Communication", score: 73, color: "bg-accent" },
                  { name: "Synthesis", score: 61, color: "bg-amber-500" },
                  { name: "Mental Math", score: 76, color: "bg-accent" },
                ].map((s) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <span className="text-[13px] w-36 text-muted-foreground shrink-0">{s.name}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted">
                      <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.score}%` }} />
                    </div>
                    <span className="text-[13px] font-semibold tabular-nums w-8 text-right">{s.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-3">Process</p>
          <h2 className="text-2xl font-bold tracking-tight mb-10">
            A systematic approach to interview readiness.
          </h2>
          <div className="grid gap-8 lg:grid-cols-5">
            {steps.map((step, i) => (
              <div key={step.label} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-5 left-full w-full h-px bg-border" />
                )}
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                    {i + 1}
                  </span>
                  {i < steps.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 lg:hidden" />
                  )}
                </div>
                <p className="font-semibold text-sm">{step.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features — no cards, just a two-column layout with real content */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-16 lg:grid-cols-2">
            {/* Left: feature list */}
            <div className="space-y-8">
              <div>
                <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-3">Features</p>
                <h2 className="text-2xl font-bold tracking-tight">
                  Everything you need. Nothing you don&apos;t.
                </h2>
              </div>
              {[
                {
                  icon: BookOpen,
                  title: "AI Case Simulator",
                  text: "Practice realistic consulting cases with an AI interviewer that probes, challenges, and adapts. Not a chatbot — a simulated interview.",
                },
                {
                  icon: Target,
                  title: "Targeted Skill Drills",
                  text: "Isolate your weakest skills with focused drills: structuring, mental math, synthesis, business judgment. Each drill is 10 minutes.",
                },
                {
                  icon: BarChart3,
                  title: "Performance Tracking",
                  text: "See exactly where you stand and where you need to improve. Every session contributes to your readiness score with clear skill-level data.",
                },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="flex gap-4">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{f.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-1">{f.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Right: readiness preview */}
            <div className="flex flex-col justify-center">
              <div className="rounded-xl border bg-muted/30 p-6">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Interview Readiness</p>
                <div className="flex items-baseline gap-1.5 mb-4">
                  <span className="text-4xl font-bold tracking-tight tabular-nums">78</span>
                  <span className="text-base text-muted-foreground">/ 100</span>
                </div>
                <div className="space-y-2">
                  {[
                    { name: "Structuring", score: 82 },
                    { name: "Quantitative", score: 89 },
                    { name: "Business Judgment", score: 64 },
                    { name: "Communication", score: 73 },
                    { name: "Synthesis", score: 61 },
                  ].map((s) => (
                    <div key={s.name} className="flex items-center gap-3">
                      <span className="text-xs w-32 text-muted-foreground shrink-0">{s.name}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-border">
                        <div
                          className={`h-full rounded-full ${s.score >= 80 ? "bg-emerald-600" : s.score >= 65 ? "bg-accent" : "bg-amber-500"}`}
                          style={{ width: `${s.score}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold tabular-nums w-6 text-right">{s.score}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-xs text-emerald-600 font-medium">+12 this month</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof — stats strip, not cards */}
      <section className="border-b bg-muted/20">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: "2,400+", label: "Cases completed" },
              { value: "74%", label: "Avg readiness gain" },
              { value: "18 min", label: "Avg session time" },
              { value: "4.8", label: "User rating" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold tracking-tight tabular-nums">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Ready to prepare like a candidate, not a student?
          </h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">
            Start with a diagnostic case to find your baseline, then follow a
            targeted training plan until interview day.
          </p>
          <Link to="/auth">
            <Button size="lg" className="mt-6 gap-2 px-8">
              Start Practicing
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary text-primary-foreground font-bold text-[8px]">
              CP
            </div>
            <span className="text-xs text-muted-foreground">
              © 2026 CasePilot
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
