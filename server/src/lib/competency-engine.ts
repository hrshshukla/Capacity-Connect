export const EVIDENCE_WEIGHTS = {
  qualification: 0.15,
  experience: 0.2,
  certification: 0.1,
  assessment: 0.3,
  trainingHistory: 0.15,
  verification: 0.1,
} as const;

export type EvidenceScores = {
  qualification: number;
  experience: number;
  certification: number;
  assessment: number;
  trainingHistory: number;
  verification: number;
};

export type SubjectRequirement = {
  competencyId: string;
  competencyName: string;
  requiredLevel: number;
  weight: number;
  mandatory: boolean;
};

export type TrainerCompetency = {
  competencyId: string;
  competencyName: string;
  level: number;
};

export function clampScore(score: number) {
  return Math.max(0, Math.min(100, Number(score.toFixed(2))));
}

export function levelForScore(score: number) {
  if (score >= 81) return 5;
  if (score >= 61) return 4;
  if (score >= 41) return 3;
  if (score >= 21) return 2;
  return 1;
}

export function levelTitle(level: number) {
  return ["Awareness", "Basic", "Practitioner", "Advanced", "Expert"][level - 1] ?? "Awareness";
}

export function calculateCompetencyScore(evidence: EvidenceScores) {
  return clampScore(
    evidence.qualification * EVIDENCE_WEIGHTS.qualification +
      evidence.experience * EVIDENCE_WEIGHTS.experience +
      evidence.certification * EVIDENCE_WEIGHTS.certification +
      evidence.assessment * EVIDENCE_WEIGHTS.assessment +
      evidence.trainingHistory * EVIDENCE_WEIGHTS.trainingHistory +
      evidence.verification * EVIDENCE_WEIGHTS.verification,
  );
}

export function experienceScore(years: number) {
  if (years >= 10) return 100;
  if (years >= 7) return 80;
  if (years >= 4) return 60;
  if (years >= 2) return 40;
  return years > 0 ? 20 : 0;
}

export function trainingHistoryScore(count: number) {
  if (count >= 10) return 100;
  if (count >= 6) return 75;
  if (count >= 3) return 50;
  if (count >= 1) return 30;
  return 0;
}

export function calculateTrainerMatch(
  requirements: SubjectRequirement[],
  trainerCompetencyRows: TrainerCompetency[],
  trainer: { experienceYears: number; relevantTrainings: number; certificationScore: number },
) {
  const byCompetency = new Map(trainerCompetencyRows.map((row) => [row.competencyId, row]));
  const totalWeight = requirements.reduce((sum, item) => sum + item.weight, 0) || 1;
  const breakdown = requirements.map((requirement) => {
    const competency = byCompetency.get(requirement.competencyId);
    const trainerLevel = competency?.level ?? 0;
    const compatibility = Math.min(trainerLevel / requirement.requiredLevel, 1);
    return {
      competencyId: requirement.competencyId,
      competency: requirement.competencyName,
      requiredLevel: requirement.requiredLevel,
      trainerLevel,
      weight: requirement.weight,
      compatibility: Number((compatibility * 100).toFixed(1)),
      mandatory: requirement.mandatory,
    };
  });
  const competencyMatch = clampScore(
    breakdown.reduce((sum, item) => sum + item.compatibility * item.weight, 0) / totalWeight,
  );
  const missingCompetencies = breakdown
    .filter((item) => item.mandatory && item.trainerLevel < item.requiredLevel)
    .map((item) => `${item.competency} · Level ${item.requiredLevel}`);
  const eligible = missingCompetencies.length === 0;
  const experience = experienceScore(trainer.experienceYears);
  const trainingHistory = trainingHistoryScore(trainer.relevantTrainings);
  const matchScore = clampScore(
    competencyMatch * 0.6 +
      experience * 0.2 +
      trainer.certificationScore * 0.1 +
      trainingHistory * 0.1,
  );
  const strongestCompetencies = breakdown
    .filter((item) => item.trainerLevel > 0)
    .sort((a, b) => b.compatibility - a.compatibility)
    .slice(0, 3)
    .map((item) => item.competency);

  return {
    matchScore,
    eligible,
    competencyMatch,
    experienceScore: experience,
    certificationScore: trainer.certificationScore,
    trainingHistoryScore: trainingHistory,
    breakdown,
    strongestCompetencies,
    missingCompetencies,
    reasoning: eligible
      ? `Strong coverage across the subject requirements, backed by ${trainer.experienceYears} years of relevant experience and ${trainer.relevantTrainings} previous trainings.`
      : `Not currently eligible because the mandatory requirements are not met: ${missingCompetencies.join(", ")}.`,
  };
}