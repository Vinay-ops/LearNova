import { AppLayout } from "@/components/layout/AppLayout";
import { TrendingUp, Flame, BookOpen, Clock, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { FadeIn, StaggerList, StaggerItem, AnimatedBar } from "@/components/app/AnimatedSection";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { skillScores, readinessOverTime, userProfile } from "@/data/mock-data";
import { cn } from "@/lib/utils";

const skillColor = (score: number) =>
  score >= 80 ? "bg-emerald-600" : score >= 65 ? "bg-accent" : "bg-amber-500";

export default function Progress() {
  const strongest = [...skillScores].sort((a, b) => b.score - a.score)[0];
  const weakest = [...skillScores].sort((a, b) => a.score - b.score)[0];
  const mostImproved = [...skillScores].sort(
    (a, b) => b.score - b.previousScore - (a.score - a.previousScore)
  )[0];

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
        <p className="text-muted-foreground mt-1">
          Track your interview preparation journey.
        </p>
      </div>

      {/* Readiness + Key insights */}
      <FadeIn delay={0.1} className="flex items-start gap-10 mb-8 pb-8 border-b">
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
              +{userProfile.readinessScore - userProfile.previousReadinessScore} this month
            </span>
          </div>
        </div>
        {/* Key insights */}
        <div className="flex gap-8">
          {[
            { label: "Strength", value: strongest.name, sub: `${strongest.score}/100`, color: "text-emerald-600" },
            { label: "Focus Area", value: weakest.name, sub: `${weakest.score}/100`, color: "text-amber-600" },
            { label: "Most Improved", value: mostImproved.name, sub: `+${mostImproved.score - mostImproved.previousScore}`, color: "text-accent" },
          ].map((item) => (
            <div key={item.label} className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                {item.label}
              </p>
              <p className="text-sm font-semibold">{item.value}</p>
              <p className={cn("text-xs font-medium tabular-nums", item.color)}>
                {item.sub}
              </p>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* Chart */}
      <FadeIn delay={0.2} className="mb-8">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
          Performance Over Time
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
      </FadeIn>

      {/* Skill Development — dense rows */}
      <div className="mb-8">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
          Skill Development
        </p>
        <div className="rounded-xl border bg-card p-5">
          <StaggerList className="space-y-3">
            {skillScores.map((skill) => (
              <StaggerItem key={skill.name}>
                <div className="flex items-center gap-3">
                <span className="text-sm w-40 text-muted-foreground shrink-0">
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
                  <span className="text-[11px] text-emerald-600 tabular-nums">
                    +{skill.score - skill.previousScore}
                  </span>
                </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </div>
      </div>

      {/* Key Metrics */}
      <FadeIn delay={0.4}>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
          Key Metrics
        </p>
        <div className="rounded-xl border bg-card">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border">
            {[
              { icon: BookOpen, value: userProfile.totalCasesCompleted, label: "Cases completed" },
              { icon: BarChart3, value: `${userProfile.averageScore}%`, label: "Average score" },
              { icon: Clock, value: `${userProfile.averageCaseTime}m`, label: "Avg case time" },
              { icon: Flame, value: `${userProfile.streak}`, label: "Day streak" },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      {m.label}
                    </span>
                  </div>
                  <p className="text-xl font-bold tabular-nums">{m.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </FadeIn>
    </AppLayout>
  );
}
