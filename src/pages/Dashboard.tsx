import { AppLayout } from "@/components/layout/AppLayout";
import { ScoreRing } from "@/components/app/ScoreRing";
import { SkillBar } from "@/components/app/SkillBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Play,
  TrendingUp,
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

export default function Dashboard() {
  const daysLeft = getDaysUntilInterview(userProfile.interviewDate);
  const weakestSkill = [...skillScores].sort((a, b) => a.score - b.score)[0];

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          {getGreeting()}, {userProfile.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Your interview is in{" "}
          <span className="font-medium text-foreground">{daysLeft} days</span>.{" "}
          Let&apos;s keep improving.
        </p>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Interview Readiness - left 2 cols */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Interview Readiness
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight tabular-nums">
                    {userProfile.readinessScore}
                  </span>
                  <span className="text-lg text-muted-foreground">/ 100</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-sm text-emerald-600 font-medium">
                    +{userProfile.readinessScore - userProfile.previousReadinessScore} points this
                    month
                  </span>
                </div>
              </div>
              <ScoreRing score={userProfile.readinessScore} size={120} strokeWidth={8} />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats - right col */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Flame className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{userProfile.streak}</p>
                  <p className="text-xs text-muted-foreground">Day streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{userProfile.totalCasesCompleted}</p>
                  <p className="text-xs text-muted-foreground">Cases completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{userProfile.averageScore}<span className="text-sm font-normal text-muted-foreground">%</span></p>
                  <p className="text-xs text-muted-foreground">Avg score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Skill Performance + Recommended Next */}
      <div className="grid gap-6 mt-6 lg:grid-cols-5">
        {/* Skills */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Skill Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {skillScores.map((skill) => (
              <SkillBar
                key={skill.name}
                name={skill.name}
                score={skill.score}
                previousScore={skill.previousScore}
                highlight={skill.name === weakestSkill.name}
              />
            ))}
          </CardContent>
        </Card>

        {/* Recommended Next + Today */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Recommended Next */}
          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardHeader>
              <CardTitle className="text-base">Recommended Next</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Business Judgment Drill</p>
                    <p className="text-xs text-muted-foreground mt-0.5">10 minutes</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      &ldquo;Practice identifying the most important business implications from limited information.&rdquo;
                    </p>
                  </div>
                </div>
                <Link to="/practice">
                  <Button className="w-full" size="sm">
                    Start Drill
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Today's Training */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today&apos;s Training</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayTraining.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    {item.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <div>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          item.completed && "text-muted-foreground line-through"
                        )}
                      >
                        {item.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{item.duration} min</p>
                    </div>
                  </div>
                  {!item.completed && (
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Readiness Over Time */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Readiness Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readinessOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 250)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "oklch(0.5 0.01 250)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: "oklch(0.5 0.01 250)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid oklch(0.9 0.005 250)",
                    fontSize: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="oklch(0.55 0.15 240)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}

function Target({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
