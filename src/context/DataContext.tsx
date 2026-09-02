import React, { createContext, useContext, useState, useCallback } from "react";
import {
  skillScores,
  readinessOverTime,
  userProfile,
  practiceCases,
  skillDrills,
  assessments,
  applications,
} from "@/data/mock-data";

type AnyRecord = Record<string, any>;

interface DataContextType {
  cases: AnyRecord[];
  caseQuestions: AnyRecord[];
  assessments: AnyRecord[];
  assessmentQuestions: AnyRecord[];
  drills: AnyRecord[];
  skills: AnyRecord[];

  getCaseAttempts: (userId: string) => AnyRecord[];
  getCaseAttempt: (attemptId: string) => AnyRecord | undefined;
  getActiveCaseAttempt: (userId: string, caseId: string) => AnyRecord | undefined;
  createCaseAttempt: (userId: string, caseId: string) => AnyRecord;
  completeCaseAttempt: (attemptId: string, data: Partial<AnyRecord>) => void;
  getCaseAnswers: (attemptId: string) => AnyRecord[];
  saveCaseAnswer: (answer: Omit<AnyRecord, "id">) => AnyRecord;
  getCaseQuestionsForCase: (caseId: string) => AnyRecord[];

  getAssessmentAttempts: (userId: string) => AnyRecord[];
  getAssessmentAttempt: (attemptId: string) => AnyRecord | undefined;
  createAssessmentAttempt: (userId: string, assessmentId: string) => AnyRecord;
  completeAssessmentAttempt: (attemptId: string, data: Partial<AnyRecord>) => void;
  getAssessmentAnswers: (attemptId: string) => AnyRecord[];
  saveAssessmentAnswer: (answer: Omit<AnyRecord, "id">) => void;
  getAssessmentQuestionsForAssessment: (assessmentId: string) => AnyRecord[];

  getDrillAttempts: (userId: string) => AnyRecord[];
  saveDrillAttempt: (attempt: Omit<AnyRecord, "id">) => AnyRecord;

  getApplications: (userId: string) => AnyRecord[];
  createApplication: (app: Omit<AnyRecord, "id" | "createdAt" | "updatedAt">) => AnyRecord;
  updateApplication: (id: string, updates: Partial<AnyRecord>) => void;
  deleteApplication: (id: string) => void;

  getSettings: (userId: string) => AnyRecord;
  updateSettings: (userId: string, updates: Partial<AnyRecord>) => void;

  getSkillScores: (userId: string) => AnyRecord[];
  getReadinessScore: (userId: string) => number;
  getReadinessOverTime: (userId: string) => AnyRecord[];
  getCompletedCasesCount: (userId: string) => number;
  getCompletedAssessmentsCount: (userId: string) => number;
  getCompletedDrillsCount: (userId: string) => number;
  getAverageScore: (userId: string) => number;
  getBestScore: (userId: string) => number;
  getStreak: (userId: string) => number;

  refresh: () => void;
  refreshKey: number;
}

const DataContext = createContext<DataContextType | null>(null);

const seedSkills = skillScores.map((s) => ({ name: s.name }));
const seedCases = practiceCases;
const seedAssessments = assessments;
const seedDrills = skillDrills;

const sampleCaseAttempt: AnyRecord = {
  id: "attempt-1",
  userId: "user-1",
  caseId: "case-1",
  status: "completed",
  startedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  currentQuestionIndex: 5,
  overallScore: 78,
  structuringScore: 82,
  quantitativeScore: 89,
  businessJudgmentScore: 64,
  communicationScore: 73,
  synthesisScore: 61,
  feedback: "Good structure, work on synthesis.",
  strengths: ["Structuring", "Quantitative Analysis"],
  weaknesses: ["Synthesis"],
  recommendation: "Practice synthesis drills.",
};

