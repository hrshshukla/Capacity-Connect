import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { userProfiles } from "./capacity";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const traineeProfiles = pgTable("cc_trainee_profiles", {
  userId: text("user_id").primaryKey().references(() => userProfiles.id, { onDelete: "cascade" }),
  phone: text("phone").default("").notNull(),
  location: text("location").default("").notNull(),
  headline: text("headline").default("").notNull(),
  summary: text("summary").default("").notNull(),
  ...timestamps,
});

export const traineeQualifications = pgTable(
  "cc_trainee_qualifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
    institution: text("institution").notNull(),
    qualification: text("qualification").notNull(),
    field: text("field").default("").notNull(),
    year: integer("year"),
    description: text("description").default("").notNull(),
    ...timestamps,
  },
  (table) => [index("cc_trainee_qualifications_user_idx").on(table.userId)],
);

export const traineeExperiences = pgTable(
  "cc_trainee_experiences",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
    organization: text("organization").notNull(),
    role: text("role").notNull(),
    startDate: text("start_date").default("").notNull(),
    endDate: text("end_date").default("").notNull(),
    description: text("description").default("").notNull(),
    ...timestamps,
  },
  (table) => [index("cc_trainee_experiences_user_idx").on(table.userId)],
);

export const traineeSkills = pgTable(
  "cc_trainee_skills",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    proficiency: text("proficiency").default("Working").notNull(),
    ...timestamps,
  },
  (table) => [index("cc_trainee_skills_user_idx").on(table.userId)],
);

export const traineeInterests = pgTable(
  "cc_trainee_interests",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    ...timestamps,
  },
  (table) => [index("cc_trainee_interests_user_idx").on(table.userId)],
);

export const traineeCertificates = pgTable(
  "cc_trainee_certificates",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    issuer: text("issuer").default("").notNull(),
    issuedDate: text("issued_date").default("").notNull(),
    credentialUrl: text("credential_url").default("").notNull(),
    ...timestamps,
  },
  (table) => [index("cc_trainee_certificates_user_idx").on(table.userId)],
);

export const traineeEnrollments = pgTable(
  "cc_trainee_enrollments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull(),
    progress: real("progress").default(0).notNull(),
    status: text("status").default("ACTIVE").notNull(),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("cc_trainee_enrollments_user_course_idx").on(table.userId, table.courseId),
    index("cc_trainee_enrollments_user_idx").on(table.userId),
    index("cc_trainee_enrollments_course_idx").on(table.courseId),
  ],
);

export const traineeModuleProgress = pgTable(
  "cc_trainee_module_progress",
  {
    userId: text("user_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull(),
    moduleId: text("module_id").notNull(),
    completed: boolean("completed").default(false).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [primaryKey({ columns: [table.userId, table.moduleId] }), index("cc_trainee_progress_user_course_idx").on(table.userId, table.courseId)],
);

export const traineeAssessmentAttempts = pgTable(
  "cc_trainee_assessment_attempts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
    assessmentId: text("assessment_id").notNull(),
    courseId: text("course_id").default("").notNull(),
    score: real("score").default(0).notNull(),
    percentage: real("percentage").default(0).notNull(),
    passed: boolean("passed").default(false).notNull(),
    answers: text("answers").default("{}").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
    ...timestamps,
  },
  (table) => [
    index("cc_trainee_attempts_user_idx").on(table.userId),
    index("cc_trainee_attempts_assessment_idx").on(table.assessmentId),
  ],
);

export const traineeFeedback = pgTable(
  "cc_trainee_feedback",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull(),
    contentType: text("content_type").default("COURSE").notNull(),
    rating: integer("rating").notNull(),
    contentQuality: integer("content_quality").notNull(),
    trainerQuality: integer("trainer_quality").notNull(),
    usefulness: integer("usefulness").notNull(),
    comments: text("comments").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("cc_trainee_feedback_user_course_type_idx").on(table.userId, table.courseId, table.contentType),
    index("cc_trainee_feedback_course_idx").on(table.courseId),
  ],
);

export const courseResources = pgTable(
  "cc_course_resources",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id").notNull(),
    moduleId: text("module_id"),
    title: text("title").notNull(),
    description: text("description").default("").notNull(),
    resourceType: text("resource_type").default("ARTICLE").notNull(),
    resourceUrl: text("resource_url").default("").notNull(),
    status: text("status").default("PUBLISHED").notNull(),
    ...timestamps,
  },
  (table) => [
    index("cc_course_resources_course_idx").on(table.courseId),
    index("cc_course_resources_module_idx").on(table.moduleId),
  ],
);

export const traineeCertificatesIssued = pgTable(
  "cc_trainee_certificates_issued",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull(),
    title: text("title").notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
    status: text("status").default("ISSUED").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("cc_trainee_issued_cert_user_course_idx").on(table.userId, table.courseId),
    index("cc_trainee_issued_cert_user_idx").on(table.userId),
  ],
);