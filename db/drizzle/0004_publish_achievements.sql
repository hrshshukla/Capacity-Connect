ALTER TABLE "cc_achievements" ADD COLUMN "status" text DEFAULT 'DRAFT' NOT NULL;
ALTER TABLE "cc_achievements" ADD COLUMN "published_at" timestamp with time zone;
--> statement-breakpoint
CREATE INDEX "cc_achievements_status_idx" ON "cc_achievements" USING btree ("status");