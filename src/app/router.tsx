import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { RouteLoading } from "@/app/_loading";

const Landing = lazy(() => import("../pages/Landing"));
const Auth = lazy(() => import("../pages/Auth"));
const ProfileSetup = lazy(() => import("../pages/ProfileSetup"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Practice = lazy(() => import("../pages/Practice"));
const CaseDetails = lazy(() => import("../pages/CaseDetails"));
const CaseSimulator = lazy(() => import("../pages/CaseSimulator"));
const CaseFeedback = lazy(() => import("../pages/CaseFeedback"));
const Assessments = lazy(() => import("../pages/Assessments"));
const AssessmentTaking = lazy(() => import("../pages/AssessmentTaking"));
const AssessmentResults = lazy(() => import("../pages/AssessmentResults"));
const Progress = lazy(() => import("../pages/Progress"));
const Applications = lazy(() => import("../pages/Applications"));
const Profile = lazy(() => import("../pages/Profile"));
const Settings = lazy(() => import("../pages/Settings"));
const NotFound = lazy(() => import("../pages/NotFound"));

export function AppRouter() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
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

export function RoutedApp() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <AppRouter />
    </Suspense>
  );
}
