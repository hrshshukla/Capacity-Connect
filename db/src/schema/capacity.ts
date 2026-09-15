import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const userProfiles = pgTable("cc_user_profiles", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").default("TRAINEE").notNull(),
  approvalStatus: text("approval_status").default("PENDING").notNull(),
  rejectionReason: text("rejection_reason").default("").notNull(),
  department: text("department").default("").notNull(),
  title: text("title").default("").notNull(),
  bio: text("bio").default("").notNull(),
  qualifications: text("qualifications").default("").notNull(),
  interests: text("interests").default("").notNull(),
  experienceYears: integer("experience_years").default(0).notNull(),
  avatarPath: text("avatar_path"),
  ...timestamps,
});

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  metadata: text("metadata").default("{}").notNull(),
  ...timestamps,
});

export const subjects = pgTable("cc_subjects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ...timestamps,
});

export const competencies = pgTable("cc_competencies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  ...timestamps,
});

export const competencyLevels = pgTable("cc_competency_levels", {
  level: integer("level").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  scoreThreshold: integer("score_threshold").notNull(),
});

export const subjectCompetencies = pgTable(
  "cc_subject_competencies",
  {
    subjectId: text("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    competencyId: text("competency_id")
      .notNull()
      .references(() => competencies.id, { onDelete: "cascade" }),
    requiredLevel: integer("required_level").notNull(),
    weight: real("weight").notNull(),
    mandatory: boolean("mandatory").default(false).notNull(),
  },
  (table) => [primaryKey({ columns: [table.subjectId, table.competencyId] })],
);

export const traineeCompetencies = pgTable(
  "cc_trainee_competencies",
  {
    traineeId: text("trainee_id").notNull(),
    competencyId: text("competency_id")
      .notNull()
      .references(() => competencies.id, { onDelete: "cascade" }),
    score: real("score").default(0).notNull(),
    trend: real("trend").default(0).notNull(),
    qualificationScore: real("qualification_score").default(0).notNull(),
    experienceScore: real("experience_score").default(0).notNull(),
    certificationScore: real("certification_score").default(0).notNull(),
    assessmentScore: real("assessment_score").default(0).notNull(),
    trainingHistoryScore: real("training_history_score").default(0).notNull(),
    verificationScore: real("verification_score").default(0).notNull(),
    ...timestamps,
  },
  (table) => [primaryKey({ columns: [table.traineeId, table.competencyId] })],
);

export const trainers = pgTable("cc_trainers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  experienceYears: integer("experience_years").default(0).notNull(),
  relevantTrainings: integer("relevant_trainings").default(0).notNull(),
  certificationScore: real("certification_score").default(0).notNull(),
  ...timestamps,
});

export const trainerCompetencies = pgTable(
  "cc_trainer_competencies",
  {
    trainerId: text("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    competencyId: text("competency_id")
      .notNull()
      .references(() => competencies.id, { onDelete: "cascade" }),
    level: integer("level").notNull(),
    qualificationScore: real("qualification_score").default(0).notNull(),
    experienceScore: real("experience_score").default(0).notNull(),
    certificationScore: real("certification_score").default(0).notNull(),
    assessmentScore: real("assessment_score").default(0).notNull(),
    trainingHistoryScore: real("training_history_score").default(0).notNull(),
    verificationScore: real("verification_score").default(0).notNull(),
    ...timestamps,
  },
  (table) => [primaryKey({ columns: [table.trainerId, table.competencyId] })],
);