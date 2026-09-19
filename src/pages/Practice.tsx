import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Dumbbell,
  CheckCircle2,
  ArrowRight,
  Filter,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCases, useCaseAttempts } from "@/hooks/use-cases";
import { useDrills, useDrillAttempts } from "@/hooks/use-drills";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { FadeIn, StaggerList, StaggerItem } from "@/components/app/AnimatedSection";

type CaseType = Record<string, any>;
type PracticeDrill = Record<string, any>;

function CaseRow({
  caseData,
  completed,
  score,
}: {
  caseData: CaseType;
  completed: boolean;
  score?: number;
}) {
  const navigate = useNavigate();
  const difficultyColor =
    caseData.difficulty === "Easy"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : caseData.difficulty === "Medium"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-red-50 text-red-700 border-red-200";

  const handleClick = () => {
    if (completed) {
      navigate(`/cases/${caseData.id}/feedback`);
    } else {
      navigate(`/cases/${caseData.id}/details`);
    }
  };

  return (
    <motion.div
      whileHover={{ backgroundColor: "rgb(243 240 248 / 0.4)" }}
      transition={{ duration: 0.15 }}
      className="group flex items-center gap-4 px-5 py-4 border-b border-border/40 last:border-0 cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-sm">{caseData.title}</span>
          <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0 border-border/60">
            {caseData.type}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <Badge variant="outline" className={cn("text-[10px] font-medium px-1.5 py-0", difficultyColor)}>
            {caseData.difficulty}
          </Badge>
          <span className="text-xs text-muted-foreground">{caseData.duration_minutes || caseData.duration} min</span>
          {caseData.skills.map((s: string) => (
            <Badge key={s} variant="secondary" className="text-[10px] font-normal px-1.5 py-0 bg-blue-50 text-blue-600 border-0">
              {s}
            </Badge>
          ))}
        </div>
      </div>
      {completed && score != null && (
        <span className={cn(
          "text-sm font-bold tabular-nums shrink-0",
          score >= 80 ? "text-emerald-600" : score >= 65 ? "text-primary" : "text-amber-600"
        )}>
          {score}
        </span>
      )}
      {completed && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
      <Button
        variant={completed ? "ghost" : "default"}
        size="sm"
        className={cn(
          "gap-1.5 shrink-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity",
          !completed && "shadow-sm hover:shadow-md hover:shadow-primary/20"
        )}
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
      >
        {completed ? "Review" : "Start"}
        <ArrowRight className="h-3 w-3" />
      </Button>
    </motion.div>
  );
}

function DrillRow({
  drill,
  completed,
  score,
}: {
  drill: PracticeDrill;
  completed: boolean;
  score?: number;
}) {
  const navigate = useNavigate();
  const difficultyColor =
    drill.difficulty === "Easy"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : drill.difficulty === "Medium"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-red-50 text-red-700 border-red-200";

  return (
    <motion.div
      whileHover={{ backgroundColor: "rgb(243 240 248 / 0.4)" }}
      transition={{ duration: 0.15 }}
      className="group flex items-center gap-4 px-5 py-4 border-b border-border/40 last:border-0 cursor-pointer"
      onClick={() => navigate(`/practice?drill=${drill.id}`)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-sm">{drill.title}</span>
          <Badge variant="outline" className={cn("text-[10px] font-medium px-1.5 py-0", difficultyColor)}>
            {drill.difficulty}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{drill.description}</p>
      </div>
      <span className="text-xs text-muted-foreground tabular-nums shrink-0">{drill.duration_minutes || drill.duration} min</span>
      {completed && score != null && (
        <span className="text-sm font-bold tabular-nums shrink-0 text-primary">{score}</span>
      )}
      {completed && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
      <Button
        variant={completed ? "ghost" : "default"}
        size="sm"
        className={cn(
          "gap-1.5 shrink-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity",
          !completed && "shadow-sm hover:shadow-md hover:shadow-primary/20"
        )}
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/practice?drill=${drill.id}`);
        }}
      >
        {completed ? "Again" : "Start"}
        <ArrowRight className="h-3 w-3" />
      </Button>
    </motion.div>
  );
}

export default function Practice() {
  const { user } = useAuth();
  const userId = user?.id || "";
  const { cases } = useCases();
  const { drills } = useDrills();
  const { attempts: caseAttempts } = useCaseAttempts(userId || undefined);
  const { attempts: drillAttemptsList } = useDrillAttempts(userId || undefined);
  const [difficulty, setDifficulty] = useState<string>("all");

  const filterByDifficulty = (items: any[]) =>
    difficulty === "all" ? items : items.filter((i) => i.difficulty === difficulty);

  // Determine which cases are completed
  const getCaseStatus = (caseId: string) => {
    const completed = caseAttempts.filter(
      (a) => a.case_id === caseId && a.status === "completed"
    );
    if (completed.length > 0) {
      const latest = completed[completed.length - 1];
      return { completed: true, score: latest.overall_score || undefined };
    }
    return { completed: false, score: undefined };
  };

  const getDrillStatus = (drillId: string) => {
    const attempts = drillAttemptsList.filter((a) => a.drill_id === drillId);
    if (attempts.length > 0) {
      const latest = attempts[attempts.length - 1];
      return { completed: true, score: latest.score };
    }
    return { completed: false, score: undefined };
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Practice</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Build the skills that matter in consulting interviews.
          </p>
        </div>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-36 rounded-xl border-border/60">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <FadeIn delay={0.15}>
        <Tabs defaultValue="cases">
          <TabsList className="bg-white border border-slate-100 rounded-2xl p-1 h-auto gap-1 shadow-sm">
            <TabsTrigger value="cases" className="gap-1.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
              <BookOpen className="h-3.5 w-3.5" />
              Cases
            </TabsTrigger>
            <TabsTrigger value="drills" className="gap-1.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
              <Dumbbell className="h-3.5 w-3.5" />
              Skill Drills
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cases">
            <StaggerList className="rounded-3xl border border-slate-100 bg-white overflow-hidden mt-4 shadow-xl shadow-slate-200/50">
              <div className="px-5 py-3 border-b bg-muted/20 flex items-center gap-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <span className="flex-1">Case</span>
                <span className="w-12 text-right">Score</span>
                <span className="w-12" />
                <span className="w-20" />
              </div>
              {filterByDifficulty(cases).map((c) => {
                const { completed, score } = getCaseStatus(c.id);
                return (
                  <StaggerItem key={c.id}>
                    <CaseRow caseData={c} completed={completed} score={score} />
                  </StaggerItem>
                );
              })}
              {filterByDifficulty(cases).length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No cases match the selected difficulty.
                </div>
              )}
            </StaggerList>
          </TabsContent>

          <TabsContent value="drills">
            <StaggerList className="rounded-3xl border border-slate-100 bg-white overflow-hidden mt-4 shadow-xl shadow-slate-200/50">
              {filterByDifficulty(drills).map((d) => {
                const { completed, score } = getDrillStatus(d.id);
                return (
                  <StaggerItem key={d.id}>
                    <DrillRow drill={d} completed={completed} score={score} />
                  </StaggerItem>
                );
              })}
              {filterByDifficulty(drills).length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No drills match the selected difficulty.
                </div>
              )}
            </StaggerList>
          </TabsContent>
        </Tabs>
      </FadeIn>
    </AppLayout>
  );
}
