import { AppLayout } from "@/components/layout/AppLayout";
import { ScoreRing } from "@/components/app/ScoreRing";
import { SkillBar } from "@/components/app/SkillBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  Flame,
  BookOpen,
  Clock,
  BarChart3,
  Target,
  Award,
  Zap,
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
  skillScores,
  readinessOverTime,
  userProfile,
} from "@/data/mock-data";
import { cn } from "@/lib/utils";

const monthlyPerformance = [
  { month: "Apr", cases: 3, avgScore: 52 },
  { month: "May", cases: 5, avgScore: 58 },
  { month: "Jun", cases: 8, avgScore: 64 },
  { month: "Jul", cases: 12, avgScore: 70 },
  { month: "Aug", cases: 24, avgScore: 74 },
];

export default function Progress() {
  const strongest = [...skillScores].sort((a, b) => b.score - a.score)[0];
  const weakest = [...skillScores].sort((a, b) => a.score - b.score)[0];
  const mostImproved = [...skillScores].sort(
    (a, b) => b.score - b.previousScore - (a.score - a.previousScore)
  )[0];

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
        <p className="text-muted-foreground mt-1">
          Track your interview preparation journey.
        </p>
      </div>

      {/* Top row: Readiness + Key insights */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Interview Readiness
            </p>
            <ScoreRing score={userProfile.readinessScore} size={140} strokeWidth={9} />
            <div className="flex items-center gap-1 mt-3">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-sm text-emerald-600 font-medium">
                +{userProfile.readinessScore - userProfile.previousReadinessScore} this month
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-3">
          <Card className="border-emerald-200 bg-emerald-500/[0.03]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Strength
                </span>
              </div>
              <p className="font-semibold">{strongest.name}</p>
              <p className="text-sm text-muted-foreground tabular-nums">{strongest.score}/100</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-500/[0.03]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                  Focus Area
                </span>
              </div>
              <p className="font-semibold">{weakest.name}</p>
              <p className="text-sm text-muted-foreground tabular-nums">{weakest.score}/100</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-primary/[0.03]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Most Improved
                </span>
              </div>
              <p className="font-semibold">{mostImproved.name}</p>
              <p className="text-sm text-emerald-600 font-medium tabular-nums">
                +{mostImproved.score - mostImproved.previousScore}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Over Time */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Performance Over Time</CardTitle>
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

      {/* Skill Development */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Skill Development</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {skillScores.map((skill) => (
            <SkillBar
              key={skill.name}
              name={skill.name}
              score={skill.score}
              previousScore={skill.previousScore}
            />
          ))}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {userProfile.totalCasesCompleted}
                </p>
                <p className="text-xs text-muted-foreground">Cases completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {userProfile.averageScore}%
                </p>
                <p className="text-xs text-muted-foreground">Average score</p>
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
                <p className="text-2xl font-bold tabular-nums">
                  {userProfile.averageCaseTime}
                  <span className="text-sm font-normal text-muted-foreground">m</span>
                </p>
                <p className="text-xs text-muted-foreground">Avg case time</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Flame className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{userProfile.streak}</p>
                <p className="text-xs text-muted-foreground">Practice streak (days)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
