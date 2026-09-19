import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const TARGET_FIRMS = ["McKinsey", "BCG", "Bain", "Deloitte", "Accenture", "Kearney", "Other"];
const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { updateProfile, profile } = useAuth();
  const [selectedFirms, setSelectedFirms] = useState<string[]>(profile?.targetFirms || []);
  const [experience, setExperience] = useState<string>(profile?.experienceLevel || "Beginner");
  const [interviewDate, setInterviewDate] = useState<string>(profile?.interviewDate || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleFirm = (firm: string) => {
    setSelectedFirms((prev) =>
      prev.includes(firm) ? prev.filter((f) => f !== firm) : [...prev, firm]
    );
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (selectedFirms.length === 0) errs.firms = "Please select at least one target firm";
    if (!experience) errs.experience = "Please select your experience level";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;
    updateProfile({
      targetFirms: selectedFirms,
      experienceLevel: experience as typeof EXPERIENCE_LEVELS[number],
      interviewDate: interviewDate || null,
    });
    navigate("/dashboard");
  };

  const handleSkip = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <span className="text-2xl">🎯</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Set Up Your Profile
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            Tell us about your goals so we can personalize your practice.
          </p>
        </div>

        {/* Target Firms */}
        <div className="mb-6">
          <Label className="text-sm font-semibold text-slate-700 mb-3 block">
            Target Firms <span className="text-red-500">*</span>
          </Label>
          <p className="text-xs text-muted-foreground mb-3">Select one or more firms you're targeting</p>
          <div className="flex flex-wrap gap-2">
            {TARGET_FIRMS.map((firm) => {
              const selected = selectedFirms.includes(firm);
              return (
                <button
                  key={firm}
                  onClick={() => toggleFirm(firm)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all",
                    selected
                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                      : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                  )}
                >
                  {selected && <Check className="inline w-3.5 h-3.5 mr-1.5" />}
                  {firm}
                </button>
              );
            })}
          </div>
          {errors.firms && <p className="text-xs text-red-500 mt-2">{errors.firms}</p>}
        </div>

        {/* Experience Level */}
        <div className="mb-6">
          <Label className="text-sm font-semibold text-slate-700 mb-3 block">
            Experience Level <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {EXPERIENCE_LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => setExperience(level)}
                className={cn(
                  "px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all text-center",
                  experience === level
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                )}
              >
                {level}
              </button>
            ))}
          </div>
          {errors.experience && <p className="text-xs text-red-500 mt-2">{errors.experience}</p>}
        </div>

        {/* Interview Date */}
        <div className="mb-8">
          <Label className="text-sm font-semibold text-slate-700 mb-3 block">
            Interview Date
          </Label>
          <p className="text-xs text-muted-foreground mb-3">Leave blank if not scheduled yet</p>
          <Input
            type="date"
            value={interviewDate}
            onChange={(e) => setInterviewDate(e.target.value)}
            className="rounded-xl border-border/60 max-w-xs"
            min={new Date().toISOString().split("T")[0]}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleContinue}
            className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 shadow-lg shadow-blue-200"
          >
            Continue
          </Button>
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="rounded-xl text-slate-500 font-semibold"
          >
            Skip for Now
          </Button>
        </div>
      </div>
    </div>
  );
}
