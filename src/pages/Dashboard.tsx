import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn, StaggerList, StaggerItem, AnimatedBar } from "@/components/app/AnimatedSection";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
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
import { useAuth } from "@/context/AuthContext";
import { useProgress } from "@/hooks/use-progress";
import { useCaseAttempts, useCases } from "@/hooks/use-cases";
import { useDrills } from "@/hooks/use-drills";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getDaysUntilInterview(dateStr: string | null) {
  if (!dateStr) return null;
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
  const { user, profile } = useAuth();
  const userId = user?.id || "";
  const { summary } = useProgress(userId || undefined);
  const { attempts: caseAttempts } = useCaseAttempts(userId || undefined);
  const { cases } = useCases();
  const { drills } = useDrills();

  const skillScores = summary?.skill_scores || [];
  const readinessScore = summary?.readiness_score ?? 0;
  const readinessOverTime = summary?.readiness_over_time || [];
  const completedCases = summary?.total_cases_completed ?? 0;
  const completedAssessments = summary?.total_assessments_completed ?? 0;
  const completedDrills = summary?.total_drills_completed ?? 0;
  const averageScore = summary?.average_score ?? 0;
  const streak = summary?.streak_days ?? 0;
  const daysLeft = getDaysUntilInterview(profile?.interviewDate || null);
  const displayName = profile?.name?.split(" ")[0] || user?.name?.split(" ")[0] || "User";
  const weakestSkill = skillScores.length > 0
    ? [...skillScores].sort((a, b) => a.score - b.score)[0]
    : { name: "Structuring", score: 50 };
  const previousReadiness = readinessScore > 12 ? readinessScore - 12 : readinessScore;
  const scoreDiff = readinessScore - previousReadiness;

  // Recent case attempts for activity
  const recentAttempts = caseAttempts
    .filter((a) => a.status === "completed")
    .slice(-3)
    .reverse();

  // Recommended drill (null until practice content exists, e.g. fresh DB)
  const recommendedDrill = drills.find((d) =>
    d.skills.includes(weakestSkill.name)
  ) || drills[0] || null;

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
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {getGreeting()}, <span className="text-purple-600">{displayName}</span> 👋
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-semibold">
            {daysLeft != null && daysLeft > 0 ? (
              <>
                Your interview is in{" "}
                <span className="font-extrabold text-slate-900">{daysLeft} days</span>.
                Keep up the momentum! 💪
              </>
            ) : (
              <>Keep practicing to improve your readiness! 💪</>
            )}
          </p>
        </div>
        <Link to="/practice">
          <Button className="gap-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-full px-6 py-5 shadow-lg shadow-purple-200">
            <Target className="h-4 w-4" />
            Start Practice
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </motion.div>

      {/* Stat cards */}
      <FadeIn delay={0.1} className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          {
            icon: Target,
            value: readinessScore,
            suffix: "/100",
            label: "Interview Readiness",
            color: "bg-purple-100 text-purple-600",
            trend: `+${scoreDiff} this month`,
            trendColor: "text-emerald-600",
          },
          {
            icon: Flame,
            value: streak,
            suffix: " days",
            label: "Day Streak",
            color: "bg-amber-100 text-amber-600",
            trend: "Keep it going!",
            trendColor: "text-amber-600",
          },
          {
            icon: BookOpen,
            value: completedCases,
            suffix: "",
            label: "Cases Done",
            color: "bg-blue-100 text-blue-600",
            trend: `${completedCases} total`,
            trendColor: "text-blue-600",
          },
          {
            icon: Trophy,
            value: `${averageScore}`,
            suffix: "%",
            label: "Avg Score",
            color: "bg-emerald-100 text-emerald-600",
            trend: "Solid progress",
            trendColor: "text-emerald-600",
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
              whileHover={{ y: -3 }}
              className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50"
            >
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${stat.color} mb-4 shadow-sm`}>
                <Icon className="h-6 w-6" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {stat.value}<span className="text-base font-semibold text-slate-400">{stat.suffix}</span>
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-1">{stat.label}</p>
              <p className={`text-xs font-extrabold mt-2 ${stat.trendColor}`}>{stat.trend}</p>
            </motion.div>
          );
        })}
      </FadeIn>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-5 mb-8">
        {/* Skills */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <p className="text-base font-extrabold text-slate-900">Skill Performance</p>
            <Link to="/progress">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-full">
                View Details <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50">
            <StaggerList className="space-y-4">
              {skillScores.map((skill, i) => (
                <StaggerItem key={skill.name}>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-sm w-40 shrink-0 font-semibold",
                      skill.name === weakestSkill.name
                        ? "font-extrabold text-slate-900"
                        : "text-slate-600"
                    )}>
                      {skill.name}
                    </span>
                    <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
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
                        className={cn("text-sm font-extrabold tabular-nums", skillTextColor(skill.score))}
                      >
                        {skill.score}
                      </motion.span>
                      {(skill.previous_score ?? 0) > 0 && (
                        <motion.span
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.08 }}
                          className="text-[11px] text-emerald-600 font-bold tabular-nums"
                        >
                          +{skill.score - (skill.previous_score ?? 0)}
                        </motion.span>
                      )}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>

            {/* Weakness callout */}
            <FadeIn delay={0.6} className="mt-6">
              <div className="rounded-2xl bg-amber-50 border border-amber-200/60 p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-600 shadow-sm">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-amber-900">
                    Focus: {weakestSkill.name}
                  </p>
                  <p className="text-xs text-amber-700 font-medium mt-0.5">
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
            <p className="text-base font-extrabold text-slate-900 mb-4">Recommended Next</p>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              whileHover={{ y: -2 }}
              className="rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-purple-50/30 p-6 shadow-xl shadow-slate-200/50"
            >
              {recommendedDrill ? (
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shrink-0 shadow-sm">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge className="bg-amber-400 text-amber-950 border-0 rounded-full text-[10px] font-extrabold mb-2 px-3 py-0.5">
                      {recommendedDrill.duration_minutes || recommendedDrill.duration} min drill
                    </Badge>
                    <p className="font-extrabold text-slate-900 text-base">{recommendedDrill.title}</p>
                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                      {recommendedDrill.description}
                    </p>
                    <Link to="/practice">
                      <Button className="mt-4 gap-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-full px-5 py-2 text-xs shadow-md shadow-purple-200" size="sm">
                        Start Drill
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shrink-0 shadow-sm">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-slate-900 text-base">
                      Pick a practice track to get started
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                      Once you take assessments and drills, we'll recommend the best next step here.
                    </p>
                    <Link to="/practice">
                      <Button className="mt-4 gap-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-full px-5 py-2 text-xs shadow-md shadow-purple-200" size="sm">
                        Browse Practice
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Recent Activity / Today's training */}
          <div>
            <p className="text-base font-extrabold text-slate-900 mb-4">Recent Activity</p>
            <div className="rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 overflow-hidden p-2">
              {recentAttempts.length > 0 ? (
                <StaggerList>
                  {recentAttempts.map((attempt) => {
                    const caseData = cases.find((c) => c.id === attempt.case_id);
                    return (
                      <StaggerItem key={attempt.id}>
                        <motion.div
                          whileHover={{ x: 3, backgroundColor: "rgb(248 245 242)" }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer"
                        >
                          <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800">
                              {caseData?.title || "Case"}
                            </p>
                          </div>
                          <span className={cn(
                            "text-sm font-bold tabular-nums shrink-0",
                            (attempt.overall_score || 0) >= 70 ? "text-emerald-600" : "text-amber-600"
                          )}>
                            {attempt.overall_score}
                          </span>
                        </motion.div>
                      </StaggerItem>
                    );
                  })}
                </StaggerList>
              ) : (
                <div className="py-8 text-center text-sm text-slate-400">
                  No activity yet. Start your first case!
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <p className="text-base font-extrabold text-slate-900 mb-4">Quick Actions</p>
            <div className="space-y-2">
              {[
                { to: "/practice", label: "Start Case", icon: BookOpen, color: "bg-purple-100 text-purple-600" },
                { to: "/assessments", label: "Take Assessment", icon: Target, color: "bg-blue-100 text-blue-600" },
                { to: "/progress", label: "View Progress", icon: TrendingUp, color: "bg-emerald-100 text-emerald-600" },
                { to: "/applications", label: "View Applications", icon: BookOpen, color: "bg-amber-100 text-amber-600" },
              ].map((action) => (
                <Link key={action.to} to={action.to}>
                  <motion.div
                    whileHover={{ x: 3 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${action.color}`}>
                      <action.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{action.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 ml-auto" />
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Readiness chart */}
      <FadeIn delay={0.4}>
        <p className="text-base font-extrabold text-slate-900 mb-4">
          Readiness Over Time
        </p>
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readinessOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3ede8" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    fontSize: "12px",
                    boxShadow: "0 10px 25px -5px rgba(108,92,231,0.15)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#6c5ce7"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 2, fill: "#6c5ce7" }}
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
