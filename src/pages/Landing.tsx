import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Target, BarChart3, Brain, Zap, TrendingUp, Play } from "lucide-react";
import { Link } from "react-router";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } };

export default function Landing() {
  return (
    <motion.div initial="hidden" animate="visible" className="min-h-screen bg-background">
      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground font-bold text-[11px] text-background tracking-tight">
              CP
            </div>
            <span className="font-bold text-sm tracking-tight">CasePilot</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-muted-foreground">Log in</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Get Started <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO — dark background, asymmetric ── */}
      <section className="relative bg-navy text-white overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-28">
          <div className="grid lg:grid-cols-[1fr_420px] gap-12 items-center">
            <div>
              <motion.p
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="text-sm font-medium text-white/50 mb-5 tracking-wide"
              >
                AI-powered consulting interview prep
              </motion.p>
              <motion.h1
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.06] tracking-tight"
              >
                Train for the consulting
                <br />
                interview you actually want.
              </motion.h1>
              <motion.p
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-5 text-base text-white/60 leading-relaxed max-w-lg"
              >
                Practice realistic cases, identify your weaknesses, and build measurable
                interview readiness — before the real interview.
              </motion.p>
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="flex items-center gap-3 mt-8"
              >
                <Link to="/auth">
                  <Button size="lg" className="bg-white text-navy hover:bg-white/90 gap-2 px-7">
                    Start Practicing <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="ghost" size="lg" className="text-white/60 hover:text-white hover:bg-white/10 gap-2">
                    <Play className="h-4 w-4" /> How it works
                  </Button>
                </a>
              </motion.div>
            </div>

            {/* Product preview embedded in hero */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="hidden lg:block"
            >
              <div className="rounded-xl bg-white/[0.07] border border-white/[0.08] backdrop-blur-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[11px] text-white/40 uppercase tracking-widest font-medium">Readiness</p>
                    <p className="text-3xl font-bold tabular-nums mt-1">78<span className="text-lg font-normal text-white/40">/100</span></p>
                    <p className="text-xs text-emerald-400 mt-0.5">+12 this month</p>
                  </div>
                  <svg width="64" height="64" className="-rotate-90">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                    <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="5" strokeDasharray="175.9" strokeDashoffset="38.7" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="space-y-2.5 mt-3">
                  {[
                    { name: "Structuring", score: 82 },
                    { name: "Quantitative", score: 89 },
                    { name: "Business Judgment", score: 64 },
                    { name: "Communication", score: 73 },
                    { name: "Synthesis", score: 61 },
                  ].map((s) => (
                    <div key={s.name} className="flex items-center gap-3">
                      <span className="text-xs text-white/50 w-32 shrink-0">{s.name}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
                        <div
                          className={`h-full rounded-full ${s.score >= 80 ? "bg-emerald-400" : s.score >= 65 ? "bg-white/60" : "bg-amber-400"}`}
                          style={{ width: `${s.score}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold tabular-nums w-6 text-right text-white/70">{s.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — tight horizontal flow ── */}
      <section id="how-it-works" className="border-b">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-14">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
            <motion.p variants={fadeUp} transition={{ duration: 0.4 }} className="text-[11px] font-semibold text-accent uppercase tracking-[0.15em] mb-8">
              The process
            </motion.p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 lg:gap-0">
              {[
                { n: "01", label: "Assess", desc: "Baseline your skills" },
                { n: "02", label: "Diagnose", desc: "Find weak spots" },
                { n: "03", label: "Practice", desc: "Targeted drills" },
                { n: "04", label: "Simulate", desc: "Real interviews" },
                { n: "05", label: "Improve", desc: "Track progress" },
              ].map((step, i) => (
                <motion.div
                  key={step.n}
                  variants={fadeUp}
                  transition={{ duration: 0.4 }}
                  className="relative lg:not-last:pr-8"
                >
                  {i < 4 && (
                    <div className="hidden lg:block absolute top-4 left-[calc(100%-1px)] w-[calc(100%-32px)] h-px bg-border" />
                  )}
                  <span className="text-2xl font-bold text-muted-foreground/25 tabular-nums">{step.n}</span>
                  <p className="font-semibold text-sm mt-1">{step.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES — two-column asymmetric ── */}
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-14">
          <div className="grid lg:grid-cols-[1fr_1px_1fr] gap-10 lg:gap-0">
            {/* Left: feature list */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="pr-0 lg:pr-10 space-y-8"
            >
              <motion.p variants={fadeUp} transition={{ duration: 0.4 }} className="text-[11px] font-semibold text-accent uppercase tracking-[0.15em]">
                What you get
              </motion.p>
              {[
                { icon: BookOpen, title: "Case Simulator", text: "A realistic consulting interview — not a chatbot. The AI asks questions, probes your answers, and reveals data progressively." },
                { icon: Target, title: "Skill Drills", text: "Isolate structuring, mental math, synthesis, or business judgment. Each drill is 10 minutes and targets one skill." },
                { icon: BarChart3, title: "Readiness Tracking", text: "A single score that reflects your real interview readiness. Updated after every session with clear skill breakdowns." },
                { icon: Brain, title: "Assessments", text: "Numerical reasoning, logical reasoning, data interpretation. Timed tests that mirror what consulting firms actually use." },
              ].map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div key={f.title} variants={fadeUp} transition={{ duration: 0.4 }} className="flex gap-4">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{f.title}</p>
                      <p className="text-[13px] text-muted-foreground leading-relaxed mt-1">{f.text}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Vertical divider */}
            <div className="hidden lg:block bg-border" />

            {/* Right: live readiness widget */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:pl-10 flex flex-col justify-center"
            >
              <div className="rounded-xl border bg-card p-6">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Interview Readiness</p>
                <div className="flex items-baseline gap-1.5 mb-5">
                  <span className="text-4xl font-bold tracking-tight tabular-nums">78</span>
                  <span className="text-base text-muted-foreground">/ 100</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { name: "Structuring", score: 82 },
                    { name: "Quantitative", score: 89 },
                    { name: "Business Judgment", score: 64 },
                    { name: "Communication", score: 73 },
                    { name: "Synthesis", score: 61 },
                  ].map((s) => (
                    <div key={s.name} className="flex items-center gap-3">
                      <span className="text-xs w-32 text-muted-foreground shrink-0">{s.name}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted">
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
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP — dense horizontal band ── */}
      <section className="bg-muted/40 border-b">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-border">
            {[
              { value: "2,400+", label: "Cases completed by users" },
              { value: "74%", label: "Average readiness improvement" },
              { value: "18 min", label: "Average session length" },
              { value: "4.8★", label: "User satisfaction rating" },
            ].map((s) => (
              <div key={s.label} className="lg:px-8 first:lg:pl-0 last:lg:pr-0 text-center">
                <p className="text-xl font-bold tracking-tight tabular-nums">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA — dark band ── */}
      <section className="bg-navy">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Ready to prepare like a candidate, not a student?
          </h2>
          <p className="text-white/50 mt-2 max-w-md mx-auto text-sm">
            Start with a diagnostic case to find your baseline, then follow a
            targeted training plan until interview day.
          </p>
          <Link to="/auth">
            <Button size="lg" className="mt-6 bg-white text-navy hover:bg-white/90 gap-2 px-8">
              Start Practicing <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-navy border-t border-white/10">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-white/20 text-[8px] font-bold text-white">CP</div>
            <span className="text-xs text-white/40">© 2026 CasePilot</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/30">
            <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
