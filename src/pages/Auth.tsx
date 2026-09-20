import { useRef, useState } from "react";
import { useNavigate, Link, useLocation, Navigate } from "react-router";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Target, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2, Sparkles, Brain, TrendingUp, Briefcase } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Checkbox } from "@/components/ui/checkbox";
import { TERMS_URL, PRIVACY_URL, isExternalUrl } from "@/lib/legal";

type Mode = "login" | "signup";

/** Opens in a new tab when the document lives off-site, otherwise routes. */
function LegalLink({ to, children }: { to: string; children: React.ReactNode }) {
  const className =
    "font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-800";
  if (isExternalUrl(to)) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} target="_blank" className={className}>
      {children}
    </Link>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const { signIn, signUp, isAuthenticated, isLoading } = useAuth();

  const from: string = location.state?.from || "/dashboard";

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Consent starts UNCHECKED — a pre-ticked box is not valid consent.
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  // Where the in-flight submit intends to land; the declarative redirect below
  // reads it so signup → /setup and login → /dashboard without a flash.
  const intendedPath = useRef<string | null>(null);

  // Declarative redirect — navigating during render would trigger an
  // infinite re-render loop (React error #185 "Maximum update depth").
  if (!isLoading && isAuthenticated) {
    return <Navigate to={intendedPath.current ?? from} replace />;
  }

  const toggleMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setSuccess(null);
    setTermsError(false);
  };

  const consentMissing = mode === "signup" && !acceptedTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        const res = await signIn(email, password);
        if (res?.error) {
          setError(res.error);
          return;
        }
        setSuccess("Welcome back!");
        intendedPath.current = "/dashboard";
        setTimeout(() => navigate("/dashboard", { replace: true }), 300);
        return;
      }
      // Validate consent before hitting the network so the failure is inline
      // and immediate. The backend enforces the same rule independently, so
      // this is UX, not the security boundary.
      if (consentMissing) {
        setTermsError(true);
        return;
      }
      const res = await signUp(name || email.split("@")[0], email, password, {
        terms: acceptedTerms,
        privacy: acceptedTerms,
      });
      if (res?.error) {
        setError(res.error);
        return;
      }
      setSuccess("Account created successfully");
      intendedPath.current = "/setup";
      setTimeout(() => navigate("/setup", { replace: true }), 300);
    } finally {
      setSubmitting(false);
    }
  };

  const perks = [
    { icon: Brain, title: "AI Tutor & Quiz", desc: "Learn any topic, then prove it with generated quizzes" },
    { icon: TrendingUp, title: "Readiness Score", desc: "Track your progress toward interview readiness" },
    { icon: Briefcase, title: "Resume-Aware Interviews", desc: "Mock interviews grounded in your real experience" },
  ];

  const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden">
      {/* Left hero panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-blue-950 to-violet-950 text-white p-12 flex-col overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-[520px] h-[520px] rounded-full bg-blue-400 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-[520px] h-[520px] rounded-full bg-violet-400 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
            <Target className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">Learnova</span>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } }}
          className="relative z-10 mt-16 max-w-lg"
        >
          <motion.div variants={fadeUp}>
            <Badge className="bg-white/10 text-white/90 ring-1 ring-white/20 backdrop-blur px-3 py-1">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-300" />
              Learn, practise, and get interview-ready
            </Badge>
          </motion.div>
          <motion.h1 variants={fadeUp} className="mt-6 text-5xl font-extrabold tracking-tight leading-[1.05]">
            Learn anything. Then prove it.
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-5 text-lg text-white/80 leading-relaxed">
            AI tutoring, quizzes, practice, and mock interviews — all in one place.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-12 space-y-5">
            {perks.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur ring-1 ring-white/10">
                <div className="mt-0.5 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-white/75 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <div className="relative z-10 mt-auto pt-12 text-sm text-white/60">
          <Link to="/" className="hover:text-white/90 transition-colors">&larr; Back to home</Link>
        </div>
      </div>

      {/* Right auth form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">Learnova</span>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-slate-500 mt-1.5">
                {mode === "login"
                  ? "Sign in to pick up where you left off."
                  : "Start practicing in under 60 seconds."}
              </p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="p-1 mb-7 bg-slate-100 rounded-2xl grid grid-cols-2">
            <button
              type="button"
              onClick={() => toggleMode("login")}
              className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === "login"
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => toggleMode("signup")}
              className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === "signup"
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-slate-700">Full name</Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Chen"
                  className="h-12 rounded-xl border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  required={mode === "signup"}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete={mode === "login" ? "username" : "email"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@firm.com"
                className="h-12 rounded-xl border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  className="h-12 rounded-xl border-slate-200 bg-white pr-12 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                  tabIndex={-1}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="legal-consent"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => {
                      setAcceptedTerms(checked === true);
                      if (checked === true) setTermsError(false);
                    }}
                    aria-describedby={termsError ? "legal-consent-error" : undefined}
                    aria-invalid={termsError}
                    className="mt-0.5 size-5 shrink-0 rounded-md border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <label
                    htmlFor="legal-consent"
                    className="text-sm leading-relaxed text-slate-600 cursor-pointer select-none"
                  >
                    I agree to the <LegalLink to={TERMS_URL}>Terms &amp; Conditions</LegalLink> and
                    the <LegalLink to={PRIVACY_URL}>Privacy Policy</LegalLink>.
                  </label>
                </div>
                {termsError && (
                  <p
                    id="legal-consent-error"
                    role="alert"
                    className="flex items-start gap-2 text-sm text-red-700"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Please accept the Terms &amp; Conditions and Privacy Policy to create your
                      account.
                    </span>
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 ring-1 ring-red-100 text-red-700 px-4 py-3 text-sm">
                <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 text-emerald-700 px-4 py-3 text-sm">
                <CheckCircle2 className="w-4.5 h-4.5 mt-0.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting || isLoading || consentMissing}
              aria-disabled={submitting || isLoading || consentMissing}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting
                ? "Please wait…"
                : mode === "login"
                ? "Sign in"
                : "Create account"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => toggleMode("signup")}
                  className="font-semibold text-blue-700 hover:text-blue-800"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => toggleMode("login")}
                  className="font-semibold text-blue-700 hover:text-blue-800"
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          <div className="lg:hidden mt-10 text-center text-xs text-slate-400">
            <Link to="/" className="hover:text-slate-600">&larr; Back to Learnova home</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
