import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "../../../db/src";
import {
  adminAssessments,
  adminCourses,
  assessmentQuestions,
  traineeAssessmentAttempts,
  traineeEnrollments,
  trainerLibraryItems,
  userProfiles,
} from "../../../db/src/schema";
import { getSupabaseAdminClient } from "../lib/supabase";
import { requireApproved, requireAuth, requireRole } from "../middleware/auth";

const router: IRouter = Router();
const trainerOnly = [requireAuth(), requireApproved(), requireRole("TRAINER")];
const libraryTypes = new Set(["LECTURE", "PRESENTATION", "STUDY_MATERIAL"]);
const contentStatuses = new Set(["DRAFT", "PUBLISHED", "ARCHIVED"]);

router.get("/trainer/dashboard", ...trainerOnly, async (req, res, next) => {
  try {
    const trainerId = req.auth!.profile.id;
    const [courses, learners, assessments, completion, performance, deadlines, activity] = await Promise.all([
      db.execute(sql`SELECT count(*)::int AS value FROM cc_courses WHERE owner_id = ${trainerId}`),
      db.execute(sql`SELECT count(DISTINCT e.user_id)::int AS value FROM cc_enrollments e JOIN cc_courses c ON c.id = e.course_id WHERE c.owner_id = ${trainerId} AND e.status = 'ACTIVE'`),
      db.execute(sql`SELECT count(*)::int AS value FROM cc_assessments WHERE owner_id = ${trainerId}`),
      db.execute(sql`SELECT count(*) FILTER (WHERE e.status = 'COMPLETED')::int AS completed, count(*)::int AS total FROM cc_enrollments e JOIN cc_courses c ON c.id = e.course_id WHERE c.owner_id = ${trainerId}`),
      db.execute(sql`SELECT COALESCE(AVG(a.percentage), 0)::float AS average_score FROM cc_trainee_assessment_attempts a JOIN cc_assessments q ON q.id = a.assessment_id WHERE q.owner_id = ${trainerId}`),
      db.execute(sql`SELECT id, title, deadline FROM cc_assessments WHERE owner_id = ${trainerId} AND deadline IS NOT NULL AND deadline >= now() ORDER BY deadline ASC LIMIT 5`),
      db.execute(sql`SELECT p.name AS trainee, c.title AS course, e.progress, e.status, e.updated_at AS "updatedAt" FROM cc_enrollments e JOIN cc_courses c ON c.id = e.course_id JOIN cc_user_profiles p ON p.id = e.user_id WHERE c.owner_id = ${trainerId} ORDER BY e.updated_at DESC LIMIT 8`),
    ]);
    const completionRow = completion.rows[0] as { completed?: number | string; total?: number | string } | undefined;
    return res.json({
      metrics: {
        courses: Number((courses.rows[0] as { value?: number | string } | undefined)?.value ?? 0),
        activeLearners: Number((learners.rows[0] as { value?: number | string } | undefined)?.value ?? 0),
        assessments: Number((assessments.rows[0] as { value?: number | string } | undefined)?.value ?? 0),
        completionRate: Number(completionRow?.total ?? 0) ? Math.round((Number(completionRow?.completed ?? 0) / Number(completionRow?.total)) * 100) : 0,
        averagePerformance: Number(Number((performance.rows[0] as { average_score?: number | string } | undefined)?.average_score ?? 0).toFixed(1)),
      },
      upcomingDeadlines: deadlines.rows,
      recentActivity: activity.rows,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/trainer/participation", ...trainerOnly, async (req, res, next) => {
  try {
    const trainerId = req.auth!.profile.id;
    const query = req.query as Record<string, unknown>;
    const search = typeof query.search === "string" ? query.search.trim() : "";
    const status = typeof query.status === "string" ? query.status : "";
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 25));
    const conditions = [sql`c.owner_id = ${trainerId}`];
    if (search) conditions.push(sql`(p.name ILIKE ${`%${search}%`} OR p.email ILIKE ${`%${search}%`} OR c.title ILIKE ${`%${search}%`})`);
    if (status) conditions.push(sql`e.status = ${status}`);
    if (typeof query.courseId === "string" && query.courseId) conditions.push(sql`e.course_id = ${query.courseId}`);
    const where = sql.join(conditions, sql` AND `);
    const [items, total] = await Promise.all([
      db.execute(sql`SELECT e.id, p.name AS trainee, p.email, c.id AS "courseId", c.title AS course, e.enrolled_at AS "enrollmentDate", e.progress, e.status, a.title AS assessment, at.percentage AS score, e.completed_at AS completion
        FROM cc_enrollments e JOIN cc_courses c ON c.id = e.course_id JOIN cc_user_profiles p ON p.id = e.user_id
        LEFT JOIN cc_assessments a ON a.course_id = e.course_id AND a.owner_id = ${trainerId}
        LEFT JOIN LATERAL (SELECT percentage FROM cc_trainee_assessment_attempts WHERE user_id = e.user_id AND assessment_id = a.id ORDER BY submitted_at DESC LIMIT 1) at ON true
        WHERE ${where} ORDER BY e.updated_at DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`),
      db.execute(sql`SELECT count(*)::int AS value FROM cc_enrollments e JOIN cc_courses c ON c.id = e.course_id JOIN cc_user_profiles p ON p.id = e.user_id WHERE ${where}`),
    ]);
    if (query.format === "csv") {
      const header = "Trainee,Email,Course,Enrollment date,Progress,Status,Assessment,Score,Completion\n";
      const csv = items.rows.map((row) => {
        const values = [row.trainee, row.email, row.course, row.enrollmentDate, `${row.progress ?? 0}%`, row.status, row.assessment ?? "", row.score ?? "", row.completion ?? ""];
        return values.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",");
      }).join("\n");
      res.setHeader("Content-Type", "text/csv");
      return res.send(header + csv);
    }
    return res.json({ items: items.rows, pagination: { page, pageSize, total: Number((total.rows[0] as { value?: number | string } | undefined)?.value ?? 0) } });
  } catch (error) {
    return next(error);
  }
});

