from typing import Dict, List, Optional
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..core.exceptions import NotFoundError
from ..models.user import User
from ..models.profile import Profile
from ..models.case import CaseAttempt
from ..models.assessment import AssessmentAttempt
from ..models.drill import DrillAttempt
from ..models.skill import UserSkill, Skill
from ..schemas.progress import (
    ProgressSummary,
    ReadinessEntry,
    SkillScoreBreakdown,
    SkillScoreCreate,
    SkillScoreResponse,
)
from ..utils.helpers import clamp_score, average


class ProgressService:
    def __init__(self, db: Session):
        self.db = db

    def get_summary(self, user_id: str) -> ProgressSummary:
        profile = self.db.query(Profile).filter(Profile.user_id == user_id).first()
        if not profile:
            raise NotFoundError("Profile")

        case_attempts = (
            self.db.query(CaseAttempt)
            .filter(
                CaseAttempt.user_id == user_id,
                CaseAttempt.status == "completed",
            )
            .all()
        )
        assessment_attempts = (
            self.db.query(AssessmentAttempt)
            .filter(
                AssessmentAttempt.user_id == user_id,
                AssessmentAttempt.status == "completed",
            )
            .all()
        )
        drill_attempts = (
            self.db.query(DrillAttempt)
            .filter(
                DrillAttempt.user_id == user_id,
                DrillAttempt.status == "completed",
            )
            .all()
        )

        user_skills = (
            self.db.query(UserSkill)
            .filter(UserSkill.user_id == user_id)
            .all()
        )

        completed_scores = [
            ca.overall_score for ca in case_attempts
            if ca.overall_score is not None
        ]
        avg_score = clamp_score(int(average(completed_scores))) if completed_scores else 0
        best_score = max(completed_scores) if completed_scores else None

        skill_breakdown: List[SkillScoreBreakdown] = []
        for us in user_skills:
            skill = self.db.query(Skill).filter(Skill.id == us.skill_id).first()
            skill_breakdown.append(
                SkillScoreBreakdown(
                    skill=skill.name if skill else "Unknown",
                    score=clamp_score(us.current_score),
                    previous_score=us.previous_score,
                    trend=us.trend,
                    color=skill.color if skill else None,
                )
            )

        readiness_over_time = self._build_readiness_history(profile.readiness_score)

        return ProgressSummary(
            user_id=str(user_id),
            readiness_score=clamp_score(profile.readiness_score),
            previous_readiness_score=None,
            streak_days=0,
            total_cases_completed=len(case_attempts),
            total_assessments_completed=len(assessment_attempts),
            total_drills_completed=len(drill_attempts),
            total_practice_minutes=sum(
                ca.elapsed_seconds // 60 for ca in case_attempts
            ) + sum(da.time_spent_seconds // 60 for da in drill_attempts),
            average_score=avg_score,
            best_score=best_score,
            skill_scores=skill_breakdown,
            readiness_over_time=readiness_over_time,
        )

    def _build_readiness_history(self, current_score: int) -> List[ReadinessEntry]:
        """Real readiness-over-time series.

        Readiness history requires persisting each readiness snapshot with a
        timestamp. Until that persistence exists we return an empty series
        rather than synthesizing points — a fabricated "trend" ending at the
        current score would misrepresent the learner's actual history.
        """
        return []

    def set_skill_score(
        self, user_id: str, payload: SkillScoreCreate
    ) -> SkillScoreResponse:
        existing = (
            self.db.query(UserSkill)
            .filter(
                UserSkill.user_id == user_id,
                UserSkill.skill_id == payload.skill_id,
            )
            .first()
        )
        if existing:
            existing.previous_score = existing.current_score
            existing.current_score = clamp_score(payload.current_score)
            existing.trend = payload.trend or "flat"
            self.db.commit()
            self.db.refresh(existing)
            return SkillScoreResponse.model_validate(existing)

        new_us = UserSkill(
            user_id=user_id,
            skill_id=payload.skill_id,
            current_score=clamp_score(payload.current_score),
            previous_score=payload.previous_score,
            trend=payload.trend or "flat",
        )
        self.db.add(new_us)
        self.db.commit()
        self.db.refresh(new_us)
        return SkillScoreResponse.model_validate(new_us)

    def record_skill_scores(self, user_id: str, scores: Dict[str, int]) -> None:
        """Persist measured skill scores (e.g. from AI evaluations).

        Upserts a UserSkill row per skill (creating the Skill row by name when
        missing), keeps the previous score so deltas shown to the learner are
        real, and refreshes the readiness score from the measured data.
        """
        now = datetime.now(timezone.utc)
        for name, raw_score in scores.items():
            if not name or raw_score is None:
                continue
            score = clamp_score(int(raw_score))
            skill = (
                self.db.query(Skill)
                .filter(func.lower(Skill.name) == name.strip().lower())
                .first()
            )
            if not skill:
                skill = Skill(
                    name=name.strip(),
                    description="Measured via AI evaluation",
                    weight=1.0,
                )
                self.db.add(skill)
                self.db.flush()

            user_skill = (
                self.db.query(UserSkill)
                .filter(
                    UserSkill.user_id == user_id,
                    UserSkill.skill_id == skill.id,
                )
                .first()
            )
            if user_skill:
                previous = user_skill.current_score
                user_skill.previous_score = previous
                user_skill.current_score = score
                user_skill.trend = (
                    "up" if score > previous else "down" if score < previous else "flat"
                )
                user_skill.last_practiced_at = now
            else:
                user_skill = UserSkill(
                    user_id=user_id,
                    skill_id=skill.id,
                    current_score=score,
                    previous_score=None,
                    trend="flat",
                    last_practiced_at=now,
                )
                self.db.add(user_skill)

        self.db.commit()
        self.recalculate_readiness(user_id)

    def recalculate_readiness(self, user_id: str) -> int:
        summary = self.get_summary(user_id)
        weighted = average([s.score for s in summary.skill_scores]) if summary.skill_scores else 0
        case_factor = min(summary.total_cases_completed * 1.5, 30)
        drill_factor = min(summary.total_drills_completed * 0.5, 15)
        assessment_factor = min(summary.total_assessments_completed * 2, 20)

        readiness = int(
            (weighted * 0.5)
            + case_factor
            + drill_factor
            + assessment_factor
        )
        readiness = clamp_score(readiness)

        profile = self.db.query(Profile).filter(Profile.user_id == user_id).first()
        if profile:
            profile.readiness_score = readiness
            self.db.commit()
        return readiness
