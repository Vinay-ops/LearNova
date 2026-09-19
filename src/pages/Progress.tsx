import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TrendingUp, Flame, BookOpen, BarChart3, Mic } from "lucide-react";
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
import { useAuth } from "@/context/AuthContext";
import { progressApi, type ProgressSummary, type SkillScore } from "@/features/progress";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

const skillColor = (score: number) =>
  score >= 80 ? "bg-emerald-500" : score >= 65 ? "bg-primary" : "bg-amber-500";

const skillTextColor = (score: number) =>
  score >= 80 ? "text-emerald-600" : score >= 65 ? "text-primary" : "text-amber-600";

export default function Progress() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id || "";

  const skillScores: SkillScore[] = summary?.skill_scores?.map((s) => ({
    name: s.name,
    score: s.score,
    previous_score: s.previous_score ?? 0,
    trend: s.trend || "flat",
    color: s.color || "#1e3a5f",
  })) || [];

  const readinessScore = summary?.readiness_score ?? 0;
  const readinessOverTime = summary?.readiness_over_time ?? [];
  const completedCases = summary?.total_cases_completed ?? 0;
  const completedAssessments = summary?.total_assessments_completed ?? 0;
  const completedDrills = summary?.total_drills_completed ?? 0;
  const completedInterviews = summary?.total_interviews_completed ?? 0;
  const averageScore = summary?.average_score ? Math.round(summary.average_score) : 0;
  const averageInterviewScore = summary?.average_interview_score;
  const streak = summary?.streak_days ?? 0;

  const loadSummary = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await progressApi.getSummary(userId);
      setSummary(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load progress");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [userId]);

  const previousReadiness = summary?.previous_readiness_score ?? null;
  const readinessDelta =
    previousReadiness != null ? readinessScore - previousReadiness : null;

  const strongest = skillScores.length > 0
    ? [...skillScores].sort((a, b) => b.score - a.score)[0]
    : { name: "N/A", score: 0, previous_score: 0 };
  const weakest = skillScores.length > 0
    ? [...skillScores].sort((a, b) => a.score - b.score)[0]
    : { name: "N/A", score: 0, previous_score: 0 };
  // Most-improved only counts skills with a real previous measurement.
  const improvedSkills = skillScores.filter((s) => (s.previous_score ?? 0) > 0);
  const mostImproved = improvedSkills.length > 0
    ? [...improvedSkills].sort(
        (a, b) => (b.score - (b.previous_score ?? 0)) - (a.score - (a.previous_score ?? 0))
      )[0]
    : null;
  const fmtDelta = (delta: number) => `${delta > 0 ? "+" : ""}${delta}`;

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Track your interview preparation journey.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-muted-foreground shadow-xl shadow-slate-200/50">
          Loading progress...
        </div>
      ) : (
        <>
          {/* Readiness + Key insights */}
          <FadeIn delay={0.1} className="grid lg:grid-cols-[auto_1fr] gap-6 mb-8">
            {/* Big readiness number */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 flex flex-col justify-center min-w-[220px]">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                Interview Readiness
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-extrabold tracking-tight tabular-nums text-primary">
                  {readinessScore}
                </span>
                <span className="text-xl text-muted-foreground">/ 100</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                <span
                  className={`text-sm font-semibold ${
                    readinessDelta != null && readinessDelta >= 0
                      ? "text-emerald-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {readinessDelta != null
                    ? `${fmtDelta(readinessDelta)} vs last check`
                    : "Updated after each evaluation"}
                </span>
              </div>
            </div>

            {/* Key insights */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Strength", value: strongest.name, sub: `${strongest.score}/100`, color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200/60" },
                { label: "Focus Area", value: weakest.name, sub: `${weakest.score}/100`, color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-200/60" },
                { label: "Most Improved", value: mostImproved ? mostImproved.name : "—", sub: mostImproved ? fmtDelta(mostImproved.score - (mostImproved.previous_score ?? 0)) : "No prior data", color: "text-primary", bgColor: "bg-blue-50", borderColor: "border-blue-200/60" },
              ].map((item) => (
                <div key={item.label} className={`rounded-3xl border ${item.borderColor} ${item.bgColor} p-5 shadow-xl shadow-slate-200/30`}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    {item.label}
                  </p>
                  <p className="text-sm font-bold">{item.value}</p>
                  <p className={cn("text-base font-extrabold tabular-nums mt-1", item.color)}>
                    {item.sub}
                  </p>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Chart */}
          <FadeIn delay={0.2} className="mb-8">
            <p className="text-sm font-bold text-foreground mb-4">
              Performance Over Time
            </p>
            {readinessOverTime.length > 0 ? (
              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={readinessOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0edfb" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#7a7a8a" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fill: "#7a7a8a" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #e8e2dc",
                          fontSize: "12px",
                          boxShadow: "0 4px 12px rgba(108,92,231,0.08)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#2563EB"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 2, fill: "#2563EB" }}
                        animationDuration={1200}
                        animationEasing="ease-out"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 text-center">
                <p className="text-sm text-muted-foreground">
                  Your performance trend will appear here as you complete evaluations.
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Only real snapshots are shown — no estimated history.
                </p>
              </div>
            )}
          </FadeIn>

          {/* Skill Development */}
          <div className="mb-8">
            <p className="text-sm font-bold text-foreground mb-4">
              Skill Development
            </p>
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50">
              <StaggerList className="space-y-4">
                {skillScores.map((skill, i) => (
                  <StaggerItem key={skill.name}>
                    <div className="flex items-center gap-3">
                      <span className="text-sm w-44 text-muted-foreground shrink-0 font-medium">
                        {skill.name}
                      </span>
                      <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                        <AnimatedBar
                          width={skill.score}
                          className={cn("h-full rounded-full", skillColor(skill.score))}
                          delay={0.15 + i * 0.07}
                        />
                      </div>
                      <div className="flex items-center gap-2 w-20 justify-end">
                        <span className={cn("text-sm font-bold tabular-nums", skillTextColor(skill.score))}>
                          {skill.score}
                        </span>
                        {(skill.previous_score ?? 0) > 0 && (
                          <span className="text-[11px] text-emerald-600 font-semibold tabular-nums">
                            {fmtDelta(skill.score - (skill.previous_score ?? 0))}
                          </span>
                        )}
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerList>
            </div>
          </div>

          {/* Key Metrics */}
          <FadeIn delay={0.4}>
            <p className="text-sm font-bold text-foreground mb-4">Key Metrics</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: BookOpen, value: completedCases, label: "Cases completed", color: "bg-blue-100 text-blue-600" },
                { icon: Mic, value: completedInterviews, label: "Interviews completed", color: "bg-pink-100 text-pink-600" },
                { icon: BarChart3, value: `${averageScore}%`, label: "Average case score", color: "bg-blue-100 text-blue-600" },
                { icon: BarChart3, value: averageInterviewScore != null ? `${averageInterviewScore}%` : "—", label: "Average interview score", color: "bg-violet-100 text-violet-600" },
                { icon: BookOpen, value: completedDrills, label: "Drills completed", color: "bg-teal-100 text-teal-600" },
                { icon: Flame, value: `${streak}`, label: "Day streak", color: "bg-amber-100 text-amber-600" },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <motion.div
                    key={m.label}
                    whileHover={{ y: -2, scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 hover:shadow-md transition-all"
                  >
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${m.color} mb-3`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{m.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </FadeIn>

          {/* Practice Weakest + View History Links */}
          <FadeIn delay={0.5} className="mt-8">
            <div className="grid grid-cols-3 gap-4">
              <Link to="/practice">
                <motion.div whileHover={{ y: -2 }} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/50 hover:shadow-md transition-all h-full">
                  <p className="text-sm font-bold text-slate-900">Practice Weakest Skill</p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Focus on {weakest.name} ({weakest.score}/100)</p>
                </motion.div>
              </Link>
              <Link to="/practice">
                <motion.div whileHover={{ y: -2 }} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/50 hover:shadow-md transition-all h-full">
                  <p className="text-sm font-bold text-slate-900">View Case History</p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{completedCases} cases completed</p>
                </motion.div>
              </Link>
              <Link to="/assessments">
                <motion.div whileHover={{ y: -2 }} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/50 hover:shadow-md transition-all h-full">
                  <p className="text-sm font-bold text-slate-900">View Assessment History</p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{completedAssessments} assessments taken</p>
                </motion.div>
              </Link>
            </div>
          </FadeIn>
        </>
      )}
    </AppLayout>
  );
}
