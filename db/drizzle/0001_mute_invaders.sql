CREATE TABLE "cc_assessments" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text,
	"subject_id" text,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"duration_minutes" integer DEFAULT 30 NOT NULL,
	"passing_score" real DEFAULT 70 NOT NULL,
	"attempt_limit" integer DEFAULT 1 NOT NULL,
	"deadline" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_certificates" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'ISSUED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_courses" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text,
	"subject_id" text,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"difficulty" text DEFAULT 'Intermediate' NOT NULL,
	"duration_hours" real DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"rejection_reason" text DEFAULT '' NOT NULL,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"user_id" text NOT NULL,
	"progress" real DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_admin_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text DEFAULT '' NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_assessment_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"assessment_id" text NOT NULL,
	"user_id" text NOT NULL,
	"score" real DEFAULT 0 NOT NULL,
	"passed" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_assessment_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"assessment_id" text NOT NULL,
	"competency_id" text,
	"prompt" text NOT NULL,
	"options" text DEFAULT '[]' NOT NULL,
	"correct_option" integer DEFAULT 0 NOT NULL,
	"marks" real DEFAULT 1 NOT NULL,
	"explanation" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_achievements" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"achievement_date" timestamp with time zone,
	"image_path" text,
	"person_or_team" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"image_path" text,
	"target_audience" text DEFAULT 'ALL' NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_content_notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"notification_type" text DEFAULT 'GENERAL' NOT NULL,
	"target_audience" text DEFAULT 'ALL' NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_course_modules" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_learning_contents" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"content_type" text DEFAULT 'ARTICLE' NOT NULL,
	"resource_path" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_user_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"document_type" text NOT NULL,
	"title" text NOT NULL,
	"storage_path" text NOT NULL,
	"review_status" text DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" text DEFAULT '' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cc_user_profiles" ADD COLUMN "rejection_reason" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "cc_assessments" ADD CONSTRAINT "cc_assessments_course_id_cc_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."cc_courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_assessments" ADD CONSTRAINT "cc_assessments_subject_id_cc_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."cc_subjects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_certificates" ADD CONSTRAINT "cc_certificates_course_id_cc_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."cc_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_certificates" ADD CONSTRAINT "cc_certificates_user_id_cc_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."cc_user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_courses" ADD CONSTRAINT "cc_courses_owner_id_cc_user_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."cc_user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_courses" ADD CONSTRAINT "cc_courses_subject_id_cc_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."cc_subjects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_enrollments" ADD CONSTRAINT "cc_enrollments_course_id_cc_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."cc_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_enrollments" ADD CONSTRAINT "cc_enrollments_user_id_cc_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."cc_user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_admin_settings" ADD CONSTRAINT "cc_admin_settings_updated_by_cc_user_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."cc_user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_assessment_attempts" ADD CONSTRAINT "cc_assessment_attempts_assessment_id_cc_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."cc_assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_assessment_attempts" ADD CONSTRAINT "cc_assessment_attempts_user_id_cc_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."cc_user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_assessment_questions" ADD CONSTRAINT "cc_assessment_questions_assessment_id_cc_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."cc_assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_assessment_questions" ADD CONSTRAINT "cc_assessment_questions_competency_id_cc_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."cc_competencies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_course_modules" ADD CONSTRAINT "cc_course_modules_course_id_cc_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."cc_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_learning_contents" ADD CONSTRAINT "cc_learning_contents_course_id_cc_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."cc_courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_user_documents" ADD CONSTRAINT "cc_user_documents_user_id_cc_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."cc_user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cc_assessments_status_idx" ON "cc_assessments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cc_assessments_course_idx" ON "cc_assessments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "cc_certificates_course_idx" ON "cc_certificates" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "cc_certificates_user_idx" ON "cc_certificates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cc_courses_status_idx" ON "cc_courses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cc_courses_owner_idx" ON "cc_courses" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "cc_courses_subject_idx" ON "cc_courses" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "cc_enrollments_course_idx" ON "cc_enrollments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "cc_enrollments_user_idx" ON "cc_enrollments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cc_enrollments_status_idx" ON "cc_enrollments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cc_assessment_attempts_assessment_idx" ON "cc_assessment_attempts" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "cc_assessment_attempts_user_idx" ON "cc_assessment_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cc_assessment_questions_assessment_idx" ON "cc_assessment_questions" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "cc_announcements_status_idx" ON "cc_announcements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cc_content_notifications_status_idx" ON "cc_content_notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cc_course_modules_course_idx" ON "cc_course_modules" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "cc_learning_contents_status_idx" ON "cc_learning_contents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cc_learning_contents_course_idx" ON "cc_learning_contents" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "cc_user_documents_user_idx" ON "cc_user_documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cc_user_documents_status_idx" ON "cc_user_documents" USING btree ("review_status");