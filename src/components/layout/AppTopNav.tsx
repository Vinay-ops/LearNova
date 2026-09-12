import { Link, useLocation, useNavigate } from "react-router";
import { LayoutDashboard, BookOpen, ClipboardList, TrendingUp, Briefcase, Settings, User, Menu, X, Target, LogOut, GraduationCap, Mic, History } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

const navLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/learn", label: "Learn", icon: GraduationCap },
  { to: "/practice", label: "Practice", icon: BookOpen },
  { to: "/interview", label: "AI Interviews", icon: Mic },
  { to: "/interviews", label: "My Interviews", icon: History },
  { to: "/assessments", label: "Assessments", icon: ClipboardList },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/applications", label: "Applications", icon: Briefcase },
];

export function AppTopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayName = profile?.name?.split(" ")[0] || user?.name?.split(" ")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [profileOpen]);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      {/* Width matches AppLayout's content column so the nav lines up with the
          page below it. */}
      <div className="mx-auto max-w-[1400px] px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center shadow-md shadow-purple-200">
            <Target className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">Learnova</span>
        </Link>

        {/* Desktop Nav Links — the 8 items measure ~952px plus ~300px of
            logo/profile chrome, so they need a ~1335px viewport. Collapse to the
            hamburger below 1340px (same pattern, wider threshold) so links never
            wrap or push the profile cluster off-screen. The inner track scrolls
            horizontally only if the row is ever wider than the space available. */}
        <div className="hidden min-[1340px]:flex flex-1 min-w-0 justify-center">
          <div className="flex max-w-full items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? "bg-purple-50 text-purple-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? "text-purple-600" : "text-slate-400"}`} />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Settings + Profile */}
        <div className="hidden min-[1340px]:flex items-center gap-2 shrink-0">
          <Link
            to="/settings"
            className={`p-2 rounded-xl transition-all ${
              isActive("/settings")
                ? "bg-purple-50 text-purple-700"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Settings className="w-5 h-5" />
          </Link>

          {/* Profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-50 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                {initial}
              </div>
              <span className="text-sm font-semibold text-slate-700">{displayName}</span>
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  onClick={() => setProfileOpen(false)}
                >
                  <User className="w-4 h-4 text-slate-400" />
                  View Profile
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  onClick={() => setProfileOpen(false)}
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Settings
                </Link>
                <div className="h-px bg-slate-100 my-1 mx-2" />
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                  onClick={() => {
                    setProfileOpen(false);
                    signOut();
                    navigate("/auth", { replace: true });
                  }}
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          className="min-[1340px]:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-50"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="min-[1340px]:hidden border-t border-slate-100 bg-white px-4 py-3 flex flex-col gap-1">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? "bg-purple-50 text-purple-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-purple-600" : "text-slate-400"}`} />
                {label}
              </Link>
            );
          })}
          <div className="h-px bg-slate-100 my-1" />
          <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
            <User className="w-4 h-4 text-slate-400" /> Profile
          </Link>
          <Link to="/settings" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
            <Settings className="w-4 h-4 text-slate-400" /> Settings
          </Link>
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              signOut();
              navigate("/auth", { replace: true });
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 text-red-400" /> Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
