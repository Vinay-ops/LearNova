import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Target, Calendar, GraduationCap, Building2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useProgress } from "@/hooks/use-progress";
import { motion } from "framer-motion";
import { FadeIn, StaggerList, StaggerItem } from "@/components/app/AnimatedSection";
import { cn } from "@/lib/utils";

const TARGET_FIRMS = ["McKinsey", "BCG", "Bain", "Deloitte", "Accenture", "Kearney", "Other"];

function getDaysUntil(dateStr: string | null) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Profile() {
  const { user, profile, updateProfile } = useAuth();
  const userId = user?.id || "";
  const { summary } = useProgress(userId || undefined);
  const readinessScore = summary?.readiness_score ?? 0;

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editFirms, setEditFirms] = useState<string[]>([]);
  const [editExperience, setEditExperience] = useState<string>("Beginner");
  const [editDate, setEditDate] = useState("");
  const [saved, setSaved] = useState(false);

  const displayName = profile?.name || user?.name || "User";
  const email = profile?.email || user?.email || "";
  const initial = displayName.charAt(0).toUpperCase();
  const daysLeft = getDaysUntil(profile?.interviewDate || null);

  const openEdit = () => {
    setEditName(profile?.name || "");
    setEditFirms(profile?.targetFirms || []);
    setEditExperience(profile?.experienceLevel || "Beginner");
    setEditDate(profile?.interviewDate || "");
    setSaved(false);
    setEditOpen(true);
  };

  const toggleFirm = (firm: string) => {
    setEditFirms((prev) =>
      prev.includes(firm) ? prev.filter((f) => f !== firm) : [...prev, firm]
    );
  };

  const handleSave = () => {
    updateProfile({
      name: editName.trim(),
      targetFirms: editFirms,
      experienceLevel: editExperience as "Beginner" | "Intermediate" | "Advanced",
      interviewDate: editDate || null,
    });
    setSaved(true);
    setTimeout(() => {
      setEditOpen(false);
      setSaved(false);
    }, 1000);
  };

  const interviewDateStr = profile?.interviewDate
    ? new Date(profile.interviewDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Not scheduled";

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Profile</h1>
        <p className="text-slate-500 mt-1 text-sm font-medium">
          Manage your profile and preparation preferences.
        </p>
      </div>

      {/* Profile header card */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex items-center gap-5 mb-6">
        <Avatar className="h-16 w-16 shadow-md">
          <AvatarFallback className="bg-purple-600 text-white text-xl font-extrabold">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-xl font-extrabold text-slate-900">{displayName}</h2>
          <p className="text-sm font-semibold text-slate-500">{email}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-full border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-5"
          onClick={openEdit}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Profile
        </Button>
      </div>

      {/* Stats strip */}
      <FadeIn delay={0.15} className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-3xl bg-purple-50 border border-purple-100 p-6 shadow-sm">
          <p className="text-xs font-extrabold text-purple-600 uppercase tracking-widest mb-1">
            Readiness Score
          </p>
          <p className="text-4xl font-extrabold text-purple-900 tabular-nums">
            {readinessScore}<span className="text-base font-semibold text-purple-500 ml-1">/100</span>
          </p>
        </div>
        <div className="rounded-3xl bg-amber-50 border border-amber-100 p-6 shadow-sm">
          <p className="text-xs font-extrabold text-amber-600 uppercase tracking-widest mb-1">
            Days Until Interview
          </p>
          <p className="text-4xl font-extrabold text-amber-900 tabular-nums">
            {daysLeft != null && daysLeft > 0 ? daysLeft : "—"}<span className="text-base font-semibold text-amber-600 ml-1">{daysLeft != null && daysLeft > 0 ? "days left" : "not set"}</span>
          </p>
        </div>
      </FadeIn>

      {/* Details Card */}
      <StaggerList className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm p-2">
        {[
          { icon: Building2, label: "Target Firms", value: (profile?.targetFirms || []).join(", ") || "Not set" },
          { icon: GraduationCap, label: "Experience", value: profile?.experienceLevel || "Beginner" },
          { icon: Calendar, label: "Interview Date", value: interviewDateStr },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <StaggerItem key={item.label}>
              <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-slate-50">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-slate-500 w-36 shrink-0">{item.label}</span>
                <span className="text-sm font-extrabold text-slate-900">{item.value}</span>
              </motion.div>
            </StaggerItem>
          );
        })}
      </StaggerList>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Full Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Target Firms</Label>
              <div className="flex flex-wrap gap-2">
                {TARGET_FIRMS.map((firm) => {
                  const selected = editFirms.includes(firm);
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
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Experience Level</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["Beginner", "Intermediate", "Advanced"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setEditExperience(level)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-center",
                      editExperience === level
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-purple-300"
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Interview Date</Label>
              <Input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSave} className="rounded-xl" disabled={saved}>
              {saved ? "Saved!" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
