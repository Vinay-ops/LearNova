import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  Star,
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  Sparkles,
  Bot,
  PieChart,
  PenTool,
  Camera,
} from "lucide-react";
import { Link } from "react-router";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const features = [
  { label: "Personalized Learning", color: "text-purple-600", bg: "bg-purple-100", icon: BookOpen },
  { label: "AI Assessments", color: "text-amber-600", bg: "bg-amber-100", icon: BarChart3 },
  { label: "AI Text Interviews", color: "text-pink-600", bg: "bg-pink-100", icon: Brain },
  { label: "AI Voice Interviews", color: "text-emerald-600", bg: "bg-emerald-100", icon: Target },
  { label: "Personalized Feedback", color: "text-orange-600", bg: "bg-orange-100", icon: TrendingUp },
  { label: "Progress Tracking", color: "text-blue-600", bg: "bg-blue-100", icon: Briefcase },
];

const popularCases = [
  {
    tag: "Bestseller",
    tagColor: "bg-amber-400 text-amber-950",
    title: "Technical Interview Fundamentals",
    author: "Learnova",
    rating: 4.8,
    reviews: "1.2K",
    duration: "25h",
    level: "Beginner",
    headerBg: "bg-gradient-to-br from-amber-100 via-orange-100 to-amber-200",
    illustration: (
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="w-32 h-24 bg-zinc-800 rounded-lg shadow-lg border-2 border-zinc-700 p-2 flex flex-col justify-between">
          <div className="flex gap-1 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
          </div>
          <div className="space-y-1 font-mono text-[8px] text-emerald-400 leading-tight">
            <div>&lt;html&gt;</div>
            <div className="pl-2 text-sky-300">&lt;body&gt;</div>
            <div className="pl-4 text-amber-300">Build Future</div>
          </div>
          <div className="h-1 w-8 bg-purple-500 rounded"></div>
        </div>
      </div>
    ),
  },
  {
    tag: "New",
    tagColor: "bg-blue-500 text-white",
    title: "Product & Design Interviews",
    author: "Learnova",
    rating: 4.9,
    reviews: "856",
    duration: "15h",
    level: "All Levels",
    headerBg: "bg-gradient-to-br from-blue-100 via-indigo-100 to-sky-200",
    illustration: (
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="w-28 h-24 bg-white rounded-xl shadow-md p-2.5 border border-sky-200 flex flex-col gap-1.5">
          <div className="w-full h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-[10px] font-bold">
            UI Canvas
          </div>
          <div className="flex gap-1.5">
            <div className="flex-1 h-6 bg-pink-100 rounded-md"></div>
            <div className="flex-1 h-6 bg-purple-100 rounded-md"></div>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Popular",
    tagColor: "bg-pink-500 text-white",
    title: "Business & Strategy Cases",
    author: "Learnova",
    rating: 4.7,
    reviews: "2.1K",
    duration: "18h",
    level: "Intermediate",
    headerBg: "bg-gradient-to-br from-pink-100 via-rose-100 to-orange-100",
    illustration: (
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="w-28 h-24 bg-white rounded-xl shadow-md p-3 border border-pink-200 flex flex-col justify-between">
          <div className="flex items-end gap-1.5 h-12 pt-2">
            <div className="w-3 bg-pink-300 h-[40%] rounded-t"></div>
            <div className="w-3 bg-pink-400 h-[60%] rounded-t"></div>
            <div className="w-3 bg-pink-500 h-[85%] rounded-t"></div>
            <div className="w-3 bg-purple-600 h-[100%] rounded-t"></div>
          </div>
          <div className="h-2 w-full bg-pink-100 rounded"></div>
        </div>
      </div>
    ),
  },
  {
    tag: "New",
    tagColor: "bg-blue-500 text-white",
    title: "Data & Analytics Interviews",
    author: "Learnova",
    rating: 4.8,
    reviews: "930",
    duration: "20h",
    level: "Intermediate",
    headerBg: "bg-gradient-to-br from-teal-100 via-emerald-100 to-cyan-100",
    illustration: (
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="w-28 h-24 bg-white rounded-xl shadow-md p-3 border border-teal-200 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <PieChart className="w-6 h-6 text-teal-600" />
            <div className="text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">Python</div>
          </div>
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-teal-100 rounded"></div>
            <div className="h-1.5 w-4/5 bg-teal-200 rounded"></div>
            <div className="h-1.5 w-3/5 bg-teal-400 rounded"></div>
          </div>
        </div>
      </div>
    ),
  },
];

const topics = [
  { label: "Behavioral Questions", count: 120 },
  { label: "Technical Skills", count: 86 },
  { label: "Communication", count: 64 },
  { label: "Problem Solving", count: 45 },
  { label: "Strategic Thinking", count: 95 },
];

const topicGrid = [
  { label: "AI Mock Interviews", count: 120, icon: Bot, color: "bg-purple-100 text-purple-600" },
  { label: "Case Interviews", count: 86, icon: TrendingUp, color: "bg-emerald-100 text-emerald-600" },
  { label: "Presentation Skills", count: 64, icon: Camera, color: "bg-orange-100 text-orange-600" },
  { label: "Written Responses", count: 95, icon: PenTool, color: "bg-blue-100 text-blue-600" },
];

const valueProps = [
  { icon: Globe, label: "Text & Voice Interviews", desc: "Practice through chat or your voice.", color: "bg-purple-500 text-white" },
  { icon: Users, label: "Adaptive Questions", desc: "Follow-ups that adapt to your responses.", color: "bg-orange-500 text-white" },
  { icon: Award, label: "Structured Evaluation", desc: "Performance scored against clear rubrics.", color: "bg-emerald-500 text-white" },
  { icon: GraduationCap, label: "Personalized Feedback", desc: "Actionable advice on what to improve next.", color: "bg-pink-500 text-pink-600" },
];

export default function Landing() {
  const [activeCategory, setActiveCategory] = useState("Behavioral Questions");
  const [activeTopic, setActiveTopic] = useState("Behavioral Questions");

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-[#faf8f5] overflow-x-hidden font-sans text-slate-800"
    >
      {/* ── Header / Navigation ── */}
      <nav className="sticky top-0 z-50 bg-[#faf8f5]/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-1.5">
              <span className="text-3xl font-extrabold text-indigo-950 tracking-tight">Learnova</span>
              <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
            </Link>
          </div>

          {/* Search bar */}
          <div className="hidden lg:flex items-center relative max-w-md w-full mx-8">
            <div className="absolute left-4 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search skills, interviews, and topics..."
              className="w-full bg-[#f3ede8] border-none rounded-full py-2.5 pl-11 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-700">
            <Link to="/" className="hover:text-purple-600 transition-colors">Home</Link>
            <a href="#how-it-works" className="hover:text-purple-600 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-purple-600 transition-colors">Features</a>
            <a href="#ai-interviews" className="hover:text-purple-600 transition-colors">AI Interviews</a>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-full px-5">
                Log In
              </Button>
            </Link>                <Link to="/auth">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-full px-6 py-2 shadow-md shadow-purple-200">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-6 pb-16">
        <div className="mx-auto max-w-7xl px-8">
          <div className="grid gap-12 lg:grid-cols-12 items-center">
            {/* Left: Text & CTA */}
            <div className="lg:col-span-6 space-y-6">
              <motion.h1
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="text-5xl lg:text-[4rem] font-extrabold tracking-tight leading-[1.08] text-slate-900"
              >
                Learn Smarter.
                <br />
                Practice Better.
                <br />
                Interview With{" "}
                <span className="text-purple-600 relative inline-block">
                  Confidence.
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 160 14" fill="none">
                    <path d="M3 10 Q 80 2, 157 8" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-lg text-slate-600 max-w-md font-medium leading-relaxed"
              >
                Learnova combines personalized learning, AI-powered assessments, targeted practice, and realistic mock interviews to help you identify your weaknesses, build your skills, and become interview-ready.
              </motion.p>

              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center gap-4 pt-2"
              >
                <Link to="/practice">
                  <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-full px-8 py-6 shadow-lg shadow-purple-200 gap-3 text-base">
                    Start Learning Free
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <button className="flex items-center gap-3 px-6 py-3 rounded-full hover:bg-[#f3ede8] transition-colors font-bold text-slate-700 text-base">
                    <div className="w-10 h-10 rounded-full border border-purple-300 flex items-center justify-center text-purple-600 bg-white shadow-sm">
                      <Play className="w-4 h-4 fill-purple-600 ml-0.5" />
                    </div>
                    Explore How It Works
                  </button>
                </a>
              </motion.div>

              {/* Stat Chips */}
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-center gap-10 pt-8"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-slate-900">Assess</p>
                    <p className="text-xs font-semibold text-slate-500">AI assessments</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-slate-900">Practice</p>
                    <p className="text-xs font-semibold text-slate-500">Text & voice</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-200">
                    <Star className="w-6 h-6 fill-amber-400" />
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-slate-900">Improve</p>
                    <p className="text-xs font-semibold text-slate-500">Instant feedback</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right: Graphic Card inside Arch */}
            <div className="lg:col-span-6 relative flex justify-center py-6">
              <div className="relative w-[420px] h-[480px] bg-amber-400 rounded-t-full rounded-b-[140px] p-3 flex flex-col justify-end shadow-2xl">
                <div className="w-full h-full bg-[#e6ded6] rounded-t-full rounded-b-[130px] overflow-hidden relative flex items-end justify-center">
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-100/50 to-transparent"></div>
                  <div className="relative z-10 w-64 h-80 flex flex-col items-center">
                    <div className="w-24 h-32 bg-[#e0ac69] rounded-b-full rounded-t-2xl relative mb-[-10px] shadow-sm">
                      <div className="absolute -top-3 -left-4 -right-4 h-24 bg-amber-950 rounded-t-full rounded-b-xl"></div>
                      <div className="absolute top-12 left-2 right-2 flex justify-between z-20">
                        <div className="w-8 h-8 rounded-full border-4 border-slate-900 bg-white/20"></div>
                        <div className="w-8 h-8 rounded-full border-4 border-slate-900 bg-white/20"></div>
                      </div>
                      <div className="absolute bottom-5 left-8 right-8 h-2 border-b-2 border-slate-800 rounded-full"></div>
                    </div>
                    <div className="w-56 h-52 bg-emerald-700 rounded-t-[50px] shadow-inner flex flex-col items-center pt-4">
                      <div className="w-full h-20 bg-amber-900/40 mt-auto rounded-t-xl flex items-center justify-center text-white text-xs font-bold">
                        [ AI Interview Ready ]
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute top-6 right-0 bg-white/95 backdrop-blur rounded-2xl shadow-xl p-3.5 flex items-center gap-3 border border-slate-100 z-20 max-w-xs">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">AI Mock Interviews</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Practice through text or voice, anytime.</p>
                </div>
              </div>

              <div className="absolute bottom-10 left-0 bg-white/95 backdrop-blur rounded-2xl shadow-xl p-3.5 flex items-center gap-3 border border-slate-100 z-20 max-w-xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Interview Readiness</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Know exactly where you stand.</p>
                </div>
              </div>

              <div className="absolute -bottom-4 right-10 w-24 h-14 bg-emerald-600 rounded-t-full shadow-lg z-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works Section (anchor target) ── */}
      <section id="how-it-works" className="py-12">
        <div className="mx-auto max-w-7xl px-8">
          <div className="rounded-3xl bg-purple-600 p-8 text-white text-center">
            <h2 className="text-2xl font-extrabold mb-4">One Platform. One Continuous Learning Loop.</h2>
            <p className="text-purple-100 font-medium max-w-2xl mx-auto">
              Assess → Diagnose → Practice → Simulate → Improve — one continuous loop that gets you interview-ready.
            </p>
            <div className="grid grid-cols-3 gap-6 mt-8">
              <div className="bg-white/10 rounded-2xl p-5">
                <div className="text-2xl font-extrabold mb-2">1</div>
                <p className="text-sm font-semibold">Assess & Diagnose</p>
                <p className="text-xs text-purple-200 mt-1">Measure your skills with AI assessments and pinpoint what to improve</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-5">
                <div className="text-2xl font-extrabold mb-2">2</div>
                <p className="text-sm font-semibold">Practice & Simulate</p>
                <p className="text-xs text-purple-200 mt-1">Target your gaps with practice and realistic AI mock interviews</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-5">
                <div className="text-2xl font-extrabold mb-2">3</div>
                <p className="text-sm font-semibold">Improve</p>
                <p className="text-xs text-purple-200 mt-1">Get actionable feedback and track your readiness as you grow</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Strip ── */}
      <section id="features" className="py-6">
        <div className="mx-auto max-w-7xl px-8">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none justify-between">
            {features.map((ct) => {
              const Icon = ct.icon;
              const isSelected = activeCategory === ct.label;
              return (
                <div
                  key={ct.label}
                  onClick={() => setActiveCategory(ct.label)}
                  className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl transition-all cursor-pointer shrink-0 shadow-sm ${isSelected ? "bg-purple-600 text-white shadow-md" : "bg-[#f3ede8] hover:bg-[#e8dfd7] text-slate-800"
                    }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? "bg-white/20 text-white" : ct.bg}`}>
                    <Icon className={`w-4 h-4 ${isSelected ? "text-white" : ct.color}`} />
                  </div>
                  <span className="text-sm font-extrabold">{ct.label}</span>
                </div>
              );
            })}
            <Link to="/practice" className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-slate-700 shrink-0 hover:bg-slate-50">
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Popular Cases Grid with Direct Navigation Links ── */}
      <section id="courses" className="py-12">
        <div className="mx-auto max-w-7xl px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Popular Practice Tracks<span className="text-purple-600">*</span>
              </h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Practice tracks for every stage of your interview prep</p>
            </div>
            <Link to="/practice">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#f3ede8] text-purple-700 hover:bg-purple-100 text-xs font-extrabold transition-colors">
                View All Practice
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {popularCases.map((c) => (
              <Link
                key={c.title}
                to="/cases/case-1"
                className="rounded-3xl bg-white p-3.5 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer"
              >
                <div>
                  <div className={`h-44 rounded-2xl ${c.headerBg} relative overflow-hidden mb-3 border border-slate-100`}>
                    <span className={`absolute top-3 left-3 text-[10px] font-extrabold px-3 py-1 rounded-full shadow-sm ${c.tagColor}`}>
                      {c.tag}
                    </span>
                    {c.illustration}
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 leading-snug mb-2">{c.title}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-purple-200 text-purple-700 text-[10px] font-bold flex items-center justify-center">
                      {c.author[0]}
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{c.author}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="text-slate-900 font-extrabold">{c.rating}</span>
                    <span className="text-slate-400 font-medium">({c.reviews})</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{c.duration}</span>
                  </div>
                  <span className="text-slate-400 font-medium">{c.level}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Learn by Topic Section with Interactive Tabs ── */}
      <section id="topics" className="py-12">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Practice by Skill Area<span className="text-purple-600">*</span>
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Targeted practice mapped to your assessment results</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* Topic List */}
            <div className="lg:col-span-3 rounded-3xl bg-[#f3ede8] p-4 flex flex-col gap-2 shadow-sm">
              {topics.map((t) => {
                const isSelected = activeTopic === t.label;
                return (
                  <div
                    key={t.label}
                    onClick={() => setActiveTopic(t.label)}
                    className={`flex items-center justify-between px-4 py-3.5 rounded-2xl cursor-pointer transition-all ${isSelected ? "bg-white shadow-sm text-slate-900 font-extrabold" : "text-slate-600 font-semibold hover:bg-white/60"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className={`w-4 h-4 ${isSelected ? "text-purple-600" : "text-slate-400"}`} />
                      <span className="text-sm">{t.label}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? "text-purple-600" : "text-slate-400"}`} />
                  </div>
                );
              })}
            </div>

            {/* Green Hero CTA Box */}
            <div className="lg:col-span-4 rounded-3xl bg-emerald-500 p-8 text-white flex flex-col justify-between relative overflow-hidden shadow-xl min-h-[300px]">
              <div className="relative z-10">
                <h3 className="text-3xl font-extrabold leading-tight mb-4">
                  Preparing Isn't Enough. <br />
                  You Need to Know <br />
                  What to Improve.
                </h3>
              </div>

              <div className="absolute bottom-4 right-4 z-0 opacity-90">
                <div className="w-28 h-20 relative">
                  <div className="w-16 h-10 bg-purple-600 rounded-sm transform rotate-[15deg] shadow-lg relative flex items-center justify-center">
                    <div className="w-4 h-4 bg-amber-400 rounded-full"></div>
                  </div>
                  <div className="w-20 h-4 bg-amber-400 rounded-sm mt-2 shadow"></div>
                  <div className="w-22 h-4 bg-purple-300 rounded-sm mt-1 shadow"></div>
                </div>
              </div>

              <div className="relative z-10">
                <Link to="/practice">
                  <button className="bg-white text-slate-900 font-extrabold px-6 py-3 rounded-full text-xs hover:bg-slate-100 transition-colors shadow-md flex items-center gap-2">
                    Start Practicing
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            </div>

            {/* 2x2 Grid Topics */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              {topicGrid.map((t) => {
                const Icon = t.icon;
                return (
                  <Link
                    key={t.label}
                    to="/practice"
                    className="rounded-3xl bg-[#f3ede8] p-5 flex flex-col justify-between hover:bg-[#e8dfd7] transition-all cursor-pointer shadow-sm"
                  >
                    <div>
                      <h4 className="font-extrabold text-base text-slate-900 leading-snug mb-1">{t.label}</h4>
                      <p className="text-xs font-semibold text-slate-500">{t.count} Modules</p>
                    </div>
                    <div className="flex justify-end mt-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t.color} shadow-sm`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── AI Interview Highlights ── */}
      <section id="ai-interviews" className="py-12 my-6">
        <div className="mx-auto max-w-7xl px-8">
          <div className="rounded-3xl bg-[#f3ede8] p-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
            {valueProps.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.label} className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${v.color}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{v.label}</h4>
                    <p className="text-xs font-medium text-slate-500 leading-tight mt-0.5">{v.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>    </motion.div>
  );
}
