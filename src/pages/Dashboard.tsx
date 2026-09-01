import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  Play,
  TrendingUp,
  Target,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  userProfile,
  skillScores,
  readinessOverTime,
  todayTraining,
} from "@/data/mock-data";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getDaysUntilInterview(dateStr: string) {
  const interview = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((interview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

const skillColor = (score: number) =>
  score >= 80 ? "bg-emerald-600" : score >= 65 ? "bg-accent" : "bg-amber-500";

export default function Dashboard() {
  const daysLeft = getDaysUntilInterview(userProfile.interviewDate);
  const weakestSkill = [...skillScores].sort((a, b) => a.score - b.score)[0];
  const scoreDiff = userProfile.readinessScore - userProfile.previousReadinessScore;

  return (
    <AppLayout>
      {/* Header — readiness is inline, not in a card */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {getGreeting()}, {userProfile.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Interview in{" "}
            <span className="font-semibold text-foreground">{daysLeft} days</span>.
          </p>
        </div>
        <Link to="/cases/case-1">
          <Button className="gap-2">
            <Target className="h-4 w-4" />
            Start Mock Interview
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* Readiness hero — not in a card, just big text */}
      <div className="flex items-center gap-8 mb-8 pb-8 border-b">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
            Interview Readiness
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tight tabular-nums">
              {userProfile.readinessScore}
            </span>
            <span className="text-xl text-muted-foreground">/ 100</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-sm text-emerald-600 font-medium">
              +{scoreDiff} points this month
            </span>
          </div>
        </div>
        {/* Mini ring */}
        <svg width="100" height="100" className="-rotate-90 shrink-0">
          <circle cx="50" cy="50" r="42" fill="none" stroke="oklch(0.92 0.004 260)" strokeWidth="7" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="oklch(0.48 0.14 245)"
            strokeWidth="7"
            strokeDasharray="263.9"
            strokeDashoffset={263.9 * (1 - userProfile.readinessScore / 100)}
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Stats strip — inline, no cards */}
      <div className="flex items-center gap-10 mb-8 pb-8 border-b">
        {[
          { icon: Flame, value: userProfile.streak, label: "day streak" },
          { icon: BookOpen, value: userProfile.totalCasesCompleted, label: "cases done" },
          { icon: Clock, value: `${userProfile.averageScore}%`, label: "avg score" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-2.5">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-bold tabular-nums">{s.value}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Main content: skills left, training right */}
      <div className="grid gap-8 lg:grid-cols-5 mb-8">
        {/* Skills — dense data rows, not cards */}
        <div className="lg:col-span-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
            Skill Performance
          </p>
          <div className="space-y-3">
            {skillScores.map((skill) => (
              <div key={skill.name} className="flex items-center gap-3">
                <span className={cn(
                  "text-sm w-40 shrink-0",
                  skill.name === weakestSkill.name
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                )}>
                  {skill.name}
                </span>
                <div className="flex-1 h-2 rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", skillColor(skill.score))}
                    style={{ width: `${skill.score}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 w-20 justify-end">
                  <span className="text-sm font-semibold tabular-nums">{skill.score}</span>
                  {skill.previousScore && (
                    <span className="text-[11px] text-emerald-600 tabular-nums">
                      +{skill.score - skill.previousScore}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Weakness callout */}
          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2.5">
            <Target className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Focus: {weakestSkill.name} ({weakestSkill.score}/100)
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                This is your lowest skill. Targeted drills can improve it fastest.
              </p>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recommended next */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
              Recommended Next
            </p>
            <div className="rounded-lg border bg-primary/[0.03] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 shrink-0 mt-0.5">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Business Judgment Drill</p>
                  <p className="text-xs text-muted-foreground mt-0.5">10 minutes</p>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Practice identifying the most important business implications from limited information.
                  </p>
                  <Link to="/practice">
                    <Button className="mt-3 gap-1.5" size="sm">
                      Start Drill
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Today's training — checklist, not cards */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
              Today&apos;s Training
            </p>
            <div className="space-y-1">
              {todayTraining.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors"
                >
                  {item.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/20 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium",
                      item.completed && "text-muted-foreground line-through"
                    )}>
                      {item.title}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                    {item.duration} min
                  </span>
                  {!item.completed && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Readiness chart — full width */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
          Readiness Over Time
        </p>
        <div className="rounded-xl border bg-card p-6">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readinessOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.004 260)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "oklch(0.48 0.01 260)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "oklch(0.48 0.01 260)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid oklch(0.905 0.004 260)",
                    fontSize: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="oklch(0.48 0.14 245)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
