import { and, asc, eq } from "drizzle-orm";
import { db } from "../../../db/src";
import {
  competencies,
  competencyLevels,
  subjectCompetencies,
  subjects,
  traineeCompetencies,
  trainerCompetencies,
  trainers,
} from "../../../db/src/schema";
import {
  calculateCompetencyScore,
  calculateTrainerMatch,
  levelForScore,
  levelTitle,
  type EvidenceScores,
  type SubjectRequirement,
  type TrainerCompetency,
} from "./competency-engine";

export const CURRENT_TRAINEE_ID = "trainee-001";

const colors: Record<string, string> = {
  meteorology: "#3f5bd8",
  nwp: "#0c8f87",
  "data-analysis": "#e09b35",
  python: "#cb5577",
  forecasting: "#6c5bb7",
};

export async function getCompetencyLevels() {
  return db.select().from(competencyLevels).orderBy(asc(competencyLevels.level));
}

export async function getTraineeCompetencies() {
  const rows = await db
    .select({ competency: competencies, trainee: traineeCompetencies })
    .from(traineeCompetencies)
    .innerJoin(competencies, eq(competencies.id, traineeCompetencies.competencyId))
    .where(eq(traineeCompetencies.traineeId, CURRENT_TRAINEE_ID))
    .orderBy(asc(competencies.name));
  return rows.map(({ competency, trainee }) => ({
    id: competency.id,
    name: competency.name,
    score: trainee.score,
    level: levelForScore(trainee.score),
    levelTitle: levelTitle(levelForScore(trainee.score)),
    trend: trainee.trend,
    color: competency.color || colors[competency.id] || "#3f5bd8",
    evidence: {
      qualification: trainee.qualificationScore,
      experience: trainee.experienceScore,
      certification: trainee.certificationScore,
      assessment: trainee.assessmentScore,
      trainingHistory: trainee.trainingHistoryScore,
      verification: trainee.verificationScore,
    },
  }));
}

export async function getSubjectRequirements(subjectId: string): Promise<SubjectRequirement[]> {
  const rows = await db
    .select({ requirement: subjectCompetencies, competency: competencies })
    .from(subjectCompetencies)
    .innerJoin(competencies, eq(competencies.id, subjectCompetencies.competencyId))
    .where(eq(subjectCompetencies.subjectId, subjectId))
    .orderBy(asc(subjectCompetencies.weight));
  return rows.map(({ requirement, competency }) => ({
    competencyId: competency.id,
    competencyName: competency.name,
    requiredLevel: requirement.requiredLevel,
    weight: requirement.weight,
    mandatory: requirement.mandatory,
  }));
}

export async function getCompetencyGaps(courseBySubject: Record<string, string>) {
  const [traineeRows, subjectRows] = await Promise.all([
    getTraineeCompetencies(),
    db.select().from(subjects).orderBy(asc(subjects.name)),
  ]);
  const scoreById = new Map(traineeRows.map((item) => [item.id, item]));
  const gaps = [];
  for (const subject of subjectRows) {
    const requirements = await getSubjectRequirements(subject.id);
    for (const requirement of requirements) {
      const current = scoreById.get(requirement.competencyId);
      const currentLevel = current?.level ?? 1;
      const gap = Math.max(requirement.requiredLevel - currentLevel, 0);
      if (gap > 0) {
        gaps.push({
          id: subject.id,
          name: subject.name,
          currentLevel,
          requiredLevel: requirement.requiredLevel,
          gap,
          priority: gap >= 2 || requirement.mandatory ? "High" : "Medium",
          recommendedCourse: courseBySubject[subject.id] ?? "Explore focused learning",
          recommendedTrainer: "Matched from evidence",
        });
        break;
      }
    }
  }
  return gaps;
}

export async function getTrainerRecommendations(subjectId: string) {
  const requirements = await getSubjectRequirements(subjectId);
  const trainerRows = await db
    .select({ trainer: trainers, competency: trainerCompetencies, competencyMeta: competencies })
    .from(trainerCompetencies)
    .innerJoin(trainers, eq(trainers.id, trainerCompetencies.trainerId))
    .innerJoin(competencies, eq(competencies.id, trainerCompetencies.competencyId));
  const grouped = new Map<string, { trainer: typeof trainerRows[number]["trainer"]; competencies: TrainerCompetency[] }>();
  for (const row of trainerRows) {
    const existing = grouped.get(row.trainer.id) ?? { trainer: row.trainer, competencies: [] };
    existing.competencies.push({
      competencyId: row.competency.competencyId,
      competencyName: row.competencyMeta.name,
      level: row.competency.level,
    });
    grouped.set(row.trainer.id, existing);
  }
  return [...grouped.values()]
    .map(({ trainer, competencies: trainerCompetencyRows }) => ({
      id: trainer.id,
      name: trainer.name,
      title: trainer.title,
      ...calculateTrainerMatch(requirements, trainerCompetencyRows, trainer),
      experienceYears: trainer.experienceYears,
      relevantTrainings: trainer.relevantTrainings,
    }))
    .sort((a, b) => b.matchScore - a.matchScore);
}

export async function recalculateTraineeCompetency(competencyId: string, evidence: EvidenceScores) {
  const score = calculateCompetencyScore(evidence);
  const current = await db
    .select({ trend: traineeCompetencies.trend })
    .from(traineeCompetencies)
    .where(and(eq(traineeCompetencies.traineeId, CURRENT_TRAINEE_ID), eq(traineeCompetencies.competencyId, competencyId)))
    .limit(1);
  await db
    .update(traineeCompetencies)
    .set({ ...evidenceToColumns(evidence), score, trend: Number((score - (current[0]?.trend ?? score)).toFixed(2)), updatedAt: new Date() })
    .where(and(eq(traineeCompetencies.traineeId, CURRENT_TRAINEE_ID), eq(traineeCompetencies.competencyId, competencyId)));
  return score;
}

function evidenceToColumns(evidence: EvidenceScores) {
  return {
    qualificationScore: evidence.qualification,
    experienceScore: evidence.experience,
    certificationScore: evidence.certification,
    assessmentScore: evidence.assessment,
    trainingHistoryScore: evidence.trainingHistory,
    verificationScore: evidence.verification,
  };
}