router.get("/trainer/questionnaires", ...trainerOnly, async (req, res, next) => {
  try {
    const items = await db.select().from(adminAssessments).where(eq(adminAssessments.ownerId, req.auth!.profile.id)).orderBy(desc(adminAssessments.createdAt));
    return res.json(items);
  } catch (error) {
    return next(error);
  }
});

router.post("/trainer/questionnaires", ...trainerOnly, async (req, res, next) => {
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const description = typeof req.body?.description === "string" ? req.body.description.trim() : "";
  const courseId = typeof req.body?.courseId === "string" && req.body.courseId.trim() ? req.body.courseId.trim() : null;
  const deadline = req.body?.deadline ? new Date(req.body.deadline) : null;
  const questions = Array.isArray(req.body?.questions) ? req.body.questions : [];
  if (!title || !questions.length || questions.some((question: any) => typeof question?.prompt !== "string" || !Array.isArray(question?.options) || question.options.length < 2 || !Number.isInteger(question.correctOption))) {
    return res.status(400).json({ message: "Title and at least one valid multiple-choice question are required." });
  }
  if (deadline && Number.isNaN(deadline.getTime())) return res.status(400).json({ message: "A valid deadline is required." });
  const id = `assessment-${randomUUID()}`;
  try {
    const [assessment] = await db.insert(adminAssessments).values({
      id,
      ownerId: req.auth!.profile.id,
      courseId,
      title,
      description,
      status: "PUBLISHED",
      deadline,
    }).returning();
    await db.insert(assessmentQuestions).values(questions.map((question: any, index: number) => ({
      id: `question-${randomUUID()}-${index}`,
      assessmentId: id,
      prompt: question.prompt.trim(),
      options: JSON.stringify(question.options.map((option: unknown) => String(option))),
      correctOption: question.correctOption,
      marks: Number(question.marks) > 0 ? Number(question.marks) : 1,
      explanation: typeof question.explanation === "string" ? question.explanation.trim() : "",
    })));
    return res.status(201).json(assessment);
  } catch (error) {
    return next(error);
  }
});

router.patch("/trainer/questionnaires/:id", ...trainerOnly, async (req, res, next) => {
  const status = typeof req.body?.status === "string" ? req.body.status.toUpperCase() : undefined;
  const deadline = req.body?.deadline ? new Date(req.body.deadline) : undefined;
  if (status && !contentStatuses.has(status)) return res.status(400).json({ message: "Invalid questionnaire status." });
  try {
    const [updated] = await db.update(adminAssessments).set({
      ...(status ? { status } : {}),
      ...(deadline ? { deadline } : {}),
      updatedAt: new Date(),
    }).where(and(eq(adminAssessments.id, String(req.params.id)), eq(adminAssessments.ownerId, req.auth!.profile.id))).returning();
    return updated ? res.json(updated) : res.status(404).json({ message: "Questionnaire not found." });
  } catch (error) {
    return next(error);
  }
});

router.get("/trainer/library", ...trainerOnly, async (req, res, next) => {
  try {
    return res.json(await db.select().from(trainerLibraryItems).where(eq(trainerLibraryItems.trainerId, req.auth!.profile.id)).orderBy(desc(trainerLibraryItems.createdAt)));
  } catch (error) {
    return next(error);
  }
});

router.post("/trainer/library/upload", ...trainerOnly, async (req, res, next) => {
  const fileName = typeof req.body?.fileName === "string" ? req.body.fileName.trim().replace(/[^a-zA-Z0-9._-]/g, "-") : "";
  if (!fileName) return res.status(400).json({ message: "A file name is required." });
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "profile-assets";
  const path = `trainer-library/${req.auth!.profile.id}/${randomUUID()}-${fileName}`;
  try {
    const { data, error } = await getSupabaseAdminClient().storage.from(bucket).createSignedUploadUrl(path);
    if (error || !data) return res.status(502).json({ message: error?.message ?? "Could not create an upload URL." });
    return res.json({ bucket, path, token: data.token, signedUrl: data.signedUrl });
  } catch (error) {
    return next(error);
  }
});

router.post("/trainer/library", ...trainerOnly, async (req, res, next) => {
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const itemType = typeof req.body?.itemType === "string" ? req.body.itemType.toUpperCase() : "";
  if (!title || !libraryTypes.has(itemType)) return res.status(400).json({ message: "Title and a valid library type are required." });
  try {
    const [item] = await db.insert(trainerLibraryItems).values({
      id: `library-${randomUUID()}`,
      trainerId: req.auth!.profile.id,
      title,
      description: typeof req.body?.description === "string" ? req.body.description.trim() : "",
      itemType,
      storagePath: typeof req.body?.storagePath === "string" ? req.body.storagePath : null,
      resourceUrl: typeof req.body?.resourceUrl === "string" ? req.body.resourceUrl.trim() : null,
      status: "DRAFT",
    }).returning();
    return res.status(201).json(item);
  } catch (error) {
    return next(error);
  }
});

router.patch("/trainer/library/:id", ...trainerOnly, async (req, res, next) => {
  const status = typeof req.body?.status === "string" ? req.body.status.toUpperCase() : undefined;
  if (status && !contentStatuses.has(status)) return res.status(400).json({ message: "Invalid library status." });
  try {
    const [updated] = await db.update(trainerLibraryItems).set({
      ...(status ? { status, publishedAt: status === "PUBLISHED" ? new Date() : null } : {}),
      ...(typeof req.body?.title === "string" ? { title: req.body.title.trim() } : {}),
      ...(typeof req.body?.description === "string" ? { description: req.body.description.trim() } : {}),
      updatedAt: new Date(),
    }).where(and(eq(trainerLibraryItems.id, String(req.params.id)), eq(trainerLibraryItems.trainerId, req.auth!.profile.id))).returning();
    return updated ? res.json(updated) : res.status(404).json({ message: "Library item not found." });
  } catch (error) {
    return next(error);
  }
});

router.delete("/trainer/library/:id", ...trainerOnly, async (req, res, next) => {
  try {
    const deleted = await db.delete(trainerLibraryItems).where(and(eq(trainerLibraryItems.id, String(req.params.id)), eq(trainerLibraryItems.trainerId, req.auth!.profile.id))).returning({ id: trainerLibraryItems.id });
    return deleted.length ? res.status(204).send() : res.status(404).json({ message: "Library item not found." });
  } catch (error) {
    return next(error);
  }
});

router.get("/v1/trainer-library", async (req, res, next) => {
  if (!req.auth) return res.status(401).json({ message: "Authentication is required." });
  if (!["TRAINEE", "TRAINER"].includes(req.auth.profile.role) || req.auth.profile.approvalStatus !== "APPROVED") return res.status(403).json({ message: "An approved learner account is required." });
  try {
    const items = await db.select({
      id: trainerLibraryItems.id,
      title: trainerLibraryItems.title,
      description: trainerLibraryItems.description,
      itemType: trainerLibraryItems.itemType,
      resourceUrl: trainerLibraryItems.resourceUrl,
      storagePath: trainerLibraryItems.storagePath,
      trainerName: userProfiles.name,
      createdAt: trainerLibraryItems.createdAt,
    }).from(trainerLibraryItems).innerJoin(userProfiles, eq(userProfiles.id, trainerLibraryItems.trainerId))
      .where(eq(trainerLibraryItems.status, "PUBLISHED")).orderBy(desc(trainerLibraryItems.publishedAt));
    return res.json(items);
  } catch (error) {
    return next(error);
  }
});

router.get("/v1/trainer-library/:id/download", async (req, res, next) => {
  if (!req.auth || !["TRAINEE", "TRAINER"].includes(req.auth.profile.role) || req.auth.profile.approvalStatus !== "APPROVED") return res.status(403).json({ message: "An approved learner account is required." });
  try {
    const [item] = await db.select().from(trainerLibraryItems).where(and(eq(trainerLibraryItems.id, req.params.id), eq(trainerLibraryItems.status, "PUBLISHED"))).limit(1);
    if (!item?.storagePath) return res.status(404).json({ message: "No uploaded file is available for this item." });
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "profile-assets";
    const { data, error } = await getSupabaseAdminClient().storage.from(bucket).createSignedUrl(item.storagePath, 3600);
    if (error || !data?.signedUrl) return res.status(502).json({ message: error?.message ?? "Could not create a download URL." });
    return res.json({ url: data.signedUrl });
  } catch (error) {
    return next(error);
  }
});

export default router;