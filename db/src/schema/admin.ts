import {
  boolean,
  integer,
  index,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { userProfiles, subjects, competencies } from "./capacity";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const userDocuments = pgTable(
  "cc_user_documents",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
    documentType: text("document_type").notNull(),
    title: text("title").notNull(),
    storagePath: text("storage_path").notNull(),
    reviewStatus: text("review_status").default("PENDING").notNull(),
    rejectionReason: text("rejection_reason").default("").notNull(),
    reviewedBy: text("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("cc_user_documents_user_idx").on(table.userId),
    index("cc_user_documents_status_idx").on(table.reviewStatus),
  ],
);

export const adminCourses = pgTable(
  "cc_courses",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").references(() => userProfiles.id, { onDelete: "set null" }),
    subjectId: text("subject_id").references(() => subjects.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description").default("").notNull(),
    category: text("category").default("").notNull(),
    difficulty: text("difficulty").default("Intermediate").notNull(),
    durationHours: real("duration_hours").default(0).notNull(),
    status: text("status").default("DRAFT").notNull(),
    rejectionReason: text("rejection_reason").default("").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("cc_courses_status_idx").on(table.status),
    index("cc_courses_owner_idx").on(table.ownerId),
    index("cc_courses_subject_idx").on(table.subjectId),
  ],
);

export const courseModules = pgTable(
  "cc_course_modules",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id").notNull().references(() => adminCourses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").default("").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (table) => [index("cc_course_modules_course_idx").on(table.courseId)],
);

export const adminAssessments = pgTable(
  "cc_assessments",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").references(() => userProfiles.id, { onDelete: "set null" }),
    courseId: text("course_id").references(() => adminCourses.id, { onDelete: "set null" }),
    subjectId: text("subject_id").references(() => subjects.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description").default("").notNull(),
    status: text("status").default("DRAFT").notNull(),
    durationMinutes: integer("duration_minutes").default(30).notNull(),
    passingScore: real("passing_score").default(70).notNull(),
    attemptLimit: integer("attempt_limit").default(1).notNull(),
    deadline: timestamp("deadline", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("cc_assessments_status_idx").on(table.status),
    index("cc_assessments_course_idx").on(table.courseId),
    index("cc_assessments_owner_idx").on(table.ownerId),
  ],
);

export const assessmentQuestions = pgTable(
  "cc_assessment_questions",
  {
    id: text("id").primaryKey(),
    assessmentId: text("assessment_id").notNull().references(() => adminAssessments.id, { onDelete: "cascade" }),
    competencyId: text("competency_id").references(() => competencies.id, { onDelete: "set null" }),
    prompt: text("prompt").notNull(),
    options: text("options").default("[]").notNull(),
    correctOption: integer("correct_option").default(0).notNull(),
    marks: real("marks").default(1).notNull(),
    explanation: text("explanation").default("").notNull(),
    ...timestamps,
  },
  (table) => [index("cc_assessment_questions_assessment_idx").on(table.assessmentId)],
);

export const assessmentAttempts = pgTable(
  "cc_assessment_attempts",
  {
    id: text("id").primaryKey(),
    assessmentId: text("assessment_id").notNull().references(() => adminAssessments.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
    score: real("score").default(0).notNull(),
    passed: boolean("passed").default(false).notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("cc_assessment_attempts_assessment_idx").on(table.assessmentId),
    index("cc_assessment_attempts_user_idx").on(table.userId),
  ],
);

export const adminEnrollments = pgTable(
  "cc_enrollments",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id").notNull().references(() => adminCourses.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
    progress: real("progress").default(0).notNull(),
    status: text("status").default("ACTIVE").notNull(),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("cc_enrollments_course_idx").on(table.courseId),
    index("cc_enrollments_user_idx").on(table.userId),
    index("cc_enrollments_status_idx").on(table.status),
  ],
);

export const adminCertificates = pgTable(
  "cc_certificates",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id").notNull().references(() => adminCourses.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
    status: text("status").default("ISSUED").notNull(),
    ...timestamps,
  },
  (table) => [
    index("cc_certificates_course_idx").on(table.courseId),
    index("cc_certificates_user_idx").on(table.userId),
  ],
);

export const contentAnnouncements = pgTable(
  "cc_announcements",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").default("").notNull(),
    imagePath: text("image_path"),
    targetAudience: text("target_audience").default("ALL").notNull(),
    status: text("status").default("DRAFT").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("cc_announcements_status_idx").on(table.status)],
);

export const contentNotifications = pgTable(
  "cc_content_notifications",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").default("").notNull(),
    notificationType: text("notification_type").default("GENERAL").notNull(),
    targetAudience: text("target_audience").default("ALL").notNull(),
    status: text("status").default("DRAFT").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("cc_content_notifications_status_idx").on(table.status)],
);

export const contentAchievements = pgTable(
  "cc_achievements",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").default("").notNull(),
    achievementDate: timestamp("achievement_date", { withTimezone: true }),
    imagePath: text("image_path"),
    personOrTeam: text("person_or_team").default("").notNull(),
    status: text("status").default("DRAFT").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
);

export const learningContents = pgTable(
  "cc_learning_contents",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id").references(() => adminCourses.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description").default("").notNull(),
    contentType: text("content_type").default("ARTICLE").notNull(),
    resourcePath: text("resource_path"),
    status: text("status").default("DRAFT").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("cc_learning_contents_status_idx").on(table.status),
    index("cc_learning_contents_course_idx").on(table.courseId),
  ],
);

export const trainerLibraryItems = pgTable(
  "cc_trainer_library_items",
  {
    id: text("id").primaryKey(),
    trainerId: text("trainer_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").default("").notNull(),
    itemType: text("item_type").notNull(),
    storagePath: text("storage_path"),
    resourceUrl: text("resource_url"),
    status: text("status").default("DRAFT").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("cc_trainer_library_trainer_idx").on(table.trainerId),
    index("cc_trainer_library_status_idx").on(table.status),
  ],
);

export const adminSettings = pgTable("cc_admin_settings", {
  key: text("key").primaryKey(),
  value: text("value").default("").notNull(),
  updatedBy: text("updated_by").references(() => userProfiles.id, { onDelete: "set null" }),
  ...timestamps,
});

export const adminInvitations = pgTable(
  "cc_admin_invitations",
  {
    id: text("id").primaryKey(),
    invitedName: text("invited_name").notNull(),
    invitedEmail: text("invited_email").notNull(),
    creatorId: text("creator_id").notNull().references(() => userProfiles.id),
    authUserId: text("auth_user_id"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("cc_admin_invitations_email_idx").on(table.invitedEmail),
    index("cc_admin_invitations_expiry_idx").on(table.expiresAt),
  ],
);