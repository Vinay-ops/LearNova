import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  BookOpen,
  Target,
  BarChart3,
  Brain,
  TrendingUp,
  Play,
  ChevronRight,
  Clock,
  Users,
  CheckCircle2,
  Zap,
  Star,
  Trophy,
  Briefcase,
} from "lucide-react";
import { Link } from "react-router";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const caseTypes = [
  { label: "Profitability", color: "bg-orange/10 text-orange", icon: TrendingUp },
  { label: "Market Entry", color: "bg-purple/10 text-purple", icon: Briefcase },
  { label: "M&A", color: "bg-teal/10 text-teal", icon: Target },
  { label: "Growth Strategy", color: "bg-emerald-100 text-emerald-700", icon: Zap },
  { label: "Operations", color: "bg-amber-100 text-amber-700", icon: BarChart3 },
  { label: "Pricing", color: "bg-blue-100 text-blue-700", icon: Brain },
];

const features = [
  {
    icon: BookOpen,
    title: "AI Case Simulator",
    text: "Practice realistic consulting cases with an adaptive AI interviewer. Not a chatbot — a simulated interview.",
    color: "bg-orange/10 text-orange",
    bg: "bg-orange/5",
  },
  {
    icon: Target,
    title: "Targeted Drills",
    text: "Isolate your weakest skills with focused 10-minute drills: structuring, mental math, synthesis, business judgment.",
    color: "bg-purple/10 text-purple",
    bg: "bg-purple/5",
  },
  {
    icon: BarChart3,
    title: "Performance Tracking",
    text: "See exactly where you stand and where you need to improve. Every session feeds your readiness score.",
    color: "bg-teal/10 text-teal",
    bg: "bg-teal/5",
  },
];

export default function Landing() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-background overflow-x-hidden"
    >
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
              CP
            </div>
            <span className="font-bold text-base tracking-tight">CasePilot</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Log in
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="gap-1.5 rounded-xl px-5">
                Get Started
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-10 right-[15%] h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-[10%] h-48 w-48 rounded-full bg-purple/5 blur-3xl" />

        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] items-center">
            {/* Left: text */}
            <div>
              <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
                <Badge className="bg-primary/10 text-primary border-0 rounded-full px-3 py-1 text-xs font-semibold mb-5">
                  🎯 AI-Powered Interview Prep
                </Badge>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.08] text-balance"
              >
                Train for the{" "}
                <span className="text-primary relative">
                  consulting interview
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 12" fill="none">
                    <path d="M2 8 Q50 2 100 6 T198 4" stroke="oklch(0.65 0.20 30)" strokeWidth="3" strokeLinecap="round" fill="none" />
                  </svg>
                </span>{" "}
                you actually want.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-5 text-base text-muted-foreground leading-relaxed max-w-md"
              >
                Practice realistic cases, identify your weaknesses, and build
                measurable interview readiness — before the real interview.
              </motion.p>

              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-center gap-3 mt-7"
              >
                <Link to="/auth">
                  <Button size="lg" className="gap-2 px-7 rounded-xl">
                    Start Practicing
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="outline" size="lg" className="gap-2 rounded-xl border-border/60">
                    <Play className="h-4 w-4 text-primary" />
                    See How It Works
                  </Button>
                </a>
              </motion.div>

              {/* Stats */}
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex items-center gap-8 mt-10"
              >
                {[
                  { value: "2,400+", label: "Cases Done", icon: BookOpen, color: "text-orange" },
                  { value: "78%", label: "Avg Readiness", icon: TrendingUp, color: "text-teal" },
                  { value: "4.8★", label: "User Rating", icon: Star, color: "text-amber-500" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-lg bg-muted flex items-center justify-center ${s.color}`}>
                      <s.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold tabular-nums">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: product preview */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative"
            >
              {/* Decorative circle */}
              <div className="absolute -top-6 -right-6 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
              <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-purple/10 blur-2xl" />

              <div className="relative rounded-2xl border bg-card shadow-xl shadow-primary/5 p-6 overflow-hidden">
                {/* Mini toolbar */}
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                  </div>
                  <div className="ml-2 flex-1 rounded-lg bg-muted h-6 px-2.5 flex items-center">
                    <span className="text-[10px] text-muted-foreground">casepilot.app/dashboard</span>
                  </div>
                </div>

                {/* Readiness */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Interview Readiness</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-bold tabular-nums">78</span>
                      <span className="text-sm text-muted-foreground">/100</span>
                    </div>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">+12 this month</p>
                  </div>
                  <div className="relative">
                    <svg width="64" height="64" className="-rotate-90">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="oklch(0.95 0.008 80)" strokeWidth="5" />
                      <circle cx="32" cy="32" r="28" fill="none" stroke="oklch(0.55 0.20 30)" strokeWidth="5" strokeDasharray="175.9" strokeDashoffset="38.7" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-2">
                  {[
                    { name: "Structuring", score: 82, color: "bg-emerald-500" },
                    { name: "Quantitative", score: 89, color: "bg-emerald-500" },
                    { name: "Business Judgment", score: 64, color: "bg-amber-500" },
                    { name: "Communication", score: 73, color: "bg-primary" },
                    { name: "Synthesis", score: 61, color: "bg-amber-500" },
                  ].map((s) => (
                    <div key={s.name} className="flex items-center gap-2.5">
                      <span className="text-[11px] text-muted-foreground w-28 shrink-0">{s.name}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.score}%` }} />
                      </div>
                      <span className="text-[11px] font-semibold tabular-nums w-6 text-right">{s.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Case Type Pills */}
      <section className="border-y border-border/50 bg-card/50">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex items-center gap-3 flex-wrap justify-center"
          >
            {caseTypes.map((ct) => {
              const Icon = ct.icon;
              return (
                <motion.div
                  key={ct.label}
                  variants={fadeUp}
                  transition={{ duration: 0.4 }}
                  whileHover={{ scale: 1.04, y: -1 }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/40 bg-card shadow-sm cursor-pointer transition-shadow hover:shadow-md`}
                >
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${ct.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-medium">{ct.label}</span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-14"
          >
            <motion.p variants={fadeUp} className="text-xs font-bold text-primary uppercase tracking-widest mb-3">
              How It Works
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight">
              A systematic approach to{" "}
              <span className="relative inline-block">
                readiness
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 120 8" fill="none">
                  <path d="M2 5 Q30 1 60 4 T118 3" stroke="oklch(0.60 0.18 160)" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>
            </motion.h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid gap-6 md:grid-cols-5"
          >
            {[
              { num: "01", title: "Assess", desc: "Find your baseline with a diagnostic case.", color: "bg-orange/10 text-orange border-orange/20" },
              { num: "02", title: "Diagnose", desc: "Identify your weakest skills.", color: "bg-purple/10 text-purple border-purple/20" },
              { num: "03", title: "Practice", desc: "Targeted drills for each skill.", color: "bg-teal/10 text-teal border-teal/20" },
              { num: "04", title: "Simulate", desc: "Realistic AI case interviews.", color: "bg-primary/10 text-primary border-primary/20" },
              { num: "05", title: "Improve", desc: "Track and measure your progress.", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                variants={fadeUp}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="relative text-center"
              >
                {i < 4 && (
                  <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-px bg-border/60" />
                )}
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${step.color} font-bold text-sm mb-3`}>
                  {step.num}
                </div>
                <h3 className="font-bold text-sm">{step.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-card/60 border-y border-border/50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-14"
          >
            <motion.p variants={fadeUp} className="text-xs font-bold text-primary uppercase tracking-widest mb-3">
              Features
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight">
              Everything you need.{" "}
              <span className="text-muted-foreground font-normal">Nothing you don&apos;t.</span>
            </motion.h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid gap-6 md:grid-cols-3"
          >
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  variants={fadeUp}
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`rounded-2xl border border-border/50 p-6 ${f.bg} hover:shadow-lg hover:shadow-primary/5 transition-shadow`}
                >
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.color} mb-4`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.text}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Product preview — practice page */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-14"
          >
            <motion.p variants={fadeUp} className="text-xs font-bold text-primary uppercase tracking-widest mb-3">
              Case Simulator
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight">
              Practice like it&apos;s the{" "}
              <span className="text-primary font-extrabold">real thing</span>.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">
              Two-panel workspace with an AI interviewer on the left and your notes, issue tree, and calculator on the right.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border bg-card shadow-xl shadow-primary/5 overflow-hidden"
          >
            <div className="grid lg:grid-cols-[1fr_340px] min-h-[400px]">
              {/* Left: interviewer */}
              <div className="border-r border-border/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Interview</span>
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl bg-muted/60 p-4 max-w-[85%]">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Interviewer</p>
                    <p className="text-sm leading-relaxed">The client is a global coffee company whose profits have declined by 15% over the last year. How would you approach this problem?</p>
                  </div>
                  <div className="rounded-xl bg-primary p-4 max-w-[85%] ml-auto">
                    <p className="text-[10px] font-semibold text-primary-foreground/70 uppercase tracking-wider mb-1.5">Your Response</p>
                    <p className="text-sm leading-relaxed text-primary-foreground">I&apos;d break down profitability into revenue and costs. On revenue, I&apos;d examine pricing, volume, and mix...</p>
                  </div>
                </div>
              </div>
              {/* Right: workspace */}
              <div className="bg-muted/20 p-5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Issue Tree</p>
                <div className="space-y-3">
                  <div className="inline-block rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold">Profit Decline</div>
                  <div className="ml-5 space-y-2">
                    <div className="inline-block rounded-lg border bg-card px-3 py-1.5 text-xs font-medium">Revenue</div>
                    <div className="ml-5 space-y-1.5">
                      <div className="inline-block rounded-lg border bg-card px-3 py-1 text-[11px] text-muted-foreground">Price</div>
                      <div className="inline-block rounded-lg border bg-card px-3 py-1 text-[11px] text-muted-foreground">Volume</div>
                    </div>
                    <div className="inline-block rounded-lg border bg-card px-3 py-1.5 text-xs font-medium">Costs</div>
                    <div className="ml-5 space-y-1.5">
                      <div className="inline-block rounded-lg border bg-card px-3 py-1 text-[11px] text-muted-foreground">Fixed</div>
                      <div className="inline-block rounded-lg border bg-card px-3 py-1 text-[11px] text-muted-foreground">Variable</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-card/60 border-y border-border/50">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              { value: "2,400+", label: "Cases completed", color: "bg-orange/10 text-orange" },
              { value: "74%", label: "Avg readiness gain", color: "bg-teal/10 text-teal" },
              { value: "18 min", label: "Avg session time", color: "bg-purple/10 text-purple" },
              { value: "4.8", label: "User rating", color: "bg-primary/10 text-primary" },
            ].map((s, i) => (
              <motion.div key={s.label} variants={fadeUp} className="text-center">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${s.color} mb-3`}>
                  <Trophy className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold tracking-tight tabular-nums">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl bg-primary p-10 lg:p-14 text-center text-primary-foreground relative overflow-hidden"
          >
            <div className="absolute top-4 right-10 h-20 w-20 rounded-full bg-white/10 blur-xl" />
            <div className="absolute bottom-4 left-10 h-16 w-16 rounded-full bg-white/10 blur-xl" />
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight relative z-10">
              Ready to prepare like a candidate, not a student?
            </h2>
            <p className="text-primary-foreground/80 mt-3 max-w-md mx-auto text-sm relative z-10">
              Start with a diagnostic case to find your baseline, then follow a
              targeted training plan until interview day.
            </p>
            <Link to="/auth">
              <Button
                variant="secondary"
                size="lg"
                className="mt-6 gap-2 bg-white text-primary hover:bg-white/90 rounded-xl px-8 relative z-10"
              >
                Start Practicing
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-[9px]">
              CP
            </div>
            <span className="text-xs text-muted-foreground">© 2026 CasePilot</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
