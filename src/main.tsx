import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { RequireAuth } from "@/components/RequireAuth";
import "./index.css";

const Landing = lazy(() => import("./pages/Landing.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Learn = lazy(() => import("./pages/Learn.tsx"));
const Practice = lazy(() => import("./pages/Practice.tsx"));
const AIInterview = lazy(() => import("./pages/AIInterview.tsx"));
const InterviewHistory = lazy(() => import("./pages/InterviewHistory.tsx"));
const CaseDetails = lazy(() => import("./pages/CaseDetails.tsx"));
const CaseSimulator = lazy(() => import("./pages/CaseSimulator.tsx"));
const CaseFeedback = lazy(() => import("./pages/CaseFeedback.tsx"));
const Assessments = lazy(() => import("./pages/Assessments.tsx"));
const AssessmentTaking = lazy(() => import("./pages/AssessmentTaking.tsx"));
const AssessmentResults = lazy(() => import("./pages/AssessmentResults.tsx"));
const Progress = lazy(() => import("./pages/Progress.tsx"));
const Applications = lazy(() => import("./pages/Applications.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center animate-pulse">
          <div className="h-4 w-4 rounded-lg bg-primary/60" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[Preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="min-h-screen"
      >
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />

          <Route
            path="/setup"
            element={
              <RequireAuth>
                <ProfileSetup />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/practice"
            element={
              <RequireAuth>
                <Practice />
              </RequireAuth>
            }
          />
          <Route
            path="/learn"
            element={
              <RequireAuth>
                <Learn />
              </RequireAuth>
            }
          />
          <Route
            path="/interview"
            element={
              <RequireAuth>
                <AIInterview />
              </RequireAuth>
            }
          />
          <Route
            path="/interviews"
            element={
              <RequireAuth>
                <InterviewHistory />
              </RequireAuth>
            }
          />
          <Route
            path="/cases/:id/details"
            element={
              <RequireAuth>
                <CaseDetails />
              </RequireAuth>
            }
          />
          <Route
            path="/cases/:id"
            element={
              <RequireAuth>
                <CaseSimulator />
              </RequireAuth>
            }
          />
          <Route
            path="/cases/:id/feedback"
            element={
              <RequireAuth>
                <CaseFeedback />
              </RequireAuth>
            }
          />
          <Route
            path="/assessments"
            element={
              <RequireAuth>
                <Assessments />
              </RequireAuth>
            }
          />
          <Route
            path="/assessments/:id"
            element={
              <RequireAuth>
                <AssessmentTaking />
              </RequireAuth>
            }
          />
          <Route
            path="/assessments/:id/results"
            element={
              <RequireAuth>
                <AssessmentResults />
              </RequireAuth>
            }
          />
          <Route
            path="/progress"
            element={
              <RequireAuth>
                <Progress />
              </RequireAuth>
            }
          />
          <Route
            path="/applications"
            element={
              <RequireAuth>
                <Applications />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <RouteSyncer />
          <Suspense fallback={<RouteLoading />}>
            <AnimatedRoutes />
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
      <Toaster />
    </RootErrorBoundary>
  </StrictMode>,
);
