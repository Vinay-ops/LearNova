import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Palette,
  Bell,
  Shield,
  Bot,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const TARGET_FIRMS = ["McKinsey", "BCG", "Bain", "Deloitte", "Accenture", "Kearney", "Other"];

function loadSettings(userId: string) {
  try {
    const raw = localStorage.getItem(`settings_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return {
    notifications: { practiceReminders: true, streakAlerts: true, newContent: true, weeklyProgress: true },
    defaultDifficulty: "All",
    targetFirms: [] as string[],
  };
}

function saveSettings(userId: string, settings: any) {
  localStorage.setItem(`settings_${userId}`, JSON.stringify(settings));
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, profile, signOut, updateProfile } = useAuth();
  const userId = user?.id || "";
  const savedSettings = loadSettings(userId);

  const [name, setName] = useState(profile?.name || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [notifications, setNotifications] = useState(savedSettings.notifications);
  const [defaultDifficulty, setDefaultDifficulty] = useState(savedSettings.defaultDifficulty);
  const [targetFirms, setTargetFirms] = useState(savedSettings.targetFirms);
  const [saved, setSaved] = useState(false);

  const displayName = profile?.name || user?.name || "User";
  const initial = displayName.charAt(0).toUpperCase();

  const handleSaveAccount = () => {
    updateProfile({ name: name.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveNotifications = () => {
    saveSettings(userId, { notifications, defaultDifficulty, targetFirms });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSavePreferences = () => {
    saveSettings(userId, { notifications, defaultDifficulty, targetFirms });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    signOut();
    navigate("/auth");
  };

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleFirm = (firm: string) => {
    setTargetFirms((prev: string[]) =>
      prev.includes(firm) ? prev.filter((f: string) => f !== firm) : [...prev, firm]
    );
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your account and preferences.
        </p>
      </div>

      <Tabs defaultValue="account">
        <TabsList className="bg-white border border-border/50 rounded-2xl p-1 h-auto gap-1 mb-6">
          <TabsTrigger value="account" className="gap-1.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
            <User className="h-3.5 w-3.5" />
            Account
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
            <Palette className="h-3.5 w-3.5" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
            <Bell className="h-3.5 w-3.5" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-1.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
            <Shield className="h-3.5 w-3.5" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
            <Bot className="h-3.5 w-3.5" />
            AI Preferences
          </TabsTrigger>
        </TabsList>

        {/* Account */}
        <TabsContent value="account">
          <div className="space-y-5">
            {/* Profile card */}
            <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-xl shadow-slate-200/50">
              <div className="px-6 py-4 border-b border-border/40 bg-muted/20">
                <p className="font-semibold text-sm">Profile</p>
                <p className="text-xs text-muted-foreground mt-0.5">Update your personal information.</p>
              </div>
              <div className="p-6 space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/15 text-primary text-xl font-bold">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{email}</p>
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      className="rounded-xl border-border/60 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl border-border/60">Cancel</Button>
                  <Button size="sm" className="rounded-xl shadow-sm" onClick={handleSaveAccount}>
                    {saved ? "Saved!" : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Danger zone */}
            <div className="rounded-3xl border border-red-200/60 bg-red-50/50 overflow-hidden shadow-xl shadow-slate-200/50">
              <div className="px-6 py-4 border-b border-red-200/40">
                <p className="font-semibold text-sm text-red-700">Danger Zone</p>
              </div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Log Out</p>
                  <p className="text-xs text-muted-foreground">Sign out of your account.</p>
                </div>
                <Button variant="destructive" size="sm" className="rounded-xl" onClick={handleLogout}>Log Out</Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance">
          <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-xl shadow-slate-200/50">
            <div className="px-6 py-4 border-b border-border/40 bg-muted/20">
              <p className="font-semibold text-sm">Appearance</p>
              <p className="text-xs text-muted-foreground mt-0.5">Customise how CasePilot looks.</p>
            </div>
            <div className="p-6 space-y-5">
              {[
                { title: "Dark Mode", desc: "Toggle between light and dark appearance." },
                { title: "Compact View", desc: "Reduce spacing for more content density." },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch />
                </div>
              ))}
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
                { key: "newContent" as const, title: "New Content", desc: "Alerts when new cases or drills are available." },
                { key: "weeklyProgress" as const, title: "Weekly Progress", desc: "Weekly summary of your preparation progress." },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key]}
                    onCheckedChange={() => toggleNotif(item.key)}
                  />
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 flex justify-end">
              <Button size="sm" className="rounded-xl shadow-sm" onClick={handleSaveNotifications}>
                {saved ? "Saved!" : "Save Changes"}
              </Button>
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
                { title: "Show Profile on Leaderboard", desc: "Display your name and score publicly." },
                { title: "Share Analytics", desc: "Help improve CasePilot with anonymized data." },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* AI Preferences */}
        <TabsContent value="ai">
          <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-xl shadow-slate-200/50">
            <div className="px-6 py-4 border-b border-border/40 bg-muted/20">
              <p className="font-semibold text-sm">AI Preferences</p>
              <p className="text-xs text-muted-foreground mt-0.5">Configure your AI interviewer behaviour.</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium">Interviewer Style</p>
                  <p className="text-xs text-muted-foreground">Tone and difficulty of the AI interviewer.</p>
                </div>
                <select className="rounded-xl border border-border/60 bg-background px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none">
                  <option>Standard</option>
                  <option>Challenging</option>
                  <option>Supportive</option>
                </select>
              </div>
              <Separator />
              {[
                { title: "Auto-advance Questions", desc: "Move to next question after responding." },
                { title: "Voice Input", desc: "Enable voice responses during interviews." },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Default Difficulty + Target Firms (persistent settings) */}
        <TabsContent value="notifications">
          <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-xl shadow-slate-200/50 mt-4">
            <div className="px-6 py-4 border-b border-border/40 bg-muted/20">
              <p className="font-semibold text-sm">Practice Preferences</p>
              <p className="text-xs text-muted-foreground mt-0.5">Set default difficulty and target firms.</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Default Difficulty</Label>
                <select
                  value={defaultDifficulty}
                  onChange={(e) => setDefaultDifficulty(e.target.value as typeof defaultDifficulty)}
                  className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
                >
                  <option value="All">All Levels</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Target Firms</Label>
                <div className="flex flex-wrap gap-2">
                  {TARGET_FIRMS.map((firm) => {
                    const selected = targetFirms.includes(firm);
                    return (
                      <button
                        key={firm}
                        onClick={() => toggleFirm(firm)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                          selected
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-purple-300"
                        )}
                      >
                        {firm}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end">
                <Button size="sm" className="rounded-xl shadow-sm" onClick={handleSavePreferences}>
                  {saved ? "Saved!" : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
