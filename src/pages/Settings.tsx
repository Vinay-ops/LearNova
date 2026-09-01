import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Palette,
  Bell,
  Shield,
  Bot,
} from "lucide-react";

export default function Settings() {
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences.
        </p>
      </div>

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account" className="gap-1.5">
            <User className="h-3.5 w-3.5" />
            Account
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5">
            <Palette className="h-3.5 w-3.5" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5">
            <Bot className="h-3.5 w-3.5" />
            AI Preferences
          </TabsTrigger>
        </TabsList>

        {/* Account */}
        <TabsContent value="account">
          <div className="rounded-xl border bg-card overflow-hidden mt-4">
            <div className="px-4 py-3.5 border-b border-border/50">
              <p className="font-semibold text-sm">Account</p>
              <p className="text-xs text-muted-foreground mt-0.5">Manage your account settings.</p>
            </div>
            <div className="p-4 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Full Name</Label>
                  <Input defaultValue="Alex Chen" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input defaultValue="alex.chen@email.com" type="email" />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Delete Account</p>
                  <p className="text-xs text-muted-foreground">Permanently delete your account and all data.</p>
                </div>
                <Button variant="destructive" size="sm">Delete</Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance">
          <div className="rounded-xl border bg-card overflow-hidden mt-4">
            <div className="px-4 py-3.5 border-b border-border/50">
              <p className="font-semibold text-sm">Appearance</p>
            </div>
            <div className="p-4 space-y-5">
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
          <div className="rounded-xl border bg-card overflow-hidden mt-4">
            <div className="px-4 py-3.5 border-b border-border/50">
              <p className="font-semibold text-sm">Notifications</p>
            </div>
            <div className="p-4 space-y-5">
              {[
                { title: "Practice Reminders", desc: "Daily reminders to practice." },
                { title: "Streak Alerts", desc: "Notifications when your streak is at risk." },
                { title: "New Content", desc: "Alerts when new cases or drills are available." },
                { title: "Weekly Progress", desc: "Weekly summary of your preparation progress." },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Privacy */}
        <TabsContent value="privacy">
          <div className="rounded-xl border bg-card overflow-hidden mt-4">
            <div className="px-4 py-3.5 border-b border-border/50">
              <p className="font-semibold text-sm">Privacy</p>
            </div>
            <div className="p-4 space-y-5">
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
          <div className="rounded-xl border bg-card overflow-hidden mt-4">
            <div className="px-4 py-3.5 border-b border-border/50">
              <p className="font-semibold text-sm">AI Preferences</p>
            </div>
            <div className="p-4 space-y-5">
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium">Interviewer Style</p>
                  <p className="text-xs text-muted-foreground">Tone and difficulty of the AI interviewer.</p>
                </div>
                <select className="rounded-md border bg-background px-3 py-1.5 text-sm">
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
      </Tabs>
    </AppLayout>
  );
}
