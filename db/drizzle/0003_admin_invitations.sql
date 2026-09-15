CREATE TABLE "cc_admin_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"invited_name" text NOT NULL,
	"invited_email" text NOT NULL,
	"creator_id" text NOT NULL,
	"auth_user_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cc_admin_invitations" ADD CONSTRAINT "cc_admin_invitations_creator_id_cc_user_profiles_id_fk" FOREIGN KEY ("creator_id") REFERENCES "cc_user_profiles"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "cc_admin_invitations_email_idx" ON "cc_admin_invitations" USING btree ("invited_email");
--> statement-breakpoint
CREATE INDEX "cc_admin_invitations_expiry_idx" ON "cc_admin_invitations" USING btree ("expires_at");