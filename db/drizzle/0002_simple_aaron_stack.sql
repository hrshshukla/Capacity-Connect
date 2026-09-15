CREATE TABLE "cc_course_resources" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"module_id" text,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"resource_type" text DEFAULT 'ARTICLE' NOT NULL,
	"resource_url" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'PUBLISHED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_trainee_assessment_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"assessment_id" text NOT NULL,
	"course_id" text DEFAULT '' NOT NULL,
	"score" real DEFAULT 0 NOT NULL,
	"percentage" real DEFAULT 0 NOT NULL,
	"passed" boolean DEFAULT false NOT NULL,
	"answers" text DEFAULT '{}' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_trainee_certificates" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"issuer" text DEFAULT '' NOT NULL,
	"issued_date" text DEFAULT '' NOT NULL,
	"credential_url" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_trainee_certificates_issued" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'ISSUED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_trainee_enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"progress" real DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_trainee_experiences" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization" text NOT NULL,
	"role" text NOT NULL,
	"start_date" text DEFAULT '' NOT NULL,
	"end_date" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_trainee_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"content_type" text DEFAULT 'COURSE' NOT NULL,
	"rating" integer NOT NULL,
	"content_quality" integer NOT NULL,
	"trainer_quality" integer NOT NULL,
	"usefulness" integer NOT NULL,
	"comments" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_trainee_interests" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_trainee_module_progress" (
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"module_id" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cc_trainee_module_progress_user_id_module_id_pk" PRIMARY KEY("user_id","module_id")
);
--> statement-breakpoint
CREATE TABLE "cc_trainee_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"headline" text DEFAULT '' NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_trainee_qualifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"institution" text NOT NULL,
	"qualification" text NOT NULL,
	"field" text DEFAULT '' NOT NULL,
	"year" integer,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_trainee_skills" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"proficiency" text DEFAULT 'Working' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cc_trainee_assessment_attempts" ADD CONSTRAINT "cc_trainee_assessment_attempts_user_id_cc_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."cc_user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_trainee_certificates" ADD CONSTRAINT "cc_trainee_certificates_user_id_cc_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."cc_user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_trainee_certificates_issued" ADD CONSTRAINT "cc_trainee_certificates_issued_user_id_cc_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."cc_user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_trainee_enrollments" ADD CONSTRAINT "cc_trainee_enrollments_user_id_cc_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."cc_user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_trainee_experiences" ADD CONSTRAINT "cc_trainee_experiences_user_id_cc_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."cc_user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_trainee_feedback" ADD CONSTRAINT "cc_trainee_feedback_user_id_cc_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."cc_user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_trainee_interests" ADD CONSTRAINT "cc_trainee_interests_user_id_cc_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."cc_user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_trainee_module_progress" ADD CONSTRAINT "cc_trainee_module_progress_user_id_cc_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."cc_user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_trainee_profiles" ADD CONSTRAINT "cc_trainee_profiles_user_id_cc_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."cc_user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_trainee_qualifications" ADD CONSTRAINT "cc_trainee_qualifications_user_id_cc_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."cc_user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_trainee_skills" ADD CONSTRAINT "cc_trainee_skills_user_id_cc_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."cc_user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cc_course_resources_course_idx" ON "cc_course_resources" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "cc_course_resources_module_idx" ON "cc_course_resources" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "cc_trainee_attempts_user_idx" ON "cc_trainee_assessment_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cc_trainee_attempts_assessment_idx" ON "cc_trainee_assessment_attempts" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "cc_trainee_certificates_user_idx" ON "cc_trainee_certificates" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cc_trainee_issued_cert_user_course_idx" ON "cc_trainee_certificates_issued" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE INDEX "cc_trainee_issued_cert_user_idx" ON "cc_trainee_certificates_issued" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cc_trainee_enrollments_user_course_idx" ON "cc_trainee_enrollments" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE INDEX "cc_trainee_enrollments_user_idx" ON "cc_trainee_enrollments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cc_trainee_enrollments_course_idx" ON "cc_trainee_enrollments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "cc_trainee_experiences_user_idx" ON "cc_trainee_experiences" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cc_trainee_feedback_user_course_type_idx" ON "cc_trainee_feedback" USING btree ("user_id","course_id","content_type");--> statement-breakpoint
CREATE INDEX "cc_trainee_feedback_course_idx" ON "cc_trainee_feedback" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "cc_trainee_interests_user_idx" ON "cc_trainee_interests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cc_trainee_progress_user_course_idx" ON "cc_trainee_module_progress" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE INDEX "cc_trainee_qualifications_user_idx" ON "cc_trainee_qualifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cc_trainee_skills_user_idx" ON "cc_trainee_skills" USING btree ("user_id");