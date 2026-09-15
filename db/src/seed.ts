import "dotenv/config";

import { db, pool } from "./index";
import {
  adminAssessments,
  adminCourses,
  contentAchievements,
  contentAnnouncements,
  contentNotifications,
  competencies,
  competencyLevels,
  courseResources,
  subjectCompetencies,
  subjects,
  traineeCompetencies,
  trainerCompetencies,
  trainers,
} from "./schema";

const levels = [
  { level: 1, title: "Awareness", description: "Understands the basic concepts and terminology.", scoreThreshold: 0 },
  { level: 2, title: "Basic", description: "Can apply foundational knowledge with guidance.", scoreThreshold: 21 },
  { level: 3, title: "Practitioner", description: "Can apply the competency independently in routine work.", scoreThreshold: 41 },
  { level: 4, title: "Advanced", description: "Can handle complex work and support others.", scoreThreshold: 61 },
  { level: 5, title: "Expert", description: "Can lead practice, improve methods, and mentor others.", scoreThreshold: 81 },
];

const competencyRows = [
  { id: "meteorology", name: "Meteorology", color: "#3f5bd8" },
  { id: "nwp", name: "Numerical Weather Prediction", color: "#0c8f87" },
  { id: "data-analysis", name: "Data Analysis", color: "#e09b35" },
  { id: "python", name: "Python", color: "#cb5577" },
  { id: "forecasting", name: "Forecasting", color: "#6c5bb7" },
];

const subjectRows = [
  { id: "numerical-weather-prediction", name: "Numerical Weather Prediction", slug: "numerical-weather-prediction" },
  { id: "satellite-meteorology", name: "Satellite Meteorology", slug: "satellite-meteorology" },
  { id: "data-analysis", name: "Data Analysis", slug: "data-analysis" },
];

const subjectRequirementRows = [
  ["numerical-weather-prediction", "meteorology", 5, 0.3, true],
  ["numerical-weather-prediction", "nwp", 5, 0.3, true],
  ["numerical-weather-prediction", "data-analysis", 4, 0.15, false],
  ["numerical-weather-prediction", "python", 3, 0.1, false],
  ["numerical-weather-prediction", "forecasting", 4, 0.15, false],
  ["satellite-meteorology", "meteorology", 5, 0.4, true],
  ["satellite-meteorology", "forecasting", 4, 0.3, false],
  ["satellite-meteorology", "data-analysis", 4, 0.3, false],
  ["data-analysis", "data-analysis", 5, 0.45, true],
  ["data-analysis", "python", 4, 0.35, true],
  ["data-analysis", "meteorology", 3, 0.2, false],
] as const;

const trainerRows = [
  { id: "ananya-sharma", name: "Dr. Ananya Sharma", title: "Lead Numerical Modelling Specialist", experienceYears: 12, relevantTrainings: 9, certificationScore: 90 },
  { id: "kavita-verma", name: "Dr. Kavita Verma", title: "Satellite Applications Lead", experienceYears: 10, relevantTrainings: 7, certificationScore: 90 },
  { id: "rohan-iyer", name: "Dr. Rohan Iyer", title: "Climate Analytics Researcher", experienceYears: 8, relevantTrainings: 6, certificationScore: 90 },
];

const trainerCompetencyRows = [
  ["ananya-sharma", "meteorology", 5],
  ["ananya-sharma", "nwp", 5],
  ["ananya-sharma", "data-analysis", 4],
  ["ananya-sharma", "python", 3],
  ["ananya-sharma", "forecasting", 5],
  ["kavita-verma", "meteorology", 5],
  ["kavita-verma", "nwp", 3],
  ["kavita-verma", "data-analysis", 4],
  ["kavita-verma", "python", 3],
  ["kavita-verma", "forecasting", 4],
  ["rohan-iyer", "meteorology", 4],
  ["rohan-iyer", "nwp", 3],
  ["rohan-iyer", "data-analysis", 5],
  ["rohan-iyer", "python", 5],
  ["rohan-iyer", "forecasting", 3],
] as const;

const traineeCompetencyRows = [
  ["trainee-001", "meteorology", 78, 6],
  ["trainee-001", "nwp", 52, 11],
  ["trainee-001", "data-analysis", 67, 3],
  ["trainee-001", "python", 43, 8],
  ["trainee-001", "forecasting", 71, 4],
] as const;

const adminCourseRows = [
  {
    id: "course-nwp-foundations",
    subjectId: "numerical-weather-prediction",
    title: "Introduction to Numerical Weather Prediction",
    description: "A practical foundation in forecast models, data assimilation, and verification for operational meteorology.",
    category: "Forecasting",
    difficulty: "Intermediate",
    durationHours: 18,
    status: "PUBLISHED",
  },
  {
    id: "course-satellite-meteorology",
    subjectId: "satellite-meteorology",
    title: "Satellite Meteorology Fundamentals",
    description: "Interpret multispectral imagery for cloud analysis, rainfall estimation, and severe weather monitoring.",
    category: "Observation",
    difficulty: "Beginner",
    durationHours: 12,
    status: "PUBLISHED",
  },
  {
    id: "course-climate-data",
    subjectId: "data-analysis",
    title: "Climate Data Analysis",
    description: "Prepare climate datasets, quantify trends, and communicate uncertainty for planning and policy.",
    category: "Data",
    difficulty: "Advanced",
    durationHours: 24,
    status: "PENDING_REVIEW",
  },
] as const;

const adminAssessmentRows = [
  {
    id: "assessment-nwp-checkpoint",
    courseId: "course-nwp-foundations",
    subjectId: "numerical-weather-prediction",
    title: "NWP Foundations Checkpoint",
    description: "A short checkpoint covering model architecture, data assimilation, and verification.",
    status: "PUBLISHED",
    durationMinutes: 20,
    passingScore: 70,
    attemptLimit: 2,
  },
] as const;

const resourceRows = [
  { id: "resource-nwp-overview", courseId: "nwp-fundamentals", moduleId: "nwp-1", title: "NWP forecast cycle overview", description: "A concise reference for the operational forecast cycle.", resourceType: "ARTICLE", resourceUrl: "" },
  { id: "resource-nwp-assimilation", courseId: "nwp-fundamentals", moduleId: "nwp-2", title: "Data assimilation field guide", description: "Review the role of observations and the model state.", resourceType: "GUIDE", resourceUrl: "" },
  { id: "resource-satellite-imagery", courseId: "satellite-meteorology", moduleId: "sat-2", title: "Multispectral imagery reference", description: "Reference notes for visible, infrared, and water vapour products.", resourceType: "GUIDE", resourceUrl: "" },
  { id: "resource-climate-data-quality", courseId: "climate-data", moduleId: "climate-1", title: "Climate data quality checklist", description: "A practical checklist for preparing station and gridded datasets.", resourceType: "CHECKLIST", resourceUrl: "" },
] as const;

async function seed() {
  await db.transaction(async (tx) => {
    await tx.insert(competencyLevels).values(levels).onConflictDoUpdate({
      target: competencyLevels.level,
      set: {
        title: competencyLevels.title,
        description: competencyLevels.description,
        scoreThreshold: competencyLevels.scoreThreshold,
      },
    });

    for (const row of competencyRows) {
      await tx.insert(competencies).values(row).onConflictDoUpdate({
        target: competencies.id,
        set: { name: row.name, color: row.color, updatedAt: new Date() },
      });
    }

    for (const row of subjectRows) {
      await tx.insert(subjects).values(row).onConflictDoUpdate({
        target: subjects.id,
        set: { name: row.name, slug: row.slug, updatedAt: new Date() },
      });
    }

    for (const [subjectId, competencyId, requiredLevel, weight, mandatory] of subjectRequirementRows) {
      await tx.insert(subjectCompetencies).values({
        subjectId,
        competencyId,
        requiredLevel,
        weight,
        mandatory,
      }).onConflictDoUpdate({
        target: [subjectCompetencies.subjectId, subjectCompetencies.competencyId],
        set: { requiredLevel, weight, mandatory },
      });
    }

    for (const row of trainerRows) {
      await tx.insert(trainers).values(row).onConflictDoUpdate({
        target: trainers.id,
        set: {
          name: row.name,
          title: row.title,
          experienceYears: row.experienceYears,
          relevantTrainings: row.relevantTrainings,
          certificationScore: row.certificationScore,
          updatedAt: new Date(),
        },
      });
    }

    for (const [trainerId, competencyId, level] of trainerCompetencyRows) {
      await tx.insert(trainerCompetencies).values({
        trainerId,
        competencyId,
        level,
        qualificationScore: level * 20,
        experienceScore: 80,
        certificationScore: 90,
        assessmentScore: level * 20,
        trainingHistoryScore: 75,
        verificationScore: 100,
      }).onConflictDoUpdate({
        target: [trainerCompetencies.trainerId, trainerCompetencies.competencyId],
        set: {
          level,
          qualificationScore: level * 20,
          assessmentScore: level * 20,
          updatedAt: new Date(),
        },
      });
    }

    for (const [traineeId, competencyId, score, trend] of traineeCompetencyRows) {
      await tx.insert(traineeCompetencies).values({
        traineeId,
        competencyId,
        score,
        trend,
        qualificationScore: score,
        experienceScore: score,
        certificationScore: score,
        assessmentScore: score,
        trainingHistoryScore: score,
        verificationScore: score,
      }).onConflictDoUpdate({
        target: [traineeCompetencies.traineeId, traineeCompetencies.competencyId],
        set: {
          score,
          trend,
          qualificationScore: score,
          experienceScore: score,
          certificationScore: score,
          assessmentScore: score,
          trainingHistoryScore: score,
          verificationScore: score,
          updatedAt: new Date(),
        },
      });
    }

    for (const row of adminCourseRows) {
      await tx.insert(adminCourses).values(row).onConflictDoUpdate({
        target: adminCourses.id,
        set: {
          subjectId: row.subjectId,
          title: row.title,
          description: row.description,
          category: row.category,
          difficulty: row.difficulty,
          durationHours: row.durationHours,
          status: row.status,
          updatedAt: new Date(),
        },
      });
    }

    for (const row of adminAssessmentRows) {
      await tx.insert(adminAssessments).values(row).onConflictDoUpdate({
        target: adminAssessments.id,
        set: {
          courseId: row.courseId,
          subjectId: row.subjectId,
          title: row.title,
          description: row.description,
          status: row.status,
          durationMinutes: row.durationMinutes,
          passingScore: row.passingScore,
          attemptLimit: row.attemptLimit,
          updatedAt: new Date(),
        },
      });
    }

    for (const row of resourceRows) {
      await tx.insert(courseResources).values(row).onConflictDoUpdate({
        target: courseResources.id,
        set: {
          courseId: row.courseId,
          moduleId: row.moduleId,
          title: row.title,
          description: row.description,
          resourceType: row.resourceType,
          resourceUrl: row.resourceUrl,
          status: "PUBLISHED",
          updatedAt: new Date(),
        },
      });
    }

    await tx.insert(contentAnnouncements).values({
      id: "announcement-capacity-connect-launch",
      title: "Capacity Connect learning network is open",
      description: "Explore competency-led training, expert-led courses, and new operational learning resources.",
      targetAudience: "ALL",
      status: "PUBLISHED",
    }).onConflictDoUpdate({
      target: contentAnnouncements.id,
      set: { title: "Capacity Connect learning network is open", description: "Explore competency-led training, expert-led courses, and new operational learning resources.", status: "PUBLISHED", updatedAt: new Date() },
    });

    await tx.insert(contentNotifications).values({
      id: "notification-welcome-admin",
      title: "Review the new learning catalogue",
      description: "New IMD-focused learning paths are available for review.",
      notificationType: "GENERAL",
      targetAudience: "ALL",
      status: "PUBLISHED",
    }).onConflictDoUpdate({
      target: contentNotifications.id,
      set: { title: "Review the new learning catalogue", description: "New IMD-focused learning paths are available for review.", status: "PUBLISHED", updatedAt: new Date() },
    });

    await tx.insert(contentAchievements).values({
      id: "achievement-imd-network",
      title: "Operational learning network established",
      description: "Capacity Connect brings competency evidence, learning, and trainer expertise into one workflow.",
      personOrTeam: "Capacity Connect team",
    }).onConflictDoUpdate({
      target: contentAchievements.id,
      set: { title: "Operational learning network established", description: "Capacity Connect brings competency evidence, learning, and trainer expertise into one workflow.", personOrTeam: "Capacity Connect team", updatedAt: new Date() },
    });
  });

  console.log("Database seed completed.");
}

seed()
  .catch((error) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });