import { useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Brain,
  MessageSquare,
  ClipboardCheck,
  TrendingUp,
  Bot,
  ListChecks,
  Crosshair,
  Mic,
  FileText,
  Gauge,
  Lightbulb,
  Compass,
  ArrowRight,
  Check,
  AlertTriangle,
  BookOpen,
  Code2,
  Database,
  LineChart,
  Target,
  GraduationCap,
  ChevronDown,
  Github,
  Linkedin,
  Instagram,
  Play,
  CheckCircle2,
  Plus,
  Send,
  Loader2,
  FileBadge,
  Layers,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={fadeUp}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  dark = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  dark?: boolean;
}) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center mb-12">
      {eyebrow && (
        <p className="text-xs font-bold tracking-widest uppercase text-primary mb-3">
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "text-3xl md:text-4xl font-extrabold tracking-tight",
          dark ? "text-white" : "text-foreground",
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-3 text-base md:text-lg",
            dark ? "text-slate-300" : "text-muted-foreground",
          )}
        >
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Hero                                                             */
/* ------------------------------------------------------------------ */

const heroIndicators = [
  "AI Learning Assistant",
  "Adaptive Quizzes",
  "Mock Interviews",
  "Personalized Progress",
];

function HeroDashboard() {
  return (
    <div className="relative w-full max-w-[520px]">
      {/* Main dashboard card */}
      <div className="rounded-2xl border border-border bg-card/90 backdrop-blur shadow-nova-lg overflow-hidden">
        {/* Window bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/40">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-[10px] font-semibold text-muted-foreground">
              learnova.app/dashboard
            </span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground">Continue learning</p>
              <p className="text-sm font-bold text-foreground">
                Python — Object-Oriented Programming
              </p>
            </div>
            <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1">
              67% complete
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "67%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: 0.4, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            />
          </div>

          {/* AI tutor snippet */}
          <div className="rounded-xl border border-border bg-background p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-md bg-primary flex items-center justify-center">
                <Bot className="h-3 w-3 text-white" />
              </div>
              <span className="text-[10px] font-bold text-foreground">Learnova AI Tutor</span>
              <span className="ml-auto flex items-center gap-1 text-[9px] text-emerald-600 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground ml-auto w-fit rounded-lg rounded-tr-sm bg-primary/10 text-primary px-2 py-1 font-medium">
                Explain inheritance with an example
              </p>
              <p className="text-[10px] text-foreground/80 w-fit max-w-[85%] rounded-lg rounded-tl-sm bg-muted px-2 py-1 leading-relaxed">
                Inheritance lets a class reuse behavior from another class — e.g. a{" "}
                <span className="font-semibold">Dog</span> class extends{" "}
                <span className="font-semibold">Animal</span>…
              </p>
            </div>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Quiz Score", value: "82%", tone: "text-emerald-600" },
              { label: "Interview Readiness", value: "74%", tone: "text-primary" },
              { label: "Weak Skills", value: "2", tone: "text-amber-600" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border bg-background p-2.5"
              >
                <p className={cn("text-sm font-extrabold tabular-nums", s.tone)}>
                  {s.value}
                </p>
                <p className="text-[9px] text-muted-foreground font-medium mt-0.5 leading-tight">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Mini chart */}
          <div className="rounded-xl border border-border bg-background p-3">
            <p className="text-[9px] font-semibold text-muted-foreground mb-2">
              Learning progress
            </p>
            <svg viewBox="0 0 200 48" className="w-full h-10" preserveAspectRatio="none">
              <motion.path
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, delay: 0.5, ease: "easeOut" }}
                d="M0 40 L25 34 L50 36 L75 26 L100 22 L125 25 L150 14 L175 10 L200 6"
                fill="none"
                stroke="url(#heroGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="heroGrad" x1="0" x2="1">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Floating glass chips */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="absolute -right-4 top-10 hidden sm:block rounded-xl border border-border/70 bg-card/80 backdrop-blur px-3.5 py-2.5 shadow-nova"
      >
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-foreground">Quiz evaluated</p>
            <p className="text-[9px] text-muted-foreground">8 / 10 — AI graded</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="absolute -left-6 bottom-8 hidden sm:block rounded-xl border border-border/70 bg-card/80 backdrop-blur px-3.5 py-2.5 shadow-nova"
      >
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
            <Mic className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-foreground">Mock Interview</p>
            <p className="text-[9px] text-muted-foreground">Resume-aware · 3 of 6</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 nova-hero-mesh" aria-hidden />
      <div
        className="absolute inset-0 nova-grid-lines [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                AI-Powered Learning &amp; Career Preparation
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]">
                Learn Smarter. Practice Better.{" "}
                <span className="nova-gradient-text">Get Career Ready.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-5 max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed">
                An AI-powered learning platform that helps you understand concepts,
                test your knowledge, identify weak areas, and prepare for real-world
                interviews.
              </p>
            </Reveal>
            <Reveal delay={0.24} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 px-7 text-base font-semibold shadow-nova hover:shadow-nova-lg hover:-translate-y-0.5 transition-all"
              >
                <Link to="/auth">
                  Start Learning
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-7 text-base font-semibold border-border hover:border-primary/40 hover:text-primary hover:-translate-y-0.5 transition-all"
              >
                <a href="#interviews">Explore Interviews</a>
              </Button>
            </Reveal>
            <Reveal delay={0.32} className="mt-8">
              <ul className="flex flex-wrap gap-x-5 gap-y-2">
                {heroIndicators.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                  >
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal delay={0.2} className="flex justify-center lg:justify-end">
            <HeroDashboard />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Value bar                                                        */
/* ------------------------------------------------------------------ */

const valueBar = [
  { icon: Brain, label: "AI Learning", desc: "Understand concepts with an AI tutor" },
  { icon: ListChecks, label: "Smart Quizzes", desc: "Generate and take topic-based assessments" },
  { icon: Crosshair, label: "Personalized Practice", desc: "Focus on the areas where you need improvement" },
  { icon: Mic, label: "AI Interviews", desc: "Practice real interview conversations with AI" },
];

function ValueBar() {
  return (
    <section className="border-y border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {valueBar.map((v, i) => (
            <Reveal key={v.label} delay={i * 0.06}>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <v.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{v.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    {v.desc}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3. How it works                                                     */
/* ------------------------------------------------------------------ */

const steps = [
  {
    icon: Brain,
    title: "Learn with AI",
    desc: "Ask questions, explore concepts, and get explanations tailored to your learning level.",
  },
  {
    icon: MessageSquare,
    title: "Practice",
    desc: "Use AI-generated explanations, examples, and practice activities to strengthen your understanding.",
  },
  {
    icon: ClipboardCheck,
    title: "Test Yourself",
    desc: "Generate quizzes and assessments based on the topics you are learning.",
  },
  {
    icon: TrendingUp,
    title: "Improve",
    desc: "Identify weak areas, practice them, and re-test your knowledge.",
  },
];

function HowItWorks() {
  return (
    <section className="py-20 md:py-24 bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="How Learnova Works"
          title="Your Complete Learning Loop"
          subtitle="Learn, test yourself, understand your weak areas, and improve continuously."
        />
        <div className="relative grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Connector line (desktop) */}
          <div
            aria-hidden
            className="absolute top-6 left-[12%] right-[12%] hidden lg:block h-px bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30"
          />
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.08}>
              <div className="relative flex flex-col items-start">
                <div className="relative z-10 mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-card text-primary shadow-nova-sm">
                  <s.icon className="h-5 w-5" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 4. AI learning assistant                                            */
/* ------------------------------------------------------------------ */

const tutorMessages = [
  { role: "user", text: "Explain REST APIs like I'm a beginner." },
  {
    role: "ai",
    text: "A REST API is a way for applications to communicate over the internet using simple requests and responses...",
  },
  { role: "user", text: "Give me an example." },
  {
    role: "ai",
    text: "Imagine a food delivery app: when you open it, it asks the restaurant's API for today's menu — that's a GET request...",
  },
];

const tutorFeatures = [
  { title: "Context-Aware Conversations", desc: "Ask follow-up questions without restarting." },
  { title: "Simple Explanations", desc: "Get concepts explained at the level you need." },
  { title: "Topic-Focused Learning", desc: "Keep conversations connected to what you're studying." },
  { title: "Instant Practice", desc: "Move from explanation directly into practice." },
  { title: "Personalized Guidance", desc: "Use your learning progress to focus on what matters." },
];

function TutorSection() {
  return (
    <section className="py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="AI Learning Assistant"
          title="Meet Your AI Learning Assistant"
          subtitle="Learn through conversation instead of searching through endless resources."
        />
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="rounded-2xl border border-border bg-card shadow-nova-lg overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-border bg-muted/40 px-4 py-3">
                <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Learnova AI Tutor</p>
                  <p className="text-[10px] text-muted-foreground">Topic: Web Development · APIs</p>
                </div>
                <span className="ml-auto rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1">
                  Ready to help
                </span>
              </div>
              <div className="space-y-3 p-4 sm:p-5">
                {tutorMessages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.18, duration: 0.4 }}
                    className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <p
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed",
                        m.role === "user"
                          ? "rounded-br-md bg-primary text-white font-medium"
                          : "rounded-bl-md bg-muted text-foreground/90",
                      )}
                    >
                      {m.text}
                    </p>
                  </motion.div>
                ))}
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5">
                  <span className="flex-1 text-xs text-muted-foreground">
                    Ask anything about this topic...
                  </span>
                  <Send className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <ul className="space-y-5">
              {tutorFeatures.map((f) => (
                <li key={f.title} className="flex items-start gap-3.5">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{f.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8 h-11 px-6 font-semibold gap-2 group">
              <Link to="/auth">
                Start Learning with AI
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Quiz generator                                                   */
/* ------------------------------------------------------------------ */

const quizOptions = [
  { label: "A", text: "To hide class implementation details" },
  { label: "B", text: "To allow a class to reuse properties and behavior from another class" },
  { label: "C", text: "To create multiple instances of a class" },
  { label: "D", text: "To define methods without a body" },
];

function QuizSection() {
  const [selected, setSelected] = useState<string | null>("B");
  const [difficulty, setDifficulty] = useState("Medium");

  return (
    <section className="bg-[#F8FAFC] py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="AI Quiz Generator"
          title="Turn Any Topic Into a Quiz"
          subtitle="Generate structured assessments from the topics you're learning."
        />
        <div className="grid gap-8 lg:grid-cols-5 items-start">
          {/* Generator panel */}
          <Reveal className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-nova">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Topic
              </p>
              <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-border bg-background px-3.5 py-3">
                <Code2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  Python — Object-Oriented Programming
                </span>
              </div>

              <p className="mt-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Difficulty
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {["Easy", "Medium", "Hard"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-xs font-bold transition-all",
                      difficulty === d
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground",
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Questions
                </p>
                <span className="text-sm font-extrabold text-foreground tabular-nums">10</span>
              </div>

              <Button className="mt-6 w-full h-11 font-semibold gap-2">
                <Zap className="h-4 w-4" />
                Generate Quiz
              </Button>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Evaluated on the Learnova backend — not in your browser
              </p>
            </div>
          </Reveal>

          {/* Question + results */}
          <Reveal delay={0.1} className="lg:col-span-3 space-y-5">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-nova">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary">Question 4 of 10</span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                  {difficulty}
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "40%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
              <p className="mt-5 text-base font-bold text-foreground leading-snug">
                What is the purpose of inheritance in object-oriented programming?
              </p>
              <div className="mt-4 space-y-2.5">
                {quizOptions.map((o) => {
                  const isSel = selected === o.label;
                  return (
                    <button
                      key={o.label}
                      onClick={() => setSelected(o.label)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                        isSel
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary/30",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold",
                          isSel ? "bg-primary text-white" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {o.label}
                      </span>
                      {o.text}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-3.5">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-xs font-bold text-emerald-800">AI Explanation</p>
                  <p className="text-xs text-emerald-700/90 mt-0.5 leading-relaxed">
                    Correct. Inheritance allows a class to reuse properties and behavior
                    from another class, reducing duplication and modeling "is-a" relationships.
                  </p>
                </div>
              </div>
            </div>

            {/* Backend evaluation card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-nova">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex gap-8">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Score
                    </p>
                    <p className="text-xl font-extrabold text-foreground tabular-nums">8 / 10</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Accuracy
                    </p>
                    <p className="text-xl font-extrabold text-emerald-600 tabular-nums">80%</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Weak Areas
                  </p>
                  <div className="flex gap-2 justify-end">
                    {["Polymorphism", "Abstract Classes"].map((w) => (
                      <span
                        key={w}
                        className="flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/70 px-2.5 py-1 text-[10px] font-bold"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Button asChild variant="outline" className="mt-5 w-full h-10 font-semibold gap-2 border-primary/30 text-primary hover:bg-primary/5">
                <Link to="/auth">
                  Practice Weak Areas
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Personalized practice                                            */
/* ------------------------------------------------------------------ */

const strongAreas = ["Python Basics", "Functions", "Data Structures"];
const weakAreas = ["Polymorphism", "SQL Joins", "System Design"];

function PracticeSection() {
  return (
    <section className="py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Personalized Practice"
          title="Don't Just See Your Score. Know What to Improve."
        />
        <div className="grid gap-8 lg:grid-cols-2 items-start">
          {/* Performance dashboard */}
          <Reveal>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-nova">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Your Performance
              </p>
              <div className="mt-4 flex items-center gap-5">
                <div className="relative h-20 w-20 shrink-0">
                  <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E2E8F0" strokeWidth="3.5" />
                    <motion.circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray="97.4"
                      initial={{ strokeDashoffset: 97.4 }}
                      whileInView={{ strokeDashoffset: 97.4 * (1 - 0.82) }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-extrabold text-foreground tabular-nums">82%</span>
                    <span className="text-[9px] text-muted-foreground">Overall</span>
                  </div>
                </div>
                <div className="flex-1 grid gap-2.5">
                  {strongAreas.map((s) => (
                    <div key={s} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="font-semibold text-foreground">{s}</span>
                      <span className="ml-auto text-[10px] font-bold text-emerald-600 uppercase">
                        Strong
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5 border-t border-border pt-4 space-y-2.5">
                {weakAreas.map((s) => (
                  <div key={s} className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-foreground">{s}</span>
                    <span className="ml-auto text-[10px] font-bold text-amber-600 uppercase">
                      Needs practice
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Recommended practice + loop */}
          <Reveal delay={0.1} className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-nova">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Recommended Practice
              </p>
              <div className="mt-3 flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-base font-extrabold text-foreground">SQL Joins</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Why: You missed 3 questions related to joins.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="h-8 text-xs font-semibold">
                    <BookOpen className="mr-1.5 h-3.5 w-3.5" /> Learn Topic
                  </Button>
                  <Button size="sm" className="h-8 text-xs font-semibold">
                    Practice
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5"
                  >
                    Take Quiz
                  </Button>
                </div>
              </div>
            </div>

            {/* Closed loop */}
            <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-[#EFF6FF] via-card to-card p-6 shadow-nova">
              <p className="text-xs font-bold uppercase tracking-wider text-primary mb-4">
                The closed learning loop
              </p>
              <div className="flex flex-col items-start gap-1">
                {["Quiz", "Weak Area", "Practice", "Re-test"].map((stage, i, arr) => (
                  <div key={stage} className="flex flex-col items-start">
                    <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary text-[10px] font-extrabold">
                        {i + 1}
                      </span>
                      {stage}
                    </span>
                    {i < arr.length - 1 && (
                      <TrendingUp className="ml-[11px] my-1 h-3.5 w-3.5 rotate-90 text-primary/40" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 7. Interview preparation                                            */
/* ------------------------------------------------------------------ */

function InterviewSection() {
  return (
    <section id="interviews" className="bg-[#F8FAFC] py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="AI Mock Interviews"
          title="Prepare for Real Interviews with AI"
          subtitle="Practice interviews that adapt to your role, experience, and answers."
        />
        <Reveal>
          <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card shadow-nova-lg overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
              <div className="flex rounded-lg border border-border bg-card p-0.5">
                <span className="rounded-md bg-primary px-3 py-1 text-[11px] font-bold text-white">
                  Chat
                </span>
                <span className="rounded-md px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                  Voice
                </span>
              </div>
              <span className="rounded-full bg-background border border-border px-3 py-1 text-[11px] font-semibold text-foreground">
                Role: Software Engineer
              </span>
              <span className="rounded-full bg-background border border-border px-3 py-1 text-[11px] font-semibold text-foreground">
                Difficulty: Medium
              </span>
              <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/70 px-3 py-1 text-[11px] font-bold text-emerald-700">
                <Check className="h-3 w-3" /> Resume Connected
              </span>
            </div>

            <div className="p-5 sm:p-7">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-primary">Question 3 of 6</span>
                <span className="text-muted-foreground font-semibold">Adaptive follow-ups</span>
              </div>
              <div className="mt-2.5 flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-1.5 flex-1 rounded-full bg-primary" />
                ))}
                {[3, 4, 5].map((i) => (
                  <div key={i} className="h-1.5 flex-1 rounded-full bg-muted" />
                ))}
              </div>

              <div className="mt-6 space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="flex gap-3"
                >
                  <div className="h-8 w-8 shrink-0 rounded-lg bg-primary flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md bg-muted px-4 py-3 text-sm text-foreground/90 leading-relaxed">
                    Your project mentions a recommendation system. Can you explain how you
                    evaluated its performance?
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.45, duration: 0.4 }}
                  className="flex gap-3 justify-end"
                >
                  <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-primary px-4 py-3 text-sm text-white leading-relaxed">
                    I used precision and recall to measure recommendation quality, and ran
                    an offline evaluation against a held-out interaction log...
                  </div>
                  <div className="h-8 w-8 shrink-0 rounded-lg bg-accent/15 text-accent flex items-center justify-center font-bold text-xs">
                    You
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                  className="flex items-center gap-2 pl-11 text-xs text-muted-foreground"
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  AI is analyzing your response...
                </motion.div>
              </div>

              <div className="mt-7 flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3">
                <span className="flex-1 text-sm text-muted-foreground">
                  Type your answer...
                </span>
                <Mic className="h-4 w-4 text-muted-foreground" />
                <Send className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15} className="mt-8 text-center">
          <Button asChild size="lg" className="h-12 px-7 font-semibold gap-2">
            <Link to="/auth">
              Practice an Interview
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 8. Resume-aware interviews                                          */
/* ------------------------------------------------------------------ */

const resumeSkills = ["Python", "React", "SQL", "Machine Learning"];
const resumeProjects = ["Recommendation System", "E-commerce Platform"];

const resumeFeatures = [
  {
    title: "Resume-Grounded Questions",
    desc: "Questions reference your actual projects and skills.",
  },
  {
    title: "Role-Specific Interviews",
    desc: "Prepare for Software Engineering, Data Analytics, Product, Consulting, and custom roles.",
  },
  {
    title: "Adaptive Follow-Ups",
    desc: "Strong answers can lead to deeper questions. Weak areas can trigger clarification or simpler follow-ups.",
  },
  {
    title: "Evidence-Based Evaluation",
    desc: "Your performance is evaluated from your actual answers.",
  },
];

function ResumeSection() {
  return (
    <section className="py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Resume-Aware Interviews"
          title="Your Resume Becomes Part of the Interview"
        />
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="rounded-2xl border border-border bg-card shadow-nova-lg overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-border bg-muted/40 px-5 py-3.5">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground">My Resume</span>
                <span className="ml-auto rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 border border-emerald-200/70">
                  Parsed
                </span>
              </div>
              <div className="p-5 sm:p-6 space-y-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                    Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {resumeSkills.map((s) => (
                      <span
                        key={s}
                        className="rounded-lg bg-primary/5 border border-primary/15 px-2.5 py-1 text-xs font-semibold text-primary"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                    Projects
                  </p>
                  <div className="space-y-2">
                    {resumeProjects.map((p) => (
                      <div
                        key={p}
                        className="flex items-center gap-2.5 rounded-xl border border-border bg-background px-3.5 py-2.5"
                      >
                        <Layers className="h-4 w-4 text-accent" />
                        <span className="text-sm font-semibold text-foreground">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-[#EFF6FF] border border-primary/10 p-3.5 flex items-start gap-2.5">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    The AI interviewer references these skills and projects when
                    generating questions and follow-ups.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Upload your resume and Learnova uses the information in it to create
              relevant interview questions.
            </p>
            <ul className="mt-7 space-y-5">
              {resumeFeatures.map((f) => (
                <li key={f.title} className="flex items-start gap-3.5">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileBadge className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{f.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8 h-11 px-6 font-semibold gap-2 group">
              <Link to="/auth">
                Try Resume Interview
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 9. Interview evaluation                                             */
/* ------------------------------------------------------------------ */

const evalSkills = [
  { name: "Technical Knowledge", score: 86 },
  { name: "Problem Solving", score: 81 },
  { name: "Communication", score: 84 },
  { name: "Completeness", score: 78 },
  { name: "Resume Alignment", score: 88 },
];

const evalStrengths = [
  "Strong technical explanations",
  "Good project understanding",
  "Relevant examples",
];
const evalImprove = [
  "Explain trade-offs more clearly",
  "Strengthen system design fundamentals",
  "Improve answer completeness",
];

function EvaluationSection() {
  return (
    <section className="bg-[#F8FAFC] py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="AI Evaluation"
          title="Understand How You Performed"
        />
        <Reveal>
          <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-nova-lg">
            <div className="flex flex-wrap items-center gap-8">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-primary/5 border border-primary/10">
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-primary tabular-nums">82</p>
                  <p className="text-[10px] font-semibold text-muted-foreground">/ 100</p>
                </div>
              </div>
              <div className="flex-1 min-w-[260px] space-y-3">
                {evalSkills.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 text-xs font-semibold text-foreground/80 sm:text-sm">
                      {s.name}
                    </span>
                    <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${s.score}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: i * 0.08, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      />
                    </div>
                    <span className="w-7 text-right text-sm font-bold tabular-nums text-foreground">
                      {s.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2.5">
                  Strengths
                </p>
                <ul className="space-y-2">
                  {evalStrengths.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-sm text-emerald-800">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2.5">
                  Improve
                </p>
                <ul className="space-y-2">
                  {evalImprove.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-sm text-amber-800">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-primary/15 bg-[#EFF6FF] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
                Recommended Next Steps
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="h-8 text-xs font-semibold">
                  Practice System Design
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5">
                  Learn SQL
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5">
                  Take Technical Quiz
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 10. Dashboard preview                                               */
/* ------------------------------------------------------------------ */

const sidebarItems = [
  "Dashboard",
  "Learn",
  "Quizzes",
  "Practice",
  "Interviews",
  "Progress",
];

function DashboardPreview() {
  return (
    <section className="py-20 md:py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Product Tour"
          title="Everything You Need in One Learning Dashboard"
        />
        <Reveal>
          <div className="rounded-2xl border border-border bg-card shadow-nova-lg overflow-hidden">
            <div className="flex min-h-[420px]">
              {/* Sidebar */}
              <div className="hidden sm:flex w-44 shrink-0 flex-col gap-1 border-r border-border bg-muted/30 p-3">
                <div className="mb-3 flex items-center gap-2 px-2">
                  <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs font-extrabold text-foreground">Learnova</span>
                </div>
                {sidebarItems.map((item, i) => (
                  <span
                    key={item}
                    className={cn(
                      "rounded-lg px-3 py-2 text-xs font-semibold",
                      i === 0
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {item}
                  </span>
                ))}
              </div>

              {/* Main */}
              <div className="flex-1 p-5 sm:p-6 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <p className="text-base font-extrabold text-foreground">
                    Good morning 👋
                  </p>
                </div>

                {/* Continue learning */}
                <div className="rounded-xl border border-primary/15 bg-[#EFF6FF] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Continue Learning
                  </p>
                  <p className="mt-1.5 text-sm font-bold text-foreground">
                    Python Advanced Concepts
                  </p>
                  <div className="mt-2.5 h-1.5 w-full rounded-full bg-primary/15 overflow-hidden">
                    <div className="h-full w-[67%] rounded-full bg-primary" />
                  </div>
                  <p className="mt-1.5 text-[10px] font-semibold text-muted-foreground">
                    67% complete
                  </p>
                  <Button size="sm" className="mt-3 h-7 text-[11px] font-bold">
                    Continue Learning
                  </Button>
                </div>

                {/* Progress */}
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Your Progress
                  </p>
                  <div className="mt-3 space-y-3">
                    {[
                      { label: "Learning", value: 78, tone: "bg-primary" },
                      { label: "Quiz Average", value: 82, tone: "bg-emerald-500" },
                      { label: "Interview Readiness", value: 74, tone: "bg-accent" },
                    ].map((p) => (
                      <div key={p.label}>
                        <div className="flex justify-between text-[11px] font-semibold text-foreground/80">
                          <span>{p.label}</span>
                          <span className="tabular-nums">{p.value}%</span>
                        </div>
                        <div className="mt-1 flex gap-0.5">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "h-2 flex-1 rounded-sm",
                                i < Math.round(p.value / 10) ? p.tone : "bg-muted",
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weak areas */}
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Weak Areas
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["SQL Joins", "System Design", "Polymorphism"].map((w) => (
                      <span
                        key={w}
                        className="flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/70 px-2.5 py-1 text-[11px] font-bold"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {w}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recent activity */}
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Recent Activity
                  </p>
                  <ul className="mt-3 space-y-2">
                    {["Python Quiz", "System Design Practice", "Software Engineer Interview"].map(
                      (a) => (
                        <li
                          key={a}
                          className="flex items-center gap-2 text-xs font-semibold text-foreground/80"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          {a}
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                {/* Recommended */}
                <div className="md:col-span-2 rounded-xl border border-primary/15 bg-gradient-to-r from-[#EFF6FF] to-card p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2.5">
                    Recommended For You
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["SQL Joins Quiz", "System Design Practice", "Mock Interview"].map((r) => (
                      <span
                        key={r}
                        className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-card px-3 py-1.5 text-[11px] font-bold text-primary"
                      >
                        <Plus className="h-3 w-3" />
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 11. Learning paths                                                  */
/* ------------------------------------------------------------------ */

const paths = [
  {
    icon: Code2,
    title: "Programming",
    desc: "Core programming skills from fundamentals to advanced topics.",
    topics: ["Python", "Java", "C++", "Data Structures"],
    progress: 45,
  },
  {
    icon: Layers,
    title: "Web Development",
    desc: "Build modern web applications end to end.",
    topics: ["HTML/CSS", "JavaScript", "React", "APIs"],
    progress: 30,
  },
  {
    icon: Database,
    title: "Data & AI",
    desc: "Work with data and understand AI fundamentals.",
    topics: ["SQL", "Machine Learning", "Data Analysis", "AI Fundamentals"],
    progress: 20,
  },
  {
    icon: GraduationCap,
    title: "Career Skills",
    desc: "Prepare for interviews and communicate your skills.",
    topics: ["Interview Preparation", "Problem Solving", "Communication", "Resume Preparation"],
    progress: 15,
  },
];

function LearningPaths() {
  return (
    <section className="bg-[#F8FAFC] py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Learning Paths"
          title="Build Skills Step by Step"
          subtitle="Move from fundamentals to practical application with structured learning paths."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {paths.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.06}>
              <div className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-nova-sm transition-all hover:shadow-nova hover:-translate-y-1 hover:border-primary/25">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">{p.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {p.topics.map((t) => (
                    <li
                      key={t}
                      className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-4">
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                    <span>Progress</span>
                    <span className="tabular-nums">{p.progress}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${p.progress}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:gap-2 transition-all">
                    Continue <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-5 text-center text-[11px] text-muted-foreground">
          Learning paths are structured study guides — not paid certifications.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 12. Progress & readiness                                            */
/* ------------------------------------------------------------------ */

const progressStats = [
  { icon: LineChart, label: "Learning Progress", value: "78%", sub: "Overall completion" },
  { icon: ListChecks, label: "Quiz Performance", value: "82%", sub: "Average score" },
  { icon: Target, label: "Interview Performance", value: "78%", sub: "Average score" },
  { icon: TrendingUp, label: "Skills Improved", value: "12", sub: "Measured skills" },
  { icon: Mic, label: "Interviews Completed", value: "5", sub: "AI-evaluated" },
];

function ProgressSection() {
  return (
    <section className="py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Progress & Readiness"
          title="See Your Growth Over Time"
        />
        <div className="grid gap-6 lg:grid-cols-5 items-start">
          <Reveal className="lg:col-span-3">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-nova">
              <p className="text-sm font-bold text-foreground mb-4">Learning Progress</p>
              <svg viewBox="0 0 320 120" className="w-full" preserveAspectRatio="none">
                <motion.path
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  d="M0 100 L40 88 L80 92 L120 72 L160 60 L200 66 L240 44 L280 34 L320 22"
                  fill="none"
                  stroke="url(#progressGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <motion.path
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  d="M0 100 L40 88 L80 92 L120 72 L160 60 L200 66 L240 44 L280 34 L320 22 L320 120 L0 120 Z"
                  fill="url(#progressFill)"
                />
                <defs>
                  <linearGradient id="progressGrad" x1="0" x2="1">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                  <linearGradient id="progressFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {progressStats.slice(1).map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-border bg-background p-3"
                  >
                    <s.icon className="h-4 w-4 text-primary" />
                    <p className="mt-1.5 text-lg font-extrabold text-foreground tabular-nums">
                      {s.value}
                    </p>
                    <p className="text-[10px] font-semibold text-muted-foreground leading-tight">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-2 space-y-5">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-nova">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-3">
                Your strongest areas
              </p>
              <div className="flex flex-wrap gap-2">
                {["Python", "Communication", "Problem Solving"].map((s) => (
                  <span
                    key={s}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200/70 px-3 py-1.5 text-xs font-bold text-emerald-700"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-nova">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3">
                Focus next
              </p>
              <div className="flex flex-wrap gap-2">
                {["System Design", "SQL", "Technical Depth"].map((s) => (
                  <span
                    key={s}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200/70 px-3 py-1.5 text-xs font-bold text-amber-700"
                  >
                    <Target className="h-3.5 w-3.5" />
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <p className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
              If there isn't enough historical data yet, Learnova shows: "Complete more
              activities to build your progress history." Progress is only built from your
              real activity — never simulated.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 13. AI features grid                                                */
/* ------------------------------------------------------------------ */

const aiFeatures = [
  { icon: Bot, title: "AI Learning Assistant", desc: "Conversational tutoring tailored to your level." },
  { icon: ListChecks, title: "AI Quiz Generator", desc: "Structured assessments from any topic." },
  { icon: Crosshair, title: "AI Weak-Area Analysis", desc: "Pinpoint exactly which skills need attention." },
  { icon: Mic, title: "AI Mock Interviews", desc: "Role-specific, adaptive interview practice." },
  { icon: FileText, title: "Resume-Aware Questions", desc: "Interviews grounded in your actual experience." },
  { icon: Gauge, title: "AI Evaluation", desc: "Evidence-based scoring across key skills." },
  { icon: Lightbulb, title: "Personalized Feedback", desc: "Actionable guidance after every attempt." },
  { icon: Compass, title: "Learning Recommendations", desc: "Know the best next step, always." },
];

function FeaturesGrid() {
  return (
    <section className="bg-[#F8FAFC] py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="AI Features"
          title="AI That Works Across Your Learning Journey"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {aiFeatures.map((f, i) => (
            <Reveal key={f.title} delay={(i % 4) * 0.05}>
              <div className="h-full rounded-2xl border border-border bg-card p-5 shadow-nova-sm transition-all hover:shadow-nova hover:-translate-y-1 hover:border-primary/25">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3.5 text-sm font-bold text-foreground">{f.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 14. Why Learnova                                                    */
/* ------------------------------------------------------------------ */

const traditionalPoints = [
  "Static content",
  "Generic quizzes",
  "Manual progress tracking",
  "Same path for everyone",
  "Separate interview preparation",
];

const learnovaPoints = [
  "Conversational AI learning",
  "AI-generated assessments",
  "Weak-area detection",
  "Personalized practice",
  "Resume-aware interviews",
  "AI evaluation",
  "Connected learning journey",
];

function WhyLearnova() {
  return (
    <section className="py-20 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <SectionHeader title="More Than an AI Chatbot" />
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-2xl border border-border bg-muted/40 p-6 sm:p-7">
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Traditional Learning
              </p>
              <ul className="mt-5 space-y-3">
                {traditionalPoints.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="h-full rounded-2xl border border-primary/20 bg-gradient-to-br from-[#EFF6FF] to-card p-6 sm:p-7 shadow-nova">
              <p className="text-sm font-bold uppercase tracking-wider text-primary">
                Learnova
              </p>
              <ul className="mt-5 space-y-3">
                {learnovaPoints.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm font-semibold text-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 15. Testimonials                                                    */
/* ------------------------------------------------------------------ */

const testimonials = [
  {
    quote:
      "Instead of searching for explanations everywhere, I could ask Learnova follow-up questions until the concept finally made sense.",
    author: "Computer Science Student",
  },
  {
    quote:
      "The quiz showed me exactly where I was weak, and I could immediately practice those topics.",
    author: "Software Engineering Student",
  },
  {
    quote:
      "The interview mode helped me understand not just my score, but what I needed to improve.",
    author: "Graduate Job Seeker",
  },
];

function Testimonials() {
  return (
    <section className="bg-[#F8FAFC] py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Demo Experiences"
          title="Built Around How You Actually Learn"
        />
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.author} delay={i * 0.08}>
              <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-nova-sm">
                <Sparkles className="h-5 w-5 text-primary" />
                <blockquote className="mt-4 flex-1 text-sm text-foreground/85 leading-relaxed">
                  "{t.quote}"
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Play className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{t.author}</p>
                    <p className="text-[10px] text-muted-foreground">Illustrative demo content</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        <p className="mt-5 text-center text-[11px] text-muted-foreground">
          Testimonials above are illustrative demo content, not verified user statements.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 16. FAQ                                                             */
/* ------------------------------------------------------------------ */

const faqs = [
  {
    q: "What is Learnova?",
    a: "Learnova is an AI-powered learning and career preparation platform. It combines an AI learning assistant, adaptive quizzes, personalized practice, weak-area analysis, and AI mock interviews so you can learn, test yourself, and improve in one connected loop.",
  },
  {
    q: "How does the AI Learning Assistant work?",
    a: "You ask questions about any topic you're studying, and the assistant explains concepts at your level, gives examples, and keeps the conversation connected to your learning goals — so you can ask follow-ups without restarting.",
  },
  {
    q: "Can I generate quizzes for any topic?",
    a: "Yes. Pick a topic, choose a difficulty (Easy, Medium, or Hard), and Learnova generates a structured quiz. Quizzes are evaluated on the backend, and your results feed directly into weak-area analysis.",
  },
  {
    q: "How does Learnova identify weak areas?",
    a: "Every quiz and assessment is evaluated on the backend. Missed topics are grouped into weak areas, and Learnova recommends targeted practice for each one — so you always know what to study next.",
  },
  {
    q: "Can I practice interviews using my resume?",
    a: "Yes. Upload your resume and the AI interviewer references your actual skills and projects to generate relevant, role-specific questions and adaptive follow-ups.",
  },
  {
    q: "Does Learnova support voice interviews?",
    a: "Yes. In addition to chat-based interviews, you can answer with your voice. Your speech is transcribed and passed to the same interview engine, so evaluation works identically in both modes.",
  },
  {
    q: "How is my interview evaluated?",
    a: "Your answers are evaluated by AI across skills like technical knowledge, problem solving, communication, completeness, and resume alignment. You get an overall score, strengths, areas to improve, and recommended next steps.",
  },
  {
    q: "Can I track my learning progress?",
    a: "Yes. Your dashboard shows learning progress, quiz averages, interview readiness, weak areas, and recommended activities — all built from your real activity on the platform.",
  },
];

function FAQ() {
  return (
    <section className="py-20 md:py-24">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeader title="Frequently Asked Questions" />
        <Reveal>
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-2xl border border-border bg-card px-5 shadow-nova-sm data-[state=open]:border-primary/25 last:border-b"
              >
                <AccordionTrigger className="py-4 text-left text-sm font-bold text-foreground hover:no-underline [&>svg]:text-primary">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm text-muted-foreground leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 17. Final CTA                                                       */
/* ------------------------------------------------------------------ */

function FinalCTA() {
  return (
    <section className="bg-[#0F172A] py-20 md:py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Your Learning Journey Starts Here.
          </h2>
          <p className="mt-4 text-base md:text-lg text-slate-300">
            Learn concepts. Practice skills. Test yourself. Prepare for your next
            opportunity.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 px-7 text-base font-semibold shadow-lg shadow-primary/30 hover:-translate-y-0.5 transition-all"
            >
              <Link to="/auth">Start Learning Free</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 px-7 text-base font-semibold border-slate-600 bg-transparent text-white hover:bg-white/10 hover:text-white hover:border-slate-400 transition-all"
            >
              <Link to="/auth">Practice an Interview</Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-slate-400">
            No complicated setup. Start learning with AI.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 18. Footer                                                          */
/* ------------------------------------------------------------------ */

const footerCols = [
  {
    title: "Product",
    links: ["Learn", "Quizzes", "Practice", "Interviews", "Progress"],
  },
  {
    title: "Resources",
    links: ["Learning Paths", "Interview Preparation", "Help Center", "FAQ"],
  },
  {
    title: "Company",
    links: ["About", "Contact", "Privacy", "Terms"],
  },
];

function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#0F172A] pb-8 pt-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-white">
                Learnova
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-slate-400 leading-relaxed">
              AI-powered learning and career preparation.
            </p>
            <div className="mt-5 flex gap-3">
              {[Github, Linkedin, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label={["GitHub", "LinkedIn", "Instagram"][i]}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {footerCols.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-slate-800 pt-6">
          <p className="text-xs text-slate-500">
            © 2026 Learnova. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/25">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-foreground">
              Learnova
            </span>
          </Link>
          <div className="hidden items-center gap-7 md:flex">
            {[
              ["How It Works", "#how-it-works"],
              ["Features", "#features"],
              ["Interviews", "#interviews"],
              ["FAQ", "#faq"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2.5">
            <Button asChild variant="ghost" size="sm" className="font-semibold">
              <Link to="/auth">Log In</Link>
            </Button>
            <Button asChild size="sm" className="font-semibold shadow-nova-sm">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      <Hero />
      <div id="features">
        <ValueBar />
      </div>
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <TutorSection />
      <QuizSection />
      <PracticeSection />
      <InterviewSection />
      <ResumeSection />
      <EvaluationSection />
      <DashboardPreview />
      <LearningPaths />
      <ProgressSection />
      <FeaturesGrid />
      <WhyLearnova />
      <Testimonials />
      <div id="faq">
        <FAQ />
      </div>
      <FinalCTA />
      <Footer />
    </div>
  );
}
