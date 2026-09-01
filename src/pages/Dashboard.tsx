import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { FadeIn, StaggerList, StaggerItem, AnimatedBar } from "@/components/app/AnimatedSection";
import { ArrowRight, BookOpen, CheckCircle2, Clock, Flame, Play, TrendingUp, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { userProfile, skillScores, readinessOverTime, todayTraining } from "@/data/mock-data";
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
  return Math.ceil((interview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const skillColor = (score: number) =>
  score >= 80 ? "bg-emerald-600" : score >= 65 ? "bg-accent" : "bg-amber-500";

export default function Dashboard() {
  const daysLeft = getDaysUntilInterview(userProfile.interviewDate);
  const weakestSkill = [...skillScores].sort((a, b) => a.score - b.score)[0];
  const scoreDiff = userProfile.readinessScore - userProfile.previousReadinessScore;

  return (
    <AppLayout>
      {/* ── HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-end justify-between mb-6 pb-5 border-b"
      >
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {getGreeting()}, {userProfile.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Interview in <span className="font-semibold text-foreground">{daysLeft} days</span>
          </p>
        </div>
        <Link to="/cases/case-1">
          <Button className="gap-2">
            Start Mock Interview <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </motion.div>

      {/* ── READINESS HERO — dark band, big number ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="bg-navy rounded-xl px-7 py-6 mb-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-white/40 uppercase tracking-widest font-medium">Interview Readiness</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl font-bold tracking-tight tabular-nums">
                {userProfile.readinessScore}
              </span>
              <span className="text-xl text-white/35">/ 100</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">+{scoreDiff} this month</span>
            </div>
          </div>
          {/* Mini ring */}
          <motion.svg
            width="80" height="80"
            className="-rotate-90 shrink-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 200 }}
          >
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <motion.circle
              cx="40" cy="40" r="34"
              fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="6" strokeLinecap="round"
              initial={{ strokeDasharray: "213.6", strokeDashoffset: 213.6 }}
              animate={{ strokeDashoffset: 213.6 * (1 - userProfile.readinessScore / 100) }}
              transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
            />
          </motion.svg>
        </div>
      </motion.div>

      {/* ── STATS STRIP — tight inline ── */}
      <FadeIn delay={0.2} className="flex items-center gap-8 mb-6 pb-5 border-b text-sm">
        {[
          { icon: Flame, value: userProfile.streak, label: "day streak", color: "text-amber-600" },
          { icon: BookOpen, value: userProfile.totalCasesCompleted, label: "cases done", color: "text-foreground" },
          { icon: Clock, value: `${userProfile.averageScore}%`, label: "avg score", color: "text-foreground" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              className="flex items-center gap-2"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.08 }}
            >
              <Icon className={cn("h-4 w-4", s.color)} />
              <span className="font-bold tabular-nums">{s.value}</span>
              <span className="text-muted-foreground">{s.label}</span>
            </motion.div>
          );
        })}
      </FadeIn>

      {/* ── MAIN CONTENT ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px] mb-6">
        {/* LEFT: Skills — dense rows */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">
            Skill Performance
          </p>
          <div className="rounded-xl border bg-card p-4">
            <StaggerList className="space-y-2.5">
              {skillScores.map((skill, i) => (
                <StaggerItem key={skill.name}>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-[13px] w-36 shrink-0",
                      skill.name === weakestSkill.name ? "font-semibold text-foreground" : "text-muted-foreground"
                    )}>
                      {skill.name}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <AnimatedBar
                        width={skill.score}
                        className={cn("h-full rounded-full", skillColor(skill.score))}
                        delay={0.2 + i * 0.07}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 w-16 justify-end">
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.07 }}
                        className="text-[13px] font-semibold tabular-nums"
                      >
                        {skill.score}
                      </motion.span>
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.45 + i * 0.07 }}
                        className="text-[10px] text-emerald-600 tabular-nums"
                      >
                        +{skill.score - skill.previousScore}
                      </motion.span>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>

            {/* Weakness callout */}
            <FadeIn delay={0.5} className="mt-4">
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200/80 rounded-lg px-3.5 py-2.5">
                <Target className="h-4 w-4 text-amber-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-amber-800">
                    Focus: {weakestSkill.name} ({weakestSkill.score}/100)
                  </p>
                  <p className="text-[11px] text-amber-600/80 mt-0.5">
                    Lowest skill — targeted drills can improve it fastest.
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>

        {/* RIGHT: Training + Recommended */}
        <div className="space-y-5">
          {/* Recommended next */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">
              Recommended Next
            </p>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.35 }}
              className="rounded-xl border bg-card p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0 mt-0.5">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">Business Judgment Drill</p>
                  <p className="text-xs text-muted-foreground mt-0.5">10 minutes</p>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Identify the most important business implications from limited information.
                  </p>
                  <Link to="/practice">
                    <Button className="mt-3" size="sm">
                      Start Drill <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Today's training */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">
              Today&apos;s Training
            </p>
            <div className="rounded-xl border bg-card overflow-hidden">
              <StaggerList>
                {todayTraining.map((item) => (
                  <StaggerItem key={item.id}>
                    <motion.div
                      whileHover={{ backgroundColor: "oklch(0.96 0.004 260 / 0.5)" }}
                      className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 cursor-pointer"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/20 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[13px] font-medium", item.completed && "text-muted-foreground line-through")}>
                          {item.title}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">{item.duration}m</span>
                      {!item.completed && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100">
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

      {/* ── CHART — full width ── */}
      <FadeIn delay={0.35}>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">
          Readiness Over Time
        </p>
        <div className="rounded-xl border bg-card p-5">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readinessOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.004 260)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.48 0.01 260)" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "oklch(0.48 0.01 260)" }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid oklch(0.905 0.004 260)", fontSize: "11px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                />
                <Line type="monotone" dataKey="score" stroke="oklch(0.48 0.14 245)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2 }} animationDuration={1200} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </FadeIn>
    </AppLayout>
  );
}
