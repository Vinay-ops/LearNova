import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
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
  Clock,
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

function CaseCard({
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
    <Card className="group hover:border-primary/30 transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{type}</p>
          </div>
          {completed && score && (
            <Badge
              variant="secondary"
              className={cn(
                "text-xs tabular-nums",
                score >= 80
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : score >= 65
                  ? "bg-primary/10 text-primary"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              )}
            >
              {score}/100
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <span className="font-medium">{difficulty}</span>
          <span>·</span>
          <span>{duration} min</span>
          {completed && (
            <>
              <span>·</span>
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              <span>Completed</span>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {skills.map((s) => (
            <Badge key={s} variant="outline" className="text-[10px] font-normal">
              {s}
            </Badge>
          ))}
        </div>
        <Button variant={completed ? "outline" : "default"} size="sm" className="w-full gap-1.5">
          {completed ? "Review" : "Start Case"}
          <ArrowRight className="h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
}

function DrillCard({
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
    <Card className="group hover:border-primary/30 transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-sm">{title}</h3>
          {completed && score && (
            <Badge variant="secondary" className="text-xs tabular-nums">
              {score}/100
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{description}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <span className="font-medium">{difficulty}</span>
          <span>·</span>
          <span>{duration} min</span>
          {completed && (
            <>
              <span>·</span>
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            </>
          )}
        </div>
        <Button variant={completed ? "outline" : "default"} size="sm" className="w-full gap-1.5">
          {completed ? "Practice Again" : "Start Drill"}
          <ArrowRight className="h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Practice() {
  const [difficulty, setDifficulty] = useState<string>("all");

  const filterByDifficulty = <T extends { difficulty: string }>(items: T[]) =>
    difficulty === "all" ? items : items.filter((i) => i.difficulty === difficulty);

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Practice</h1>
        <p className="text-muted-foreground mt-1">
          Build the skills that matter in consulting interviews.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-40">
            <Filter className="h-3.5 w-3.5 mr-2" />
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

      <Tabs defaultValue="cases" className="space-y-6">
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
            Data Interpretation
          </TabsTrigger>
          <TabsTrigger value="behavioral" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Behavioral
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cases">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filterByDifficulty(practiceCases).map((c) => (
              <CaseCard key={c.id} {...c} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="drills">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filterByDifficulty(skillDrills).map((d) => (
              <DrillCard key={d.id} {...d} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="math">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filterByDifficulty(mentalMathDrills).map((d) => (
              <DrillCard key={d.id} {...d} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="data">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filterByDifficulty(dataInterpDrills).map((d) => (
              <DrillCard key={d.id} {...d} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="behavioral">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filterByDifficulty(behavioralDrills).map((d) => (
              <DrillCard key={d.id} {...d} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
