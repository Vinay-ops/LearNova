import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Palette, Bell, Shield, Bot, SlidersHorizontal } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const TARGET_FIRMS = ["McKinsey", "BCG", "Bain", "Deloitte", "Accenture", "Kearney", "Other"];

interface UserSettings {
  notifications: { practiceReminders: boolean; streakAlerts: boolean; newContent: boolean; weeklyProgress: boolean };
  appearance: { darkMode: boolean; compactView: boolean };
  privacy: { leaderboard: boolean; analytics: boolean };
  ai: { interviewerStyle: string; autoAdvance: boolean; voiceInput: boolean };
  defaultDifficulty: string;
  targetFirms: string[];
}

const DEFAULTS: UserSettings = {
  notifications: { practiceReminders: true, streakAlerts: true, newContent: true, weeklyProgress: true },
  appearance: { darkMode: false, compactView: false },
  privacy: { leaderboard: false, analytics: false },
  ai: { interviewerStyle: "Standard", autoAdvance: false, voiceInput: false },
  defaultDifficulty: "All",
  targetFirms: [],
};

function loadSettings(userId: string): UserSettings {
  if (!userId) return DEFAULTS;
  try {
    const raw = localStorage.getItem(`settings_${userId}`);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed, notifications: { ...DEFAULTS.notifications, ...parsed.notifications } };
  } catch {
    return DEFAULTS;
  }
}

