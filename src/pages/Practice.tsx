import { useState } from "react";
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
  Calculator,
  BarChart3,
  Users,
  CheckCircle2,
  ArrowRight,
  Filter,
} from "lucide-react";
import {
  practiceCases,
  skillDrills,
  mentalMathDrills,
  dataInterpDrills,
  behavioralDrills,
} from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { FadeIn, StaggerList, StaggerItem } from "@/components/app/AnimatedSection";

function CaseRow({
  title,
  type,
  difficulty,
  duration,
  skills,
  completed,
  score,
}: {
  title: string;
  type: string;
  difficulty: string;
  duration: number;
  skills: string[];
  completed: boolean;
  score?: number;
}) {
  return (
    <motion.div
      whileHover={{ backgroundColor: "oklch(0.96 0.004 260 / 0.3)" }}
      transition={{ duration: 0.15 }}
      className="group flex items-center gap-4 px-4 py-3.5 border-b border-border/50 last:border-0"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="font-medium text-sm">{title}</span>
          <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0">
            {type}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{difficulty}</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-xs text-muted-foreground">{duration} min</span>
          <span className="text-muted-foreground/40">·</span>
          {skills.map((s) => (
            <Badge key={s} variant="secondary" className="text-[10px] font-normal px-1.5 py-0">
              {s}
            </Badge>
          ))}
        </div>
      </div>
      {completed && score && (
        <span className={cn(
          "text-sm font-semibold tabular-nums shrink-0",
          score >= 80 ? "text-emerald-600" : score >= 65 ? "text-foreground" : "text-amber-600"
        )}>
          {score}
        </span>
      )}
      {completed && (
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
      )}
      <Button
        variant={completed ? "ghost" : "default"}
        size="sm"
        className="gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {completed ? "Review" : "Start"}
        <ArrowRight className="h-3 w-3" />
      </Button>
    </motion.div>
  );
}

function DrillRow({
  title,
  description,
  duration,
  difficulty,
  completed,
  score,
}: {
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  completed: boolean;
  score?: number;
}) {
  return (
    <motion.div
      whileHover={{ backgroundColor: "oklch(0.96 0.004 260 / 0.3)" }}
      transition={{ duration: 0.15 }}
      className="group flex items-center gap-4 px-4 py-3.5 border-b border-border/50 last:border-0"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="font-medium text-sm">{title}</span>
          <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0">
            {difficulty}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground tabular-nums shrink-0">{duration} min</span>
      {completed && score && (
        <span className="text-sm font-semibold tabular-nums shrink-0">{score}</span>
      )}
      {completed && (
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
      )}
      <Button
        variant={completed ? "ghost" : "default"}
        size="sm"
        className="gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {completed ? "Again" : "Start"}
        <ArrowRight className="h-3 w-3" />
      </Button>
    </motion.div>
  );
}

export default function Practice() {
  const [difficulty, setDifficulty] = useState<string>("all");

  const filterByDifficulty = <T extends { difficulty: string }>(items: T[]) =>
    difficulty === "all" ? items : items.filter((i) => i.difficulty === difficulty);

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Practice</h1>
          <p className="text-muted-foreground mt-1">
            Build the skills that matter in consulting interviews.
          </p>
        </div>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-36">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
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
        <TabsList>
          <TabsTrigger value="cases" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Cases
          </TabsTrigger>
          <TabsTrigger value="drills" className="gap-1.5">
            <Dumbbell className="h-3.5 w-3.5" />
            Skill Drills
          </TabsTrigger>
          <TabsTrigger value="math" className="gap-1.5">
            <Calculator className="h-3.5 w-3.5" />
            Mental Math
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Data
          </TabsTrigger>
          <TabsTrigger value="behavioral" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Behavioral
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cases">
          <StaggerList className="rounded-xl border bg-card overflow-hidden mt-4">
            <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center gap-4 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              <span className="flex-1">Case</span>
              <span className="w-12 text-right">Score</span>
              <span className="w-12" />
              <span className="w-20" />
            </div>
            {filterByDifficulty(practiceCases).map((c) => (
              <StaggerItem key={c.id}><CaseRow {...c} /></StaggerItem>
            ))}
          </StaggerList>
        </TabsContent>

        <TabsContent value="drills">
          <StaggerList className="rounded-xl border bg-card overflow-hidden mt-4">
            {filterByDifficulty(skillDrills).map((d) => (
              <StaggerItem key={d.id}><DrillRow {...d} /></StaggerItem>
            ))}
          </StaggerList>
        </TabsContent>

        <TabsContent value="math">
          <StaggerList className="rounded-xl border bg-card overflow-hidden mt-4">
            {filterByDifficulty(mentalMathDrills).map((d) => (
              <StaggerItem key={d.id}><DrillRow {...d} /></StaggerItem>
            ))}
          </StaggerList>
        </TabsContent>

        <TabsContent value="data">
          <StaggerList className="rounded-xl border bg-card overflow-hidden mt-4">
            {filterByDifficulty(dataInterpDrills).map((d) => (
              <StaggerItem key={d.id}><DrillRow {...d} /></StaggerItem>
            ))}
          </StaggerList>
        </TabsContent>

        <TabsContent value="behavioral">
          <StaggerList className="rounded-xl border bg-card overflow-hidden mt-4">
            {filterByDifficulty(behavioralDrills).map((d) => (
              <StaggerItem key={d.id}><DrillRow {...d} /></StaggerItem>
            ))}
          </StaggerList>
        </TabsContent>
      </Tabs>
      </FadeIn>
    </AppLayout>
  );
}
