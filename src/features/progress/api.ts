import api from "@/lib/api-client";
import type {
  ProgressSummary,
  SkillScore,
  ReadinessEntry,
  ID,
} from "@/types";
import {
  skillScores,
  userProfile,
  readinessOverTime,
  practiceCases,
  assessments,
  skillDrills,
} from "@/data/mock-data";

export interface ProgressRepository {
  getSummary(userId: ID): Promise<ProgressSummary>;
  getSkillScores(userId: ID): Promise<SkillScore[]>;
  getReadinessHistory(userId: ID): Promise<ReadinessEntry[]>;
  recalculateReadiness(userId: ID): Promise<number>;
  setSkillScore(
    userId: ID,
    skillId: ID,
    score: number,
    trend: "up" | "down" | "flat",
  ): Promise<SkillScore | undefined>;
}

export class MockProgressRepository implements ProgressRepository {
  async getSummary(): Promise<ProgressSummary> {
    const completedCases = practiceCases.filter((c) => c.completed).length;
    const completedAssessments = assessments.filter((a) => a.completed).length;
    const completedDrills = skillDrills.filter((d) => (d as any).completed).length;

    const scores = skillScores
      .filter((s) => typeof s.score === "number")
      .map((s) => s.score);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    return {
      user_id: "user-1",
      readiness_score: userProfile.readinessScore,
      previous_readiness_score: userProfile.previousReadinessScore,
      streak_days: userProfile.streak,
      total_cases_completed: completedCases,
      total_assessments_completed: completedAssessments,
      total_drills_completed: completedDrills,
      total_practice_minutes: userProfile.averageCaseTime * completedCases,
      average_score: Math.round(avg),
      best_score: Math.max(...scores, userProfile.averageScore),
      skill_scores: skillScores,
      readiness_over_time: readinessOverTime,
    };
  }

  async getSkillScores(): Promise<SkillScore[]> {
    return skillScores;
  }

  async getReadinessHistory(): Promise<ReadinessEntry[]> {
    return readinessOverTime;
  }

  async recalculateReadiness(_userId: ID): Promise<number> {
    return userProfile.readinessScore;
  }

  async setSkillScore(): Promise<SkillScore | undefined> {
    return undefined;
  }
}

export class ApiProgressRepository implements ProgressRepository {
  async getSummary(_userId: ID): Promise<ProgressSummary> {
    const { data } = await api.get<ProgressSummary>("/api/progress");
    return data;
  }

  async getSkillScores(_userId: ID): Promise<SkillScore[]> {
    const summary = await this.getSummary(_userId);
    return summary.skill_scores;
  }

  async getReadinessHistory(_userId: ID): Promise<ReadinessEntry[]> {
    const summary = await this.getSummary(_userId);
    return summary.readiness_over_time;
  }

  async recalculateReadiness(_userId: ID): Promise<number> {
    const { data } = await api.post<{ readiness_score: number }>(
      "/api/progress/recalculate-readiness",
    );
    return data.readiness_score;
  }

  async setSkillScore(
    _userId: ID,
    skillId: ID,
    score: number,
    trend: "up" | "down" | "flat",
  ): Promise<SkillScore | undefined> {
    const { data } = await api.post("/api/progress/skills", {
      skill_id: skillId,
      current_score: score,
      trend,
    });
    const skillName = (data as any).skill?.name || "Skill";
    return {
      name: skillName,
      score: (data as any).current_score || 0,
      previous_score: (data as any).previous_score || 0,
      trend: (data as any).trend || "flat",
      color: "#1e3a5f",
    };
  }
}

const USE_API = true;
export const progressRepository: ProgressRepository = USE_API
  ? new ApiProgressRepository()
  : new MockProgressRepository();

export const progressApi = {
  getSummary: (userId: ID) => progressRepository.getSummary(userId),
  getSkillScores: (userId: ID) => progressRepository.getSkillScores(userId),
  getReadinessHistory: (userId: ID) => progressRepository.getReadinessHistory(userId),
  recalculateReadiness: (userId: ID) => progressRepository.recalculateReadiness(userId),
  setSkillScore: (
    userId: ID,
    skillId: ID,
    score: number,
    trend: "up" | "down" | "flat",
  ) => progressRepository.setSkillScore(userId, skillId, score, trend),
};
