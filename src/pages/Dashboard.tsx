import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn, StaggerList, StaggerItem, AnimatedBar } from "@/components/app/AnimatedSection";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  Play,
  TrendingUp,
  Target,
  Trophy,
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
  userProfile,
  skillScores,
  readinessOverTime,
  todayTraining,
} from "@/data/mock-data";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
  score >= 80 ? "bg-emerald-500" : score >= 65 ? "bg-primary" : "bg-amber-500";

const skillTextColor = (score: number) =>
  score >= 80 ? "text-emerald-600" : score >= 65 ? "text-primary" : "text-amber-600";

export default function Dashboard() {
  const daysLeft = getDaysUntilInterview(userProfile.interviewDate);
  const weakestSkill = [...skillScores].sort((a, b) => a.score - b.score)[0];
  const scoreDiff = userProfile.readinessScore - userProfile.previousReadinessScore;

  return (
    <AppLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex items-start justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {getGreeting()}, <span className="text-primary">{userProfile.name}</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Your interview is in{" "}
            <span className="font-bold text-foreground">{daysLeft} days</span>.
            Keep up the momentum! 💪
          </p>
        </div>
        <Link to="/cases/case-1">
          <Button className="gap-2 rounded-xl">
            <Target className="h-4 w-4" />
            Start Mock Interview
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </motion.div>

      {/* Stat cards row */}
      <FadeIn delay={0.1} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            icon: Target,
            value: userProfile.readinessScore,
            suffix: "/100",
            label: "Interview Readiness",
            color: "bg-primary/10 text-primary",
            trend: `+${scoreDiff} this month`,
            trendColor: "text-emerald-600",
          },
          {
            icon: Flame,
            value: userProfile.streak,
            suffix: "",
            label: "Day Streak",
            color: "bg-orange/10 text-orange",
            trend: "Keep it going!",
            trendColor: "text-orange",
          },
          {
            icon: BookOpen,
            value: userProfile.totalCasesCompleted,
            suffix: "",
            label: "Cases Done",
            color: "bg-purple/10 text-purple",
            trend: "24 total",
            trendColor: "text-purple",
          },
          {
            icon: Trophy,
            value: `${userProfile.averageScore}`,
            suffix: "%",
            label: "Avg Score",
            color: "bg-teal/10 text-teal",
            trend: "Solid progress",
            trendColor: "text-teal",
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
              whileHover={{ y: -2, scale: 1.01 }}
              className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${stat.color} mb-3`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold tabular-nums">
                {stat.value}<span className="text-base font-normal text-muted-foreground">{stat.suffix}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              <p className={`text-[11px] font-semibold mt-1.5 ${stat.trendColor}`}>{stat.trend}</p>
            </motion.div>
          );
        })}
      </FadeIn>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-5 mb-8">
        {/* Skills */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Skill Performance
            </p>
            <Link to="/progress">
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">
                View Details <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
            <StaggerList className="space-y-3.5">
              {skillScores.map((skill, i) => (
                <StaggerItem key={skill.name}>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-sm w-40 shrink-0",
                      skill.name === weakestSkill.name
                        ? "font-bold text-foreground"
                        : "text-muted-foreground"
                    )}>
                      {skill.name}
                    </span>
                    <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                      <AnimatedBar
                        width={skill.score}
                        className={cn("h-full rounded-full", skillColor(skill.score))}
                        delay={0.2 + i * 0.08}
                      />
                    </div>
                    <div className="flex items-center gap-2 w-20 justify-end">
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                        className={cn("text-sm font-bold tabular-nums", skillTextColor(skill.score))}
                      >
                        {skill.score}
                      </motion.span>
                      {skill.previousScore && (
                        <motion.span
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.08 }}
                          className="text-[11px] text-emerald-600 font-semibold tabular-nums"
                        >
                          +{skill.score - skill.previousScore}
                        </motion.span>
                      )}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>

            {/* Weakness callout */}
            <FadeIn delay={0.6} className="mt-5">
              <div className="rounded-xl bg-amber-50 border border-amber-200/60 px-4 py-3 flex items-start gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Target className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    Focus: {weakestSkill.name}
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    This is your lowest skill ({weakestSkill.score}/100). Targeted drills can improve it fastest.
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Recommended next */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
              Recommended Next
            </p>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/[0.02] p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange/10 text-orange shrink-0">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <Badge className="bg-orange/10 text-orange border-0 rounded-full text-[10px] font-semibold mb-2">
                    10 min drill
                  </Badge>
                  <p className="font-bold text-sm">Business Judgment Drill</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Practice identifying the most important business implications
                    from limited information.
                  </p>
                  <Link to="/practice">
                    <Button className="mt-3 gap-1.5 rounded-xl" size="sm">
                      Start Drill
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Today's training */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
              Today&apos;s Training
            </p>
            <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
              <StaggerList>
                {todayTraining.map((item) => (
                  <StaggerItem key={item.id}>
                    <motion.div
                      whileHover={{ x: 2, backgroundColor: "oklch(0.97 0.006 80 / 0.5)" }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="flex items-center gap-3 px-4 py-3 border-b border-border/30 last:border-0 cursor-pointer"
                    >
                      {item.completed ? (
                        <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/20 shrink-0" />
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
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-primary">
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerList>
            </div>
          </div>
        </div>
      </div>

      {/* Readiness chart */}
      <FadeIn delay={0.4}>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
          Readiness Over Time
        </p>
        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readinessOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.006 80)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "oklch(0.50 0.01 260)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "oklch(0.50 0.01 260)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid oklch(0.92 0.006 80)",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="oklch(0.55 0.20 30)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, fill: "oklch(0.55 0.20 30)" }}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </FadeIn>
    </AppLayout>
  );
}
