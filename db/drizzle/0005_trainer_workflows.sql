ALTER TABLE "cc_assessments" ADD COLUMN "owner_id" text;
--> statement-breakpoint
ALTER TABLE "cc_assessments" ADD CONSTRAINT "cc_assessments_owner_id_cc_user_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."cc_user_profiles"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "cc_assessments_owner_idx" ON "cc_assessments" USING btree ("owner_id");
--> statement-breakpoint
CREATE TABLE "cc_trainer_library_items" (
"id" text PRIMARY KEY NOT NULL,
"trainer_id" text NOT NULL,
"title" text NOT NULL,
"description" text DEFAULT '' NOT NULL,
"item_type" text NOT NULL,
"storage_path" text,
"resource_url" text,
"status" text DEFAULT 'DRAFT' NOT NULL,
"published_at" timestamp with time zone,
"created_at" timestamp with time zone DEFAULT now() NOT NULL,
"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cc_trainer_library_items" ADD CONSTRAINT "cc_trainer_library_items_trainer_id_cc_user_profiles_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."cc_user_profiles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "cc_trainer_library_trainer_idx" ON "cc_trainer_library_items" USING btree ("trainer_id");
--> statement-breakpoint
CREATE INDEX "cc_trainer_library_status_idx" ON "cc_trainer_library_items" USING btree ("status");