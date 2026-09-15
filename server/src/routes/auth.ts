import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { timingSafeEqual } from "node:crypto";
import { db } from "../../../db/src";
import { userProfiles } from "../../../db/src/schema";
import { and, count, eq, isNull, gt } from "drizzle-orm";
import { adminInvitations } from "../../../db/src/schema";
import { authenticate, hasSuperAdminAccess, requireAuth, requireRole, approvalStatus } from "../middleware/auth";
import {
  ensureProfile,
  findProfile,
  serializeProfile,
  updateApproval,
  updateProfile,
  type ProfileInput,
  type UserRole,
} from "../lib/user-profiles";
import { getSupabaseAdminClient, getSupabasePublicClient } from "../lib/supabase";
import { listAuditLogs, writeAuditLog } from "../lib/audit";

const router: IRouter = Router();
const allowedSignupRoles = new Set(["TRAINEE", "TRAINER"]);

function provisioningTokenMatches(value: unknown) {
  const configured = process.env.ADMIN_PROVISIONING_TOKEN;
  if (!configured || typeof value !== "string") return false;
  const provided = Buffer.from(value);
  const expected = Buffer.from(configured);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

function sessionPayload(session: { access_token: string; refresh_token: string; expires_in: number } | null) {
  return {
    accessToken: session?.access_token ?? null,
    refreshToken: session?.refresh_token ?? null,
    expiresIn: session?.expires_in ?? null,
  };
}

async function profileFromUser(user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null) {
  if (!user) return null;
  const profile = await ensureProfile(user);
  return serializeProfile(profile);
}

router.post("/auth/signup", async (req, res, next) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const role = typeof req.body?.role === "string" ? req.body.role.toUpperCase() : "TRAINEE";
  if (!email || password.length < 8 || name.length < 2 || !allowedSignupRoles.has(role)) {
    return res.status(400).json({ message: "Name, a valid email, a password of at least 8 characters, and a trainee or trainer role are required." });
  }
  try {
    const { data, error } = await getSupabasePublicClient().auth.signUp({
      email,
      password,
      options: { data: { full_name: name, role } },
    });
    if (error || !data.user) return res.status(400).json({ message: error?.message ?? "Unable to create the account." });
    const profile = await ensureProfile(data.user, { name });
    return res.status(201).json({
      ...sessionPayload(data.session),
      user: serializeProfile(profile),
      requiresEmailVerification: !data.session,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/auth/provision-admin", async (req, res, next) => {
  if (!provisioningTokenMatches(req.header("x-admin-provisioning-token"))) {
    return res.status(401).json({ message: "A valid admin provisioning token is required." });
  }
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!email || password.length < 12 || name.length < 2) {
    return res.status(400).json({ message: "A valid email, a password of at least 12 characters, and a name are required." });
  }
  try {
    const [{ adminCount }] = await db
      .select({ adminCount: count() })
      .from(userProfiles)
      .where(eq(userProfiles.role, "ADMIN"));
    if (Number(adminCount) > 0) {
      return res.status(409).json({ message: "An administrator is already provisioned." });
    }
    const { data, error } = await getSupabaseAdminClient().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
       app_metadata: { role: "ADMIN", super_admin: true },
    });
    if (error || !data.user) return res.status(400).json({ message: error?.message ?? "Unable to provision the administrator." });
    const profile = await ensureProfile({
      id: data.user.id,
      email: data.user.email,
      user_metadata: data.user.user_metadata,
      app_metadata: data.user.app_metadata,
    }, { name });
    return res.status(201).json({ user: serializeProfile(profile) });
  } catch (error) {
    return next(error);
  }
});

router.get("/auth/admin-invitations/:id", authenticate, requireAuth(), async (req, res, next) => {
  const invitationId = String(req.params.id);
  try {
    const [invitation] = await db.select().from(adminInvitations).where(eq(adminInvitations.id, invitationId)).limit(1);
    if (!invitation || invitation.usedAt || invitation.expiresAt <= new Date() || invitation.authUserId !== req.auth!.identity.id) {
      return res.status(400).json({ message: "This invitation is invalid or has expired." });
    }
    return res.json({ name: invitation.invitedName, email: invitation.invitedEmail });
  } catch (error) { return next(error); }
});

router.post("/auth/admin-invitations/:id/complete", authenticate, requireAuth(), async (req, res, next) => {
  const invitationId = String(req.params.id);
  const body = req.body ?? {};
  const fields = ["department", "title", "bio", "qualifications", "interests"];
  if (fields.some((key) => typeof body[key] !== "string")) return res.status(400).json({ message: "Complete all profile fields." });
  const department = body.department.trim();
  const title = body.title.trim();
  const experienceYears = Number(body.experienceYears);
  if (department.length < 2 || title.length < 2 || !Number.isInteger(experienceYears) || experienceYears < 0 || experienceYears > 80) {
    return res.status(400).json({ message: "Department, title, and a valid experience value are required." });
  }
  try {
    const result = await db.transaction(async (tx) => {
      const [invitation] = await tx.select().from(adminInvitations).where(eq(adminInvitations.id, invitationId)).limit(1);
      if (!invitation || invitation.usedAt || invitation.expiresAt <= new Date() || invitation.authUserId !== req.auth!.identity.id || req.auth!.identity.email?.toLowerCase() !== invitation.invitedEmail) {
        throw new Error("INVALID_INVITATION");
      }
      const [profile] = await tx.insert(userProfiles).values({
        id: req.auth!.identity.id,
        email: invitation.invitedEmail,
        name: invitation.invitedName,
        role: "ADMIN",
        approvalStatus: "APPROVED",
        department,
        title,
        bio: body.bio.trim(),
        qualifications: body.qualifications.trim(),
        interests: body.interests.trim(),
        experienceYears,
        avatarPath: null,
      }).returning();
      if (!profile) throw new Error("PROFILE_NOT_FOUND");
      const [used] = await tx.update(adminInvitations).set({ usedAt: new Date(), updatedAt: new Date() }).where(and(eq(adminInvitations.id, invitation.id), isNull(adminInvitations.usedAt))).returning();
      if (!used) throw new Error("INVALID_INVITATION");
      return profile;
    });
    const { error } = await getSupabaseAdminClient().auth.admin.updateUserById(req.auth!.identity.id, { app_metadata: { role: "ADMIN" } });
    if (error) return res.status(502).json({ message: "Unable to complete account setup." });
    await writeAuditLog({ actorId: req.auth!.identity.id, action: "ADMIN_INVITATION_COMPLETED", entityType: "ADMIN_INVITATION", entityId: invitationId });
    return res.json(serializeProfile(result));
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_INVITATION") return res.status(400).json({ message: "This invitation is invalid or has expired." });
    return next(error);
  }
});

router.post("/auth/login", async (req, res, next) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
  try {
    const { data, error } = await getSupabasePublicClient().auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.session || !data.user) return res.status(401).json({ message: error?.message ?? "Email or password is incorrect." });
    const profile = await profileFromUser(data.user);
    return res.json({ ...sessionPayload(data.session), user: profile });
  } catch (error) {
    return next(error);
  }
});

router.post("/auth/refresh", async (req, res, next) => {
  const refreshToken = typeof req.body?.refreshToken === "string" ? req.body.refreshToken : "";
  if (!refreshToken) return res.status(400).json({ message: "A refresh token is required." });
  try {
    const { data, error } = await getSupabasePublicClient().auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error || !data.session || !data.user) return res.status(401).json({ message: error?.message ?? "Your session has expired." });
    const profile = await profileFromUser(data.user);
    return res.json({ ...sessionPayload(data.session), user: profile });
  } catch (error) {
    return next(error);
  }
});

router.post("/auth/logout", authenticate, async (req, res, next) => {
  void req;
  void next;
  return res.status(204).send();
});

router.get("/auth/me", authenticate, requireAuth(), (req, res) => res.json(req.auth?.profile));

router.get("/profile", authenticate, requireAuth(), (req, res) => res.json(req.auth?.profile));

router.patch("/profile", authenticate, requireAuth(), async (req, res, next) => {
  const body = req.body ?? {};
  const input: ProfileInput = {
    ...(typeof body.name === "string" ? { name: body.name } : {}),
    ...(typeof body.department === "string" ? { department: body.department } : {}),
    ...(typeof body.title === "string" ? { title: body.title } : {}),
    ...(typeof body.bio === "string" ? { bio: body.bio } : {}),
    ...(typeof body.qualifications === "string" ? { qualifications: body.qualifications } : {}),
    ...(typeof body.interests === "string" ? { interests: body.interests } : {}),
    ...(Number.isFinite(Number(body.experienceYears)) ? { experienceYears: Number(body.experienceYears) } : {}),
  };
  if (input.name !== undefined && input.name.trim().length < 2) return res.status(400).json({ message: "Your name must be at least two characters." });
  try {
    const profile = await updateProfile(req.auth!.profile.id, input);
    if (profile) {
      await writeAuditLog({
        actorId: req.auth!.profile.id,
        action: "PROFILE_UPDATED",
        entityType: "USER_PROFILE",
        entityId: profile.id,
      });
    }
    return profile ? res.json(serializeProfile(profile)) : res.status(404).json({ message: "Profile not found." });
  } catch (error) {
    return next(error);
  }
});

router.post("/profile/avatar-upload", authenticate, requireAuth(), async (req, res, next) => {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "profile-assets";
  const path = `profiles/${req.auth!.profile.id}/${randomUUID()}`;
  try {
    const { data, error } = await getSupabaseAdminClient().storage.from(bucket).createSignedUploadUrl(path);
    if (error || !data) return res.status(502).json({ message: error?.message ?? "Could not create an avatar upload URL." });
    await updateProfile(req.auth!.profile.id, { avatarPath: path });
    await writeAuditLog({
      actorId: req.auth!.profile.id,
      action: "PROFILE_AVATAR_UPLOAD_URL_CREATED",
      entityType: "USER_PROFILE",
      entityId: req.auth!.profile.id,
      metadata: { bucket, path },
    });
    return res.json({ bucket, path, token: data.token, signedUrl: data.signedUrl });
  } catch (error) {
    return next(error);
  }
});

router.patch("/admin/users/:userId/approval", authenticate, requireRole("ADMIN"), async (req, res, next) => {
  const status = typeof req.body?.approvalStatus === "string" ? req.body.approvalStatus.toUpperCase() : "";
  const role = typeof req.body?.role === "string" ? req.body.role.toUpperCase() as UserRole : undefined;
  if (!approvalStatus(status) || (role && !["TRAINEE", "TRAINER", "ADMIN"].includes(role))) {
    return res.status(400).json({ message: "A valid approval status is required." });
  }
  if (role === "ADMIN" && !hasSuperAdminAccess(req)) {
    return res.status(403).json({ message: "Only the super administrator can grant administrator access." });
  }
  try {
    const previous = await findProfile(String(req.params.userId));
    const updated = await updateApproval(String(req.params.userId), status, role);
    if (updated && req.auth) {
      await writeAuditLog({
        actorId: req.auth.profile.id,
        action: role && previous?.role !== role ? "USER_ROLE_CHANGED" : "USER_APPROVAL_CHANGED",
        entityType: "USER_PROFILE",
        entityId: updated.id,
        metadata: {
          previousRole: previous?.role ?? null,
          role: updated.role,
          previousApprovalStatus: previous?.approvalStatus ?? null,
          approvalStatus: updated.approvalStatus,
        },
      });
    }
    return updated ? res.json(serializeProfile(updated)) : res.status(404).json({ message: "User profile not found." });
  } catch (error) {
    return next(error);
  }
});

router.get("/admin/audit-logs", authenticate, requireRole("ADMIN"), async (_req, res, next) => {
  try {
    return res.json(await listAuditLogs());
  } catch (error) {
    return next(error);
  }
});

export default router;