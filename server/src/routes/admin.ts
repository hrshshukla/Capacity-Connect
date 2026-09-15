import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { and, asc, count, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { db } from "../../../db/src";
import {
  adminAssessments,
  adminCertificates,
  adminCourses,
  adminEnrollments,
  adminSettings,
  assessmentAttempts,
  contentAchievements,
  contentAnnouncements,
  contentNotifications,
  competencies,
  competencyLevels,
  learningContents,
  subjectCompetencies,
  subjects,
  trainerCompetencies,
  userDocuments,
  userProfiles,
  adminInvitations,
} from "../../../db/src/schema";
import { hasSuperAdminAccess, requireRole, requireSuperAdmin } from "../middleware/auth";
import { writeAuditLog } from "../lib/audit";
import { getSupabaseAdminClient } from "../lib/supabase";

const router: IRouter = Router();
router.use((req, res, next) => {
  if (!req.path.startsWith("/admin/") && req.path !== "/admin") return next();
  return requireRole("ADMIN")(req, res, next);
});

router.get("/admin/super-admin/status", requireSuperAdmin(), (_req, res) => res.json({ allowed: true }));

function invitationOrigin(req: import("express").Request) {
  return process.env.PUBLIC_APP_URL?.trim() || (typeof req.get("origin") === "string" ? req.get("origin") : "");
}

async function removeInvitationAuthUser(authUserId: string | null, supabaseAdmin: ReturnType<typeof getSupabaseAdminClient>) {
  if (!authUserId) return;
  const { error } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
  if (error && !/not found|user does not exist/i.test(error.message)) throw error;
}

async function sendAdminInvitation(
  req: import("express").Request,
  name: string,
  email: string,
  action: "ADMIN_INVITATION_CREATED" | "ADMIN_INVITATION_RESENT",
) {
  const origin = invitationOrigin(req);
  if (!origin) throw new Error("The application URL is not configured.");
  const invitationId = `admin-invite-${randomUUID()}`;
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin.replace(/\/$/, "")}/admin/account-setup`,
    data: { full_name: name, invitation_id: invitationId },
  });
  if (error || !data.user) throw new Error("Unable to send the invitation.");
  try {
    await db.insert(adminInvitations).values({
      id: invitationId,
      invitedName: name,
      invitedEmail: email,
      creatorId: req.auth!.profile.id,
      authUserId: data.user.id,
      expiresAt,
    });
    await audit(req, action, "ADMIN_INVITATION", invitationId, { invitedEmail: email });
  } catch (databaseError) {
    await removeInvitationAuthUser(data.user.id, supabaseAdmin);
    throw databaseError;
  }
  return invitationId;
}

router.get("/admin/invitations", requireSuperAdmin(), async (_req, res, next) => {
  try {
    const invitations = await db.select().from(adminInvitations).orderBy(desc(adminInvitations.createdAt));
    return res.json(invitations.map((invitation) => ({
      id: invitation.id,
      name: invitation.invitedName,
      email: invitation.invitedEmail,
      status: invitation.usedAt ? "COMPLETED" : "PENDING",
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
      usedAt: invitation.usedAt,
    })));
  } catch (error) {
    return next(error);
  }
});

router.post("/admin/invitations", requireSuperAdmin(), async (req, res, next) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "A valid name and email are required." });
  try {
    const [profile] = await db.select({ id: userProfiles.id }).from(userProfiles).where(eq(userProfiles.email, email)).limit(1);
    if (profile) return res.status(409).json({ message: "An account already exists for this email." });
    const previousInvitations = await db.select({ authUserId: adminInvitations.authUserId }).from(adminInvitations)
      .where(and(eq(adminInvitations.invitedEmail, email), isNull(adminInvitations.usedAt)));
    const previousAuthUserIds = [...new Set(previousInvitations.map(({ authUserId }) => authUserId).filter((id): id is string => Boolean(id)))];
    const supabaseAdmin = getSupabaseAdminClient();
    for (const authUserId of previousAuthUserIds) {
      await removeInvitationAuthUser(authUserId, supabaseAdmin);
    }
    await db.delete(adminInvitations).where(and(eq(adminInvitations.invitedEmail, email), isNull(adminInvitations.usedAt)));
    await sendAdminInvitation(req, name, email, "ADMIN_INVITATION_CREATED");
    return res.status(201).json({ success: true });
  } catch (error) { return next(error); }
});

router.post("/admin/invitations/:id/resend", requireSuperAdmin(), async (req, res, next) => {
  const invitationId = String(req.params.id);
  try {
    const [invitation] = await db.select().from(adminInvitations).where(eq(adminInvitations.id, invitationId)).limit(1);
    if (!invitation) return res.status(404).json({ message: "This invitation was not found." });
    if (invitation.usedAt) return res.status(409).json({ message: "This administrator has already completed setup." });
    const supabaseAdmin = getSupabaseAdminClient();
    await removeInvitationAuthUser(invitation.authUserId, supabaseAdmin);
    await db.delete(adminInvitations).where(eq(adminInvitations.id, invitation.id));
    await sendAdminInvitation(req, invitation.invitedName, invitation.invitedEmail, "ADMIN_INVITATION_RESENT");
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

const pageSizeLimit = 100;
const userStatuses = new Set(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]);
const roles = new Set(["TRAINEE", "TRAINER", "ADMIN"]);
const courseStatuses = new Set(["DRAFT", "PENDING_REVIEW", "APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"]);
const contentKinds = new Set(["announcements", "notifications", "achievements", "learning-content"]);

function pageParams(query: Record<string, unknown>) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(pageSizeLimit, Math.max(1, Number(query.pageSize) || 20));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

function id(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

function contentTable(kind: string) {
  if (kind === "announcements") return contentAnnouncements;
  if (kind === "notifications") return contentNotifications;
  if (kind === "achievements") return contentAchievements;
  if (kind === "learning-content") return learningContents;
  return null;
}

async function audit(req: import("express").Request, action: string, entityType: string, entityId: string, metadata?: Record<string, unknown>) {
  await writeAuditLog({
    actorId: req.auth!.profile.id,
    action,
    entityType,
    entityId,
    metadata,
  });
}

router.get("/admin/dashboard", async (_req, res, next) => {
  try {
    const [
      [users],
      [pending],
      [trainees],
      [trainers],
      [admins],
      [courses],
      [enrollments],
      [certificates],
      [assessments],
      [attempts],
      [completedEnrollments],
      activeLearners,
      incompleteEnrollments,
      assessmentSummary,
      userGrowth,
      enrollmentTrend,
      courseCompletion,
      assessmentPerformance,
      certificateTrend,
      participationByDepartment,
    ] = await Promise.all([
      db.select({ value: count() }).from(userProfiles),
      db.select({ value: count() }).from(userProfiles).where(eq(userProfiles.approvalStatus, "PENDING")),
      db.select({ value: count() }).from(userProfiles).where(eq(userProfiles.role, "TRAINEE")),
      db.select({ value: count() }).from(userProfiles).where(eq(userProfiles.role, "TRAINER")),
      db.select({ value: count() }).from(userProfiles).where(eq(userProfiles.role, "ADMIN")),
      db.select({ value: count() }).from(adminCourses),
      db.select({ value: count() }).from(adminEnrollments),
      db.select({ value: count() }).from(adminCertificates),
      db.select({ value: count() }).from(adminAssessments),
      db.select({ value: count() }).from(assessmentAttempts),
      db.select({ value: count() }).from(adminEnrollments).where(eq(adminEnrollments.status, "COMPLETED")),
      db.execute(sql`SELECT count(DISTINCT user_id)::int AS value FROM cc_enrollments WHERE status = 'ACTIVE'`),
      db.execute(sql`SELECT count(*)::int AS value FROM cc_enrollments WHERE status <> 'COMPLETED'`),
      db.execute(sql`SELECT COALESCE(AVG(score), 0)::float AS average_score, count(*)::int AS attempts, count(*) FILTER (WHERE passed)::int AS passed FROM cc_assessment_attempts`),
      db.execute(sql`
        SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, count(*)::int AS value
        FROM cc_user_profiles
        WHERE created_at >= date_trunc('month', now()) - interval '5 months'
        GROUP BY 1 ORDER BY 1
      `),
      db.execute(sql`
        SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, count(*)::int AS value
        FROM cc_enrollments
        WHERE created_at >= date_trunc('month', now()) - interval '5 months'
        GROUP BY 1 ORDER BY 1
      `),
      db.execute(sql`
        SELECT c.title, count(e.id)::int AS total, count(e.id) FILTER (WHERE e.status = 'COMPLETED')::int AS completed
        FROM cc_courses c LEFT JOIN cc_enrollments e ON e.course_id = c.id
        GROUP BY c.id, c.title ORDER BY c.title
      `),
      db.execute(sql`
        SELECT a.title, count(at.id)::int AS attempts, COALESCE(AVG(at.score), 0)::float AS average_score,
          count(at.id) FILTER (WHERE at.passed)::int AS passed
        FROM cc_assessments a LEFT JOIN cc_assessment_attempts at ON at.assessment_id = a.id
        GROUP BY a.id, a.title ORDER BY a.title
      `),
      db.execute(sql`
        SELECT to_char(date_trunc('month', issued_at), 'YYYY-MM') AS month, count(*)::int AS value
        FROM cc_certificates
        GROUP BY 1 ORDER BY 1
      `),
      db.execute(sql`
        SELECT COALESCE(NULLIF(p.department, ''), 'Unassigned') AS department,
          count(e.id)::int AS enrollments,
          count(e.id) FILTER (WHERE e.status = 'COMPLETED')::int AS completed
        FROM cc_enrollments e JOIN cc_user_profiles p ON p.id = e.user_id
        GROUP BY 1 ORDER BY enrollments DESC, department
      `),
    ]);
    const totalEnrollments = Number(enrollments.value);
    const assessmentStats = assessmentSummary.rows[0] as { average_score?: number | string; attempts?: number | string; passed?: number | string } | undefined;
    const assessmentAttemptCount = Number(assessmentStats?.attempts ?? 0);
    res.json({
      metrics: {
        users: Number(users.value),
        pendingApprovals: Number(pending.value),
        trainees: Number(trainees.value),
        trainers: Number(trainers.value),
        admins: Number(admins.value),
        courses: Number(courses.value),
        enrollments: totalEnrollments,
        certificates: Number(certificates.value),
        assessments: Number(assessments.value),
        attempts: Number(attempts.value),
        participationRate: totalEnrollments ? Math.round((Number(completedEnrollments.value) / totalEnrollments) * 100) : 0,
        courseCompletionRate: totalEnrollments ? Math.round((Number(completedEnrollments.value) / totalEnrollments) * 100) : 0,
        activeLearners: Number((activeLearners.rows[0] as { value?: number | string } | undefined)?.value ?? 0),
        incompleteEnrollments: Number((incompleteEnrollments.rows[0] as { value?: number | string } | undefined)?.value ?? 0),
        assessmentAverageScore: Number(Number(assessmentStats?.average_score ?? 0).toFixed(1)),
        assessmentPassRate: assessmentAttemptCount ? Math.round((Number(assessmentStats?.passed ?? 0) / assessmentAttemptCount) * 100) : 0,
        certificateIssuance: Number(certificates.value),
      },
      trends: {
        userGrowth: userGrowth.rows,
        enrollments: enrollmentTrend.rows,
        certificates: certificateTrend.rows,
      },
      breakdowns: {
        courseCompletion: courseCompletion.rows,
        assessmentPerformance: assessmentPerformance.rows,
        participationByDepartment: participationByDepartment.rows,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/admin/users/pending", async (req, res, next) => {
  try {
    const { page, pageSize, offset } = pageParams(req.query as Record<string, unknown>);
    const [items, [{ value }]] = await Promise.all([
      db.select().from(userProfiles).where(eq(userProfiles.approvalStatus, "PENDING")).orderBy(asc(userProfiles.createdAt)).limit(pageSize).offset(offset),
      db.select({ value: count() }).from(userProfiles).where(eq(userProfiles.approvalStatus, "PENDING")),
    ]);
    res.json({ items, pagination: { page, pageSize, total: Number(value), totalPages: Math.ceil(Number(value) / pageSize) } });
  } catch (error) {
    return next(error);
  }
});

router.get("/admin/users", async (req, res, next) => {
  try {
    const query = req.query as Record<string, unknown>;
    const { page, pageSize, offset } = pageParams(query);
    const status = typeof query.status === "string" && userStatuses.has(query.status) ? query.status : undefined;
    const role = typeof query.role === "string" && roles.has(query.role) ? query.role : undefined;
    const search = typeof query.search === "string" ? query.search.trim() : "";
    const filters = [
      status ? eq(userProfiles.approvalStatus, status) : undefined,
      role ? eq(userProfiles.role, role) : undefined,
      search ? or(ilike(userProfiles.name, `%${search}%`), ilike(userProfiles.email, `%${search}%`), ilike(userProfiles.department, `%${search}%`)) : undefined,
    ].filter(Boolean);
    const where = filters.length ? and(...filters) : undefined;
    const [items, [{ value }]] = await Promise.all([
      db.select().from(userProfiles).where(where).orderBy(desc(userProfiles.createdAt)).limit(pageSize).offset(offset),
      db.select({ value: count() }).from(userProfiles).where(where),
    ]);
    res.json({ items, pagination: { page, pageSize, total: Number(value), totalPages: Math.ceil(Number(value) / pageSize) } });
  } catch (error) {
    return next(error);
  }
});

router.get("/admin/users/:userId", async (req, res, next) => {
  try {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.id, req.params.userId)).limit(1);
    if (!profile) return res.status(404).json({ message: "User not found." });
    const documents = await db.select().from(userDocuments).where(eq(userDocuments.userId, profile.id)).orderBy(desc(userDocuments.createdAt));
    return res.json({ profile, documents });
  } catch (error) {
    return next(error);
  }
});

router.patch("/admin/users/:userId/status", async (req, res, next) => {
  const status = typeof req.body?.approvalStatus === "string" ? req.body.approvalStatus.toUpperCase() : "";
  const rejectionReason = typeof req.body?.rejectionReason === "string" ? req.body.rejectionReason.trim() : "";
  if (!userStatuses.has(status)) return res.status(400).json({ message: "A valid approval status is required." });
  if (status === "REJECTED" && !rejectionReason) return res.status(400).json({ message: "A rejection reason is required." });
  try {
    const [updated] = await db.update(userProfiles).set({
      approvalStatus: status,
      rejectionReason: status === "REJECTED" ? rejectionReason : "",
      updatedAt: new Date(),
    }).where(eq(userProfiles.id, req.params.userId)).returning();
    if (!updated) return res.status(404).json({ message: "User not found." });
    await audit(req, `USER_${status}`, "USER_PROFILE", updated.id, { rejectionReason });
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

router.patch("/admin/users/:userId/role", async (req, res, next) => {
  const role = typeof req.body?.role === "string" ? req.body.role.toUpperCase() : "";
  if (!roles.has(role)) return res.status(400).json({ message: "A valid role is required." });
  try {
    const [target] = await db.select().from(userProfiles).where(eq(userProfiles.id, req.params.userId)).limit(1);
    if (!target) return res.status(404).json({ message: "User not found." });
    if (role === "ADMIN" && target.role !== "ADMIN" && !hasSuperAdminAccess(req)) {
      return res.status(403).json({ message: "Only the super administrator can grant administrator access." });
    }
    if (target.id === req.auth!.profile.id && role !== "ADMIN") return res.status(400).json({ message: "You cannot remove your own administrator role." });
    if (target.role === "ADMIN" && role !== "ADMIN") {
      const [{ value }] = await db.select({ value: count() }).from(userProfiles).where(eq(userProfiles.role, "ADMIN"));
      if (Number(value) <= 1) return res.status(409).json({ message: "The last administrator cannot be demoted." });
    }
    const [updated] = await db.update(userProfiles).set({ role, updatedAt: new Date() }).where(eq(userProfiles.id, target.id)).returning();
    await audit(req, "USER_ROLE_CHANGED", "USER_PROFILE", target.id, { previousRole: target.role, role });
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

router.get("/admin/users/:userId/documents", async (req, res, next) => {
  try {
    res.json(await db.select().from(userDocuments).where(eq(userDocuments.userId, req.params.userId)).orderBy(desc(userDocuments.createdAt)));
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/documents/:documentId", async (req, res, next) => {
  const reviewStatus = typeof req.body?.reviewStatus === "string" ? req.body.reviewStatus.toUpperCase() : "";
  const rejectionReason = typeof req.body?.rejectionReason === "string" ? req.body.rejectionReason.trim() : "";
  if (!["PENDING", "VERIFIED", "REJECTED"].includes(reviewStatus)) return res.status(400).json({ message: "A valid document review status is required." });
  if (reviewStatus === "REJECTED" && !rejectionReason) return res.status(400).json({ message: "A rejection reason is required." });
  try {
    const [updated] = await db.update(userDocuments).set({
      reviewStatus,
      rejectionReason: reviewStatus === "REJECTED" ? rejectionReason : "",
      reviewedBy: req.auth!.profile.id,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(userDocuments.id, req.params.documentId)).returning();
    if (!updated) return res.status(404).json({ message: "Document not found." });
    await audit(req, "DOCUMENT_REVIEWED", "USER_DOCUMENT", updated.id, { reviewStatus });
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

router.get("/admin/courses", async (_req, res, next) => {
  try {
    res.json(await db.select().from(adminCourses).orderBy(desc(adminCourses.createdAt)));
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/courses/:courseId/status", async (req, res, next) => {
  const status = typeof req.body?.status === "string" ? req.body.status.toUpperCase() : "";
  if (!courseStatuses.has(status)) return res.status(400).json({ message: "A valid course status is required." });
  try {
    const [updated] = await db.update(adminCourses).set({
      status,
      rejectionReason: status === "REJECTED" ? String(req.body?.rejectionReason ?? "").trim() : "",
      publishedAt: status === "PUBLISHED" ? new Date() : undefined,
      archivedAt: status === "ARCHIVED" ? new Date() : undefined,
      updatedAt: new Date(),
    }).where(eq(adminCourses.id, req.params.courseId)).returning();
    if (!updated) return res.status(404).json({ message: "Course not found." });
    await audit(req, `COURSE_${status}`, "COURSE", updated.id, { status });
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

router.get("/admin/assessments", async (_req, res, next) => {
  try {
    const rows = await db.select().from(adminAssessments).orderBy(desc(adminAssessments.createdAt));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/admin/enrollments", async (_req, res, next) => {
  try {
    res.json(await db.select().from(adminEnrollments).orderBy(desc(adminEnrollments.createdAt)));
  } catch (error) {
    next(error);
  }
});

router.get("/admin/certificates", async (_req, res, next) => {
  try {
    res.json(await db.select().from(adminCertificates).orderBy(desc(adminCertificates.issuedAt)));
  } catch (error) {
    next(error);
  }
});

router.get("/admin/competency-config", async (_req, res, next) => {
  try {
    const [framework, levels, subjectList, mappings, trainerLevels] = await Promise.all([
      db.select().from(competencies).orderBy(asc(competencies.name)),
      db.select().from(competencyLevels).orderBy(asc(competencyLevels.level)),
      db.select().from(subjects).orderBy(asc(subjects.name)),
      db.select().from(subjectCompetencies),
      db.select().from(trainerCompetencies),
    ]);
    res.json({ competencies: framework, levels, subjects: subjectList, mappings, trainerLevels });
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/competencies/:competencyId", async (req, res, next) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const color = typeof req.body?.color === "string" ? req.body.color.trim() : "";
  if (name.length < 2 || !/^#[0-9a-f]{6}$/i.test(color)) return res.status(400).json({ message: "Name and a valid hex color are required." });
  try {
    const [updated] = await db.update(competencies).set({ name, color, updatedAt: new Date() }).where(eq(competencies.id, req.params.competencyId)).returning();
    if (!updated) return res.status(404).json({ message: "Competency not found." });
    await audit(req, "COMPETENCY_UPDATED", "COMPETENCY", updated.id);
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

router.patch("/admin/competency-levels/:level", async (req, res, next) => {
  const level = Number(req.params.level);
  const scoreThreshold = Number(req.body?.scoreThreshold);
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const description = typeof req.body?.description === "string" ? req.body.description.trim() : "";
  if (!Number.isInteger(level) || level < 1 || level > 5 || !title || !Number.isFinite(scoreThreshold)) return res.status(400).json({ message: "A valid level configuration is required." });
  try {
    const [updated] = await db.update(competencyLevels).set({ title, description, scoreThreshold }).where(eq(competencyLevels.level, level)).returning();
    if (!updated) return res.status(404).json({ message: "Competency level not found." });
    await audit(req, "COMPETENCY_LEVEL_UPDATED", "COMPETENCY_LEVEL", String(level));
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

router.put("/admin/subject-requirements", async (req, res, next) => {
  const subjectId = String(req.body?.subjectId ?? "");
  const competencyId = String(req.body?.competencyId ?? "");
  const requiredLevel = Number(req.body?.requiredLevel);
  const weight = Number(req.body?.weight);
  const mandatory = Boolean(req.body?.mandatory);
  if (!subjectId || !competencyId || !Number.isInteger(requiredLevel) || requiredLevel < 1 || requiredLevel > 5 || !Number.isFinite(weight) || weight < 0 || weight > 1) {
    return res.status(400).json({ message: "A valid subject competency mapping is required." });
  }
  try {
    const [updated] = await db.insert(subjectCompetencies).values({ subjectId, competencyId, requiredLevel, weight, mandatory })
      .onConflictDoUpdate({ target: [subjectCompetencies.subjectId, subjectCompetencies.competencyId], set: { requiredLevel, weight, mandatory } }).returning();
    await audit(req, "SUBJECT_REQUIREMENT_UPDATED", "SUBJECT_COMPETENCY", `${subjectId}:${competencyId}`);
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

router.get("/admin/trainer-matching", async (req, res, next) => {
  try {
    const subjectId = typeof req.query.subjectId === "string" ? req.query.subjectId : undefined;
    const requirements = subjectId
      ? await db.select().from(subjectCompetencies).where(eq(subjectCompetencies.subjectId, subjectId))
      : [];
    const trainerRows = await db.select({
      trainerId: trainerCompetencies.trainerId,
      competencyId: trainerCompetencies.competencyId,
      level: trainerCompetencies.level,
    }).from(trainerCompetencies);
    const profiles = await db.select().from(userProfiles).where(eq(userProfiles.role, "TRAINER"));
    const matches = profiles.map((profile) => {
      const levels = trainerRows.filter((row) => row.trainerId === profile.id);
      const competencyMatch = requirements.length
        ? requirements.reduce((sum, requirement) => sum + Math.min((levels.find((row) => row.competencyId === requirement.competencyId)?.level ?? 0) / requirement.requiredLevel, 1) * requirement.weight, 0) / Math.max(requirements.reduce((sum, item) => sum + item.weight, 0), 1)
        : 0;
      const eligible = requirements.every((requirement) => !requirement.mandatory || (levels.find((row) => row.competencyId === requirement.competencyId)?.level ?? 0) >= requirement.requiredLevel);
      return { trainer: profile, competencyMatch: Math.round(competencyMatch * 100), eligible, levels };
    }).sort((a, b) => b.competencyMatch - a.competencyMatch);
    res.json({ subjectId: subjectId ?? null, matches });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/content/:kind", async (req, res, next) => {
  const table = contentTable(req.params.kind);
  if (!table) return res.status(404).json({ message: "Unknown content collection." });
  try {
    return res.json(await db.select().from(table as any).orderBy(desc((table as any).createdAt)));
  } catch (error) {
    return next(error);
  }
});

router.post("/admin/content/:kind", async (req, res, next) => {
  const table = contentTable(req.params.kind);
  if (!table) return res.status(404).json({ message: "Unknown content collection." });
  const body = req.body ?? {};
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return res.status(400).json({ message: "A title is required." });
  try {
    let values: Record<string, unknown>;
    if (req.params.kind === "announcements") values = { id: id("announcement"), title, description: String(body.description ?? ""), imagePath: body.imagePath ? String(body.imagePath) : null, targetAudience: String(body.targetAudience ?? "ALL"), status: "DRAFT" };
    else if (req.params.kind === "notifications") values = { id: id("notification"), title, description: String(body.description ?? ""), notificationType: String(body.notificationType ?? "GENERAL"), targetAudience: String(body.targetAudience ?? "ALL"), status: "DRAFT" };
    else if (req.params.kind === "achievements") values = { id: id("achievement"), title, description: String(body.description ?? ""), achievementDate: body.achievementDate ? new Date(body.achievementDate) : null, imagePath: body.imagePath ? String(body.imagePath) : null, personOrTeam: String(body.personOrTeam ?? ""), status: "DRAFT" };
    else values = { id: id("learning"), title, description: String(body.description ?? ""), contentType: String(body.contentType ?? "ARTICLE"), courseId: body.courseId ? String(body.courseId) : null, resourcePath: body.resourcePath ? String(body.resourcePath) : null, status: "DRAFT" };
    const createdRows = await db.insert(table as any).values(values as any).returning() as Array<{ id: string }>;
    const created = createdRows[0];
    await audit(req, "CONTENT_CREATED", req.params.kind.toUpperCase(), String((created as { id: string }).id));
    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
});

router.patch("/admin/content/:kind/:contentId", async (req, res, next) => {
  const table = contentTable(req.params.kind);
  if (!table) return res.status(404).json({ message: "Unknown content collection." });
  const body = req.body ?? {};
  const changes: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of ["title", "description", "imagePath", "targetAudience", "notificationType", "contentType", "resourcePath", "personOrTeam", "courseId"]) {
    if (body[key] !== undefined) changes[key] = body[key];
  }
  if (body.achievementDate !== undefined) changes.achievementDate = body.achievementDate ? new Date(body.achievementDate) : null;
  try {
    const [updated] = await db.update(table as any).set(changes as any).where(eq((table as any).id, req.params.contentId)).returning();
    if (!updated) return res.status(404).json({ message: "Content not found." });
    await audit(req, "CONTENT_UPDATED", req.params.kind.toUpperCase(), req.params.contentId);
    res.json(updated);
  } catch (error) {
    return next(error);
  }
});

router.patch("/admin/content/:kind/:contentId/status", async (req, res, next) => {
  const table = contentTable(req.params.kind);
  if (!table) return res.status(404).json({ message: "Unknown publishable collection." });
  const status = typeof req.body?.status === "string" ? req.body.status.toUpperCase() : "";
  if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) return res.status(400).json({ message: "A valid content status is required." });
  try {
    const [updated] = await db.update(table as any).set({ status, publishedAt: status === "PUBLISHED" ? new Date() : null, updatedAt: new Date() } as any).where(eq((table as any).id, req.params.contentId)).returning();
    if (!updated) return res.status(404).json({ message: "Content not found." });
    await audit(req, `CONTENT_${status}`, req.params.kind.toUpperCase(), req.params.contentId);
    res.json(updated);
  } catch (error) {
    return next(error);
  }
});

router.delete("/admin/content/:kind/:contentId", async (req, res, next) => {
  const table = contentTable(req.params.kind);
  if (!table) return res.status(404).json({ message: "Unknown content collection." });
  try {
    const deletedRows = await db.delete(table as any).where(eq((table as any).id, req.params.contentId)).returning() as Array<{ id: string }>;
    const deleted = deletedRows[0];
    if (!deleted) return res.status(404).json({ message: "Content not found." });
    await audit(req, "CONTENT_DELETED", req.params.kind.toUpperCase(), req.params.contentId);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.get("/admin/settings", async (_req, res, next) => {
  try {
    res.json(await db.select().from(adminSettings).orderBy(asc(adminSettings.key)));
  } catch (error) {
    return next(error);
  }
});

router.put("/admin/settings", async (req, res, next) => {
  const values = req.body && typeof req.body === "object" ? req.body : {};
  try {
    const output = [];
    for (const [key, value] of Object.entries(values)) {
      if (!/^[a-z0-9_.-]{1,80}$/i.test(key)) continue;
      const [setting] = await db.insert(adminSettings).values({ key, value: String(value), updatedBy: req.auth!.profile.id })
        .onConflictDoUpdate({ target: adminSettings.key, set: { value: String(value), updatedBy: req.auth!.profile.id, updatedAt: new Date() } }).returning();
      output.push(setting);
      await audit(req, "ADMIN_SETTING_CHANGED", "ADMIN_SETTING", key);
    }
    res.json(output);
  } catch (error) {
    next(error);
  }
});

export default router;