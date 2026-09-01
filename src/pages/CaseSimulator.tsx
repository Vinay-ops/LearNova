import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Timer } from "@/components/app/Timer";
import { IssueTreeNode } from "@/components/app/IssueTreeNode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Mic,
  Send,
  StickyNote,
  GitBranch,
  Calculator,
  ChevronRight,
  Pause,
  ArrowRight,
} from "lucide-react";
import { caseConversation } from "@/data/mock-data";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

const mockIssueTree = {
  label: "Profit Decline",
  children: [
    {
      label: "Revenue",
      children: [{ label: "Price" }, { label: "Volume" }, { label: "Mix" }],
    },
    {
      label: "Costs",
      children: [{ label: "Fixed" }, { label: "Variable" }],
    },
  ],
};

export default function CaseSimulator() {
  const [response, setResponse] = useState("");
  const [messages, setMessages] = useState<
    { role: "interviewer" | "candidate"; text: string }[]
  >([
    { role: "interviewer", text: caseConversation.questions[0].interviewer },
    { role: "candidate", text: caseConversation.questions[0].candidateResponse || "" },
    { role: "interviewer", text: caseConversation.questions[1].interviewer },
  ]);
  const [isRecording, setIsRecording] = useState(false);

  const handleSubmit = () => {
    if (!response.trim()) return;
    setMessages((prev) => [...prev, { role: "candidate", text: response }]);
    setResponse("");
    // In production, this would call the AI
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "interviewer",
          text: "Interesting perspective. Can you quantify the impact of that on the bottom line?",
        },
      ]);
    }, 1500);
  };

  return (
    <AppLayout>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight">
            {caseConversation.title}
          </h1>
          <Badge variant="secondary" className="text-xs">
            {caseConversation.type}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <Timer
            elapsed={caseConversation.elapsedSeconds}
            total={1800}
            variant="countdown"
          />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Question {caseConversation.currentQuestion} of{" "}
              {caseConversation.totalQuestions}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: caseConversation.totalQuestions }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 w-6 rounded-full",
                    i < caseConversation.currentQuestion
                      ? "bg-primary"
                      : i === caseConversation.currentQuestion - 1
                      ? "bg-primary"
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <Pause className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid gap-4 lg:grid-cols-[1fr_380px] h-[calc(100vh-140px)]">
        {/* Left: Interviewer panel */}
        <div className="flex flex-col rounded-xl border bg-card overflow-hidden">
          {/* Client Situation */}
          <div className="border-b bg-muted/30 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Client Situation
            </p>
            <p className="text-sm font-semibold">{caseConversation.company}</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              &ldquo;The client is a global coffee company whose profits have declined by 15% over
              the last year. Revenue has remained relatively flat, but costs have increased
              significantly.&rdquo;
            </p>
          </div>

          {/* Conversation */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  msg.role === "candidate" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed",
                    msg.role === "interviewer"
                      ? "bg-muted text-foreground"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {msg.role === "interviewer" && (
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Interviewer
                    </p>
                  )}
                  {msg.role === "candidate" && (
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70 mb-1.5">
                      Your Response
                    </p>
                  )}
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Response input */}
          <div className="border-t px-5 py-4">
            <div className="relative">
              <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Type your response..."
                className="min-h-[80px] pr-24 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    isRecording && "text-red-500 bg-red-50"
                  )}
                  onClick={() => setIsRecording(!isRecording)}
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!response.trim()}
                  className="h-8"
                >
                  <Send className="h-3.5 w-3.5" />
                  Submit
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Candidate workspace */}
        <div className="flex flex-col rounded-xl border bg-card overflow-hidden">
          <Tabs defaultValue="notes" className="flex flex-col h-full">
            <TabsList className="mx-4 mt-4 w-auto">
              <TabsTrigger value="notes" className="gap-1.5 text-xs">
                <StickyNote className="h-3 w-3" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="structure" className="gap-1.5 text-xs">
                <GitBranch className="h-3 w-3" />
                Structure
              </TabsTrigger>
              <TabsTrigger value="calculator" className="gap-1.5 text-xs">
                <Calculator className="h-3 w-3" />
                Calculator
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="flex-1 overflow-y-auto px-4 pb-4 mt-0">
              <Textarea
                defaultValue={caseConversation.notes}
                placeholder="Take notes during the case..."
                className="min-h-full border-0 bg-transparent resize-none focus-visible:ring-0 text-sm leading-relaxed"
              />
            </TabsContent>

            <TabsContent value="structure" className="flex-1 overflow-y-auto px-4 pb-4 mt-0">
              <div className="pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Issue Tree
                </p>
                <IssueTreeNode node={mockIssueTree} />
                <Button variant="outline" size="sm" className="mt-4 gap-1.5 text-xs">
                  + Add Node
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="calculator" className="flex-1 overflow-y-auto px-4 pb-4 mt-0">
              <div className="pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Calculator
                </p>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="font-mono text-right text-2xl font-semibold tabular-nums mb-4 h-8">
                    42,000,000
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "0", ".", "C", "+"].map(
                      (btn) => (
                        <button
                          key={btn}
                          className={cn(
                            "h-9 rounded-md text-sm font-medium transition-colors",
                            ["÷", "×", "−", "+"].includes(btn)
                              ? "bg-primary/10 text-primary hover:bg-primary/20"
                              : btn === "C"
                              ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                              : "bg-card hover:bg-muted border text-foreground"
                          )}
                        >
                          {btn}
                        </button>
                      )
                    )}
                  </div>
                  <Button className="w-full mt-3" size="sm">
                    Add to Notes
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
