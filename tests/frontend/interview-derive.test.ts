import { describe, expect, it } from "vitest";
import {
  formatDate,
  interviewProgress,
  interviewerQuestionCount,
  isTopicLikeSkill,
  practiceTargets,
  resumeSummary,
  sessionKind,
  sessionTitle,
  statusLabel,
  storedScore,
  weakestSkills,
} from "../../src/features/ai-interview/derive";

const msgs = (roles: Array<"interviewer" | "candidate">) =>
  roles.map((role, i) => ({ role, content: `message ${i}` }));

describe("interviewProgress", () => {
  it("returns null before the first question is asked", () => {
    expect(interviewProgress([], { total_questions: 6 })).toBeNull();
  });

  it("counts interviewer questions from the real history", () => {
    const messages = msgs(["interviewer", "candidate", "interviewer"]);
    expect(interviewerQuestionCount(messages)).toBe(2);
    expect(interviewProgress(messages, { total_questions: 6 })).toEqual({
      asked: 2,
      total: 6,
    });
  });

  it("returns null when no configured target exists (never a fake number)", () => {
    const messages = msgs(["interviewer"]);
    expect(interviewProgress(messages, {})).toBeNull();
    expect(interviewProgress(messages, undefined)).toBeNull();
    expect(interviewProgress(messages, { total_questions: "n/a" })).toBeNull();
  });

  it("clamps the asked count to the configured total", () => {
    const messages = msgs(["interviewer", "candidate", "interviewer", "candidate", "interviewer"]);
    expect(interviewProgress(messages, { total_questions: 2 })).toEqual({ asked: 2, total: 2 });
  });
});

describe("session metadata helpers", () => {
  it("detects the interview kind", () => {
    expect(sessionKind({ mode: "role" })).toBe("role");
    expect(sessionKind({ mode: "case" })).toBe("case");
    expect(sessionKind({ mode: "learning" })).toBe("learning");
    expect(sessionKind({ topic: "Data Structures" })).toBe("generative");
    expect(sessionKind(null)).toBe("generative");
  });

  it("derives a readable title", () => {
    expect(sessionTitle({ mode: "role", role: "Software Engineer" })).toBe("Software Engineer");
    expect(sessionTitle({ mode: "case", case_title: "Profitability Case" })).toBe("Profitability Case");
    expect(sessionTitle({ topic: "SQL joins" })).toBe("SQL joins");
    expect(sessionTitle({})).toBe("General interview");
  });

  it("labels statuses honestly", () => {
    expect(statusLabel("active")).toBe("In progress");
    expect(statusLabel("completed")).toBe("Completed");
    expect(statusLabel("abandoned")).toBe("Abandoned");
  });

  it("extracts a stored evaluation score only when numeric", () => {
    expect(storedScore({ evaluation: { overall_score: 81 } })).toBe(81);
    expect(storedScore({ evaluation: { overall_score: "81" } })).toBeNull();
    expect(storedScore({})).toBeNull();
    expect(storedScore(null)).toBeNull();
  });
});

describe("weak-skill targeting (interview → learning)", () => {
  const evaluation = {
    skills: [
      { skill: "Communication", score: 72 },
      { skill: "SQL", score: 58 },
      { skill: "Problem Solving", score: 66 },
      { skill: "System Design", score: 44 },
    ],
  };

  it("orders weakest first", () => {
    expect(weakestSkills(evaluation, 3).map((s) => s.skill)).toEqual([
      "System Design",
      "SQL",
      "Problem Solving",
    ]);
  });

  it("returns [] when there are no measured skills", () => {
    expect(weakestSkills(null)).toEqual([]);
    expect(weakestSkills({ skills: [] })).toEqual([]);
  });

  it("maps topic-like weaknesses to Learn and meta-skills to practice hub", () => {
    const targets = practiceTargets(evaluation, 3);
    const byLabel = Object.fromEntries(targets.map((t) => [t.label, t.href]));
    expect(byLabel["Practice System Design"]).toBe("/learn?topic=System%20Design");
    expect(byLabel["Practice SQL"]).toBe("/learn?topic=SQL");
    // Interview meta-dimensions have no single topic — practice hub instead.
    expect(byLabel["Practice Problem Solving"]).toBe("/practice");
  });

  it("classifies topic-like vs meta skills deterministically", () => {
    expect(isTopicLikeSkill("SQL")).toBe(true);
    expect(isTopicLikeSkill("Data Structures")).toBe(true);
    expect(isTopicLikeSkill("Communication")).toBe(false);
    expect(isTopicLikeSkill("Technical Knowledge")).toBe(false);
    expect(isTopicLikeSkill("")).toBe(false);
  });
});

describe("misc formatting", () => {
  it("summarizes a parsed resume", () => {
    const r = {
      name: "Alex Rivera",
      title: "Backend Engineer",
      skills: ["Python", "SQL"],
      projects: [{ name: "ML Forecaster" }],
      technologies: ["FastAPI"],
    };
    expect(resumeSummary(r)).toContain("Alex Rivera");
    expect(resumeSummary(r)).toContain("2 skills");
    expect(resumeSummary(r)).toContain("1 projects");
    expect(resumeSummary(null)).toBe("");
  });

  it("formats dates only when valid", () => {
    expect(formatDate("2026-09-04T10:00:00Z")).not.toBe("");
    expect(formatDate("not-a-date")).toBe("");
    expect(formatDate(undefined)).toBe("");
  });
});