const empty = (_: any) => [];
const noop = () => {};
const uid = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const getSkillScores = useCallback(() => skillScores, [refreshKey]);
  const getReadinessScore = useCallback(() => userProfile.readinessScore, [refreshKey]);
  const getReadinessOverTime = useCallback(() => readinessOverTime, [refreshKey]);
  const getCompletedCasesCount = useCallback(() => userProfile.totalCasesCompleted, [refreshKey]);
  const getCompletedAssessmentsCount = useCallback(() => assessments.filter((a) => a.completed).length, [refreshKey]);
  const getCompletedDrillsCount = useCallback(() => skillDrills.filter((d) => (d as any).completed).length, [refreshKey]);
  const getAverageScore = useCallback(() => userProfile.averageScore, [refreshKey]);
  const getBestScore = useCallback(() => Math.max(userProfile.averageScore, 85), [refreshKey]);
  const getStreak = useCallback(() => userProfile.streak, [refreshKey]);

  const getCaseAttempts = useCallback(() => [sampleCaseAttempt], [refreshKey]);
  const getCaseAttempt = useCallback(() => sampleCaseAttempt, [refreshKey]);
  const getActiveCaseAttempt = useCallback(() => undefined, [refreshKey]);
  const createCaseAttempt = useCallback((userId: string, caseId: string) => ({
    id: uid(), userId, caseId, status: "in_progress",
    startedAt: new Date().toISOString(), completedAt: null,
    currentQuestionIndex: 0, overallScore: null, structuringScore: null,
    quantitativeScore: null, businessJudgmentScore: null, communicationScore: null,
    synthesisScore: null, feedback: null, strengths: [], weaknesses: [], recommendation: null,
  }), []);
  const completeCaseAttempt = noop;
  const getCaseAnswers = empty;
  const saveCaseAnswer = useCallback((a: any) => ({ ...a, id: uid() }), []);
  const getCaseQuestionsForCase = empty;

  const getAssessmentAttempts = empty;
  const getAssessmentAttempt = useCallback(() => undefined, [refreshKey]);
  const createAssessmentAttempt = useCallback((userId: string, assessmentId: string) => ({
    id: uid(), userId, assessmentId, score: 0, totalQuestions: 0,
    correctAnswers: 0, startedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
  }), []);
  const completeAssessmentAttempt = noop;
  const getAssessmentAnswers = empty;
  const saveAssessmentAnswer = noop;
  const getAssessmentQuestionsForAssessment = empty;

  const getDrillAttempts = empty;
  const saveDrillAttempt = useCallback((a: any) => ({ ...a, id: uid() }), []);

  const getApplications = useCallback(() => applications, [refreshKey]);
  const createApplication = useCallback((a: any) => {
    const now = new Date().toISOString();
    return { ...a, id: uid(), createdAt: now, updatedAt: now };
  }, []);
  const updateApplication = noop;
  const deleteApplication = noop;

  const getSettings = useCallback((userId: string) => ({
    userId,
    notifications: { practiceReminders: true, streakAlerts: true, newContent: true, weeklyProgress: true },
    defaultDifficulty: "All",
    targetFirms: [],
    updatedAt: new Date().toISOString(),
  }), [refreshKey]);
  const updateSettings = noop;

  return (
    <DataContext.Provider
      value={{
        cases: seedCases as AnyRecord[],
        caseQuestions: [],
        assessments: seedAssessments as AnyRecord[],
        assessmentQuestions: [],
        drills: seedDrills as AnyRecord[],
        skills: seedSkills as AnyRecord[],
        getCaseAttempts, getCaseAttempt, getActiveCaseAttempt, createCaseAttempt,
        completeCaseAttempt, getCaseAnswers, saveCaseAnswer, getCaseQuestionsForCase,
        getAssessmentAttempts, getAssessmentAttempt, createAssessmentAttempt,
        completeAssessmentAttempt, getAssessmentAnswers, saveAssessmentAnswer,
        getAssessmentQuestionsForAssessment,
        getDrillAttempts, saveDrillAttempt,
        getApplications, createApplication, updateApplication, deleteApplication,
        getSettings, updateSettings,
        getSkillScores, getReadinessScore, getReadinessOverTime,
        getCompletedCasesCount, getCompletedAssessmentsCount, getCompletedDrillsCount,
        getAverageScore, getBestScore, getStreak,
        refresh, refreshKey,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