function mergeSettings(prev: UserSettings, patch: Partial<UserSettings>): UserSettings {
  const next = {
    ...prev,
    ...patch,
    notifications: { ...prev.notifications, ...(patch.notifications || {}) },
    appearance: { ...prev.appearance, ...(patch.appearance || {}) },
    privacy: { ...prev.privacy, ...(patch.privacy || {}) },
    ai: { ...prev.ai, ...(patch.ai || {}) },
  };
  return next;
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, profile, signOut, updateProfile } = useAuth();
  const userId = user?.id || "";

  const [settings, setSettings] = useState<UserSettings>(() => loadSettings(userId));
  const [name, setName] = useState(profile?.name || "");
  const [savedLabel, setSavedLabel] = useState<string | null>(null);

  const displayName = profile?.name || user?.name || "User";
  const initial = displayName.charAt(0).toUpperCase();

  // Apply persisted appearance on mount and whenever it changes.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", settings.appearance.darkMode);
    root.classList.toggle("compact", settings.appearance.compactView);
  }, [settings.appearance.darkMode, settings.appearance.compactView]);

  const persist = (next: UserSettings, label = "Saved") => {
    setSettings(next);
    if (userId) localStorage.setItem(`settings_${userId}`, JSON.stringify(next));
    setSavedLabel(label);
    window.setTimeout(() => setSavedLabel(null), 1800);
  };

  const flash = (label: string) => {
    setSavedLabel(label);
    window.setTimeout(() => setSavedLabel(null), 1800);
  };

  const handleSaveAccount = () => {
    updateProfile({ name: name.trim() }).then((res) => {
      flash(res?.error ? "Couldn't save" : "Saved!");
    });
  };

  const handleLogout = () => {
    signOut();
    navigate("/auth");
  };

  const toggleNotif = (key: keyof UserSettings["notifications"]) => {
    persist(mergeSettings(settings, { notifications: { [key]: !settings.notifications[key] } as any }));
  };

  const toggleFirm = (firm: string) => {
    const next = settings.targetFirms.includes(firm)
      ? settings.targetFirms.filter((f) => f !== firm)
      : [...settings.targetFirms, firm];
    persist(mergeSettings(settings, { targetFirms: next }));
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your account and preferences.</p>
      </div>

      {savedLabel && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-emerald-50 ring-1 ring-emerald-200/60 text-emerald-700 text-sm font-medium">
          {savedLabel}
        </div>
      )}

      <Tabs defaultValue="account">
        <TabsList className="bg-white border border-border/50 rounded-2xl p-1 h-auto gap-1 mb-6 flex-wrap">
          <TabsTrigger value="account" className="gap-1.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
            <User className="h-3.5 w-3.5" /> Account
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
            <Palette className="h-3.5 w-3.5" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
            <Bell className="h-3.5 w-3.5" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-1.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
            <Shield className="h-3.5 w-3.5" /> Privacy
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-1.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Preferences
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
            <Bot className="h-3.5 w-3.5" /> AI
          </TabsTrigger>
        </TabsList>

        {/* Account */}
        <TabsContent value="account">
          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-xl shadow-slate-200/50">
              <div className="px-6 py-4 border-b border-border/40 bg-muted/20">
                <p className="font-semibold text-sm">Profile</p>
                <p className="text-xs text-muted-foreground mt-0.5">Update your personal information.</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/15 text-primary text-xl font-bold">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email || ""}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Full Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-xl border-border/60 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Email</Label>
                    <Input
                      value={profile?.email || ""}
                      type="email"
                      disabled
                      className="rounded-xl border-border/60 bg-muted/40 opacity-70 focus:ring-0 cursor-not-allowed"
                    />
                    <p className="text-[11px] text-muted-foreground">Email changes aren't supported yet — it's your sign-in identifier.</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-border/60"
                    onClick={() => setName(profile?.name || "")}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" className="rounded-xl shadow-sm" onClick={handleSaveAccount}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-red-200/60 bg-red-50/50 overflow-hidden shadow-xl shadow-slate-200/50">
              <div className="px-6 py-4 border-b border-red-200/40">
                <p className="font-semibold text-sm text-red-700">Danger Zone</p>
              </div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Log Out</p>
                  <p className="text-xs text-muted-foreground">Sign out of your account.</p>
                </div>
                <Button variant="destructive" size="sm" className="rounded-xl" onClick={handleLogout}>
                  Log Out
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance">
          <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-xl shadow-slate-200/50">
            <div className="px-6 py-4 border-b border-border/40 bg-muted/20">
              <p className="font-semibold text-sm">Appearance</p>
              <p className="text-xs text-muted-foreground mt-0.5">Customise how Learnova looks. Changes apply immediately.</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Toggle between light and dark appearance.</p>
                </div>
                <Switch
                  checked={settings.appearance.darkMode}
                  onCheckedChange={(v) => persist(mergeSettings(settings, { appearance: { darkMode: v } } as any), v ? "Dark mode on" : "Dark mode off")}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium">Compact View</p>
                  <p className="text-xs text-muted-foreground">Reduce spacing for more content density.</p>
                </div>
                <Switch
                  checked={settings.appearance.compactView}
                  onCheckedChange={(v) => persist(mergeSettings(settings, { appearance: { compactView: v } } as any), v ? "Compact view on" : "Compact view off")}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-xl shadow-slate-200/50">
            <div className="px-6 py-4 border-b border-border/40 bg-muted/20">
              <p className="font-semibold text-sm">Notifications</p>
              <p className="text-xs text-muted-foreground mt-0.5">Choose what updates you receive.</p>
            </div>
            <div className="p-6 space-y-5">
              {[
                { key: "practiceReminders" as const, title: "Practice Reminders", desc: "Daily reminders to practice." },
                { key: "streakAlerts" as const, title: "Streak Alerts", desc: "Notifications when your streak is at risk." },
                { key: "newContent" as const, title: "New Content", desc: "Alerts when new quizzes, cases or drills are available." },
                { key: "weeklyProgress" as const, title: "Weekly Progress", desc: "Weekly summary of your preparation progress." },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch checked={settings.notifications[item.key]} onCheckedChange={() => toggleNotif(item.key)} />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Privacy */}
        <TabsContent value="privacy">
          <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-xl shadow-slate-200/50">
            <div className="px-6 py-4 border-b border-border/40 bg-muted/20">
              <p className="font-semibold text-sm">Privacy</p>
              <p className="text-xs text-muted-foreground mt-0.5">Control your data and visibility.</p>
            </div>
            <div className="p-6 space-y-5">
              {[
                { key: "leaderboard" as const, title: "Show Profile on Leaderboard", desc: "Display your name and score publicly." },
                { key: "analytics" as const, title: "Share Analytics", desc: "Help improve Learnova with anonymized data." },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={settings.privacy[item.key]}
                    onCheckedChange={(v) => persist(mergeSettings(settings, { privacy: { [item.key]: v } } as any))}
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Preferences (difficulty + target firms) */}
        <TabsContent value="preferences">
          <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-xl shadow-slate-200/50">
            <div className="px-6 py-4 border-b border-border/40 bg-muted/20">
              <p className="font-semibold text-sm">Practice Preferences</p>
              <p className="text-xs text-muted-foreground mt-0.5">Default difficulty for generated quizzes and interview prep targets.</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Default Difficulty</Label>
                <select
                  value={settings.defaultDifficulty}
                  onChange={(e) => persist(mergeSettings(settings, { defaultDifficulty: e.target.value }))}
                  className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
                >
                  <option value="All">All Levels</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Used as the starting difficulty when you generate a quiz on a new topic.
                </p>
              </div>
              <Separator />
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Target Firms</Label>
                <div className="flex flex-wrap gap-2">
                  {TARGET_FIRMS.map((firm) => {
                    const selected = settings.targetFirms.includes(firm);
                    return (
                      <button
                        key={firm}
                        onClick={() => toggleFirm(firm)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                          selected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                        )}
                      >
                        {firm}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* AI Preferences */}
        <TabsContent value="ai">
          <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-xl shadow-slate-200/50">
            <div className="px-6 py-4 border-b border-border/40 bg-muted/20">
              <p className="font-semibold text-sm">AI Preferences</p>
              <p className="text-xs text-muted-foreground mt-0.5">Configure your AI tutor and interviewer behaviour.</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between py-1 gap-4">
                <div>
                  <p className="text-sm font-medium">Interviewer Style</p>
                  <p className="text-xs text-muted-foreground">Tone of the AI interviewer.</p>
                </div>
                <select
                  value={settings.ai.interviewerStyle}
                  onChange={(e) => persist(mergeSettings(settings, { ai: { interviewerStyle: e.target.value } } as any))}
                  className="rounded-xl border border-border/60 bg-background px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
                >
                  <option>Standard</option>
                  <option>Challenging</option>
                  <option>Supportive</option>
                </select>
              </div>
              <Separator />
              {[
                { key: "autoAdvance" as const, title: "Auto-advance Questions", desc: "Move to the next interview question after you respond." },
                { key: "voiceInput" as const, title: "Voice Input", desc: "Enable voice responses during interviews when available." },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={settings.ai[item.key]}
                    onCheckedChange={(v) => persist(mergeSettings(settings, { ai: { [item.key]: v } } as any))}
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
