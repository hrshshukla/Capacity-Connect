CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"metadata" text DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_competencies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_competency_levels" (
	"level" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"score_threshold" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_subject_competencies" (
	"subject_id" text NOT NULL,
	"competency_id" text NOT NULL,
	"required_level" integer NOT NULL,
	"weight" real NOT NULL,
	"mandatory" boolean DEFAULT false NOT NULL,
	CONSTRAINT "cc_subject_competencies_subject_id_competency_id_pk" PRIMARY KEY("subject_id","competency_id")
);
--> statement-breakpoint
CREATE TABLE "cc_subjects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cc_subjects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "cc_trainee_competencies" (
	"trainee_id" text NOT NULL,
	"competency_id" text NOT NULL,
	"score" real DEFAULT 0 NOT NULL,
	"trend" real DEFAULT 0 NOT NULL,
	"qualification_score" real DEFAULT 0 NOT NULL,
	"experience_score" real DEFAULT 0 NOT NULL,
	"certification_score" real DEFAULT 0 NOT NULL,
	"assessment_score" real DEFAULT 0 NOT NULL,
	"training_history_score" real DEFAULT 0 NOT NULL,
	"verification_score" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cc_trainee_competencies_trainee_id_competency_id_pk" PRIMARY KEY("trainee_id","competency_id")
);
--> statement-breakpoint
CREATE TABLE "cc_trainer_competencies" (
	"trainer_id" text NOT NULL,
	"competency_id" text NOT NULL,
	"level" integer NOT NULL,
	"qualification_score" real DEFAULT 0 NOT NULL,
	"experience_score" real DEFAULT 0 NOT NULL,
	"certification_score" real DEFAULT 0 NOT NULL,
	"assessment_score" real DEFAULT 0 NOT NULL,
	"training_history_score" real DEFAULT 0 NOT NULL,
	"verification_score" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cc_trainer_competencies_trainer_id_competency_id_pk" PRIMARY KEY("trainer_id","competency_id")
);
--> statement-breakpoint
CREATE TABLE "cc_trainers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"experience_years" integer DEFAULT 0 NOT NULL,
	"relevant_trainings" integer DEFAULT 0 NOT NULL,
	"certification_score" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cc_user_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'TRAINEE' NOT NULL,
	"approval_status" text DEFAULT 'PENDING' NOT NULL,
	"department" text DEFAULT '' NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"qualifications" text DEFAULT '' NOT NULL,
	"interests" text DEFAULT '' NOT NULL,
	"experience_years" integer DEFAULT 0 NOT NULL,
	"avatar_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cc_user_profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "cc_subject_competencies" ADD CONSTRAINT "cc_subject_competencies_subject_id_cc_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."cc_subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_subject_competencies" ADD CONSTRAINT "cc_subject_competencies_competency_id_cc_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."cc_competencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_trainee_competencies" ADD CONSTRAINT "cc_trainee_competencies_competency_id_cc_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."cc_competencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_trainer_competencies" ADD CONSTRAINT "cc_trainer_competencies_trainer_id_cc_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."cc_trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cc_trainer_competencies" ADD CONSTRAINT "cc_trainer_competencies_competency_id_cc_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."cc_competencies"("id") ON DELETE cascade ON UPDATE no action;