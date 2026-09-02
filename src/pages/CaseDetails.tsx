import { useParams, useNavigate, Link } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useCases, useCaseAttempt } from "@/hooks/use-cases";
import {
  ArrowLeft,
  Play,
  Clock,
  Target,
  BookOpen,
  ChevronRight,
} from "lucide-react";

export default function CaseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cases } = useCases();
  const { attempt, createAttempt } = useCaseAttempt(user?.id, id);

  const caseData = cases.find((c) => c.id === id);

  if (!caseData) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <h2 className="text-xl font-bold text-slate-900">Case not found</h2>
          <p className="text-muted-foreground mt-2 text-sm">This case doesn't exist or has been removed.</p>
          <Link to="/practice">
            <Button className="mt-4">Back to Practice</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const difficultyColor =
    caseData.difficulty === "Easy"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : caseData.difficulty === "Medium"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-red-50 text-red-700 border-red-200";

  const durationMinutes = caseData.duration_minutes || caseData.duration;

  const handleStartCase = async () => {
    if (!user) return;
    if (attempt && attempt.status === "in_progress") {
      navigate(`/cases/${caseData.id}`);
      return;
    }
    await createAttempt(user.id, caseData.id);
    navigate(`/cases/${caseData.id}`);
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <Link
          to="/practice"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Practice
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {caseData.title}
            </h1>
            <Badge variant="outline" className="text-xs border-border/60">
              {caseData.type}
            </Badge>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <Badge variant="outline" className={`text-xs font-medium px-2 py-0.5 ${difficultyColor}`}>
              {caseData.difficulty}
            </Badge>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{durationMinutes} minutes</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>{caseData.skills.length} skills tested</span>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {caseData.skills.map((skill: string) => (
              <Badge
                key={skill}
                variant="secondary"
                className="bg-purple-50 text-purple-600 border-0 text-xs"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm mb-6">
          <h3 className="text-sm font-extrabold text-slate-900 mb-3">Case Description</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{caseData.description}</p>
        </div>

        {/* What you'll practice */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm mb-8">
          <h3 className="text-sm font-extrabold text-slate-900 mb-3">What You'll Practice</h3>
          <ul className="space-y-2">
            {(caseData.skills || []).map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-2.5">
                <BookOpen className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                <span className="text-sm text-slate-600">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Start Button */}
        <Button
          onClick={handleStartCase}
          className="w-full py-6 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-2xl shadow-lg shadow-purple-200 text-base gap-3"
        >
          <Play className="h-5 w-5 fill-white" />
          Start Case Interview
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </AppLayout>
  );
}
