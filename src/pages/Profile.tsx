import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pencil, Target, Calendar, GraduationCap, Building2, TrendingUp } from "lucide-react";
import { userProfile } from "@/data/mock-data";

function getDaysUntil(dateStr: string) {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Profile() {
  const daysLeft = getDaysUntil(userProfile.interviewDate);

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile and preparation preferences.
        </p>
      </div>

      {/* Profile header — inline, not in a card */}
      <div className="flex items-center gap-4 mb-8 pb-8 border-b">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
            AC
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-lg font-bold">Alex Chen</h2>
          <p className="text-sm text-muted-foreground">{userProfile.email}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </div>

      {/* Stats strip */}
      <div className="flex items-center gap-10 mb-8 pb-8 border-b">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
            Readiness
          </p>
          <p className="text-3xl font-bold tabular-nums">{userProfile.readinessScore}<span className="text-base font-normal text-muted-foreground">/100</span></p>
        </div>
        <Separator orientation="vertical" className="h-10" />
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
            Interview
          </p>
          <p className="text-3xl font-bold tabular-nums">{daysLeft}<span className="text-base font-normal text-muted-foreground ml-1">days</span></p>
        </div>
      </div>

      {/* Details — simple data rows */}
      <div className="space-y-0 rounded-xl border bg-card overflow-hidden">
        {[
          { icon: Building2, label: "Target Firms", value: userProfile.targetFirms.join(", ") },
          { icon: Target, label: "Target Role", value: "BCG Associate" },
          { icon: GraduationCap, label: "Experience", value: userProfile.experienceLevel },
          { icon: Calendar, label: "Interview Date", value: new Date(userProfile.interviewDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50 last:border-0">
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground w-36 shrink-0">{item.label}</span>
              <span className="text-sm font-medium">{item.value}</span>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
