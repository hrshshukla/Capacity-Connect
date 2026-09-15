import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../../../db/src";
import {
  courseResources,
  traineeEnrollments,
  traineeCertificates,
  traineeExperiences,
  traineeInterests,
  traineeProfiles,
  traineeQualifications,
  traineeSkills,
} from "../../../db/src/schema";
import { requireAuth, requireRole } from "../middleware/auth";
import { findProfile, serializeProfile, updateProfile } from "../lib/user-profiles";

const router: IRouter = Router();
const traineeOnly = [requireAuth(), requireRole("TRAINEE")];

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function list(value: unknown) {
  return Array.isArray(value) ? value : [];
}

async function profileData(userId: string) {
  const [profile, qualifications, experiences, skills, interests, certificates] = await Promise.all([
    db.select().from(traineeProfiles).where(eq(traineeProfiles.userId, userId)).limit(1),
    db.select().from(traineeQualifications).where(eq(traineeQualifications.userId, userId)).orderBy(asc(traineeQualifications.createdAt)),
    db.select().from(traineeExperiences).where(eq(traineeExperiences.userId, userId)).orderBy(asc(traineeExperiences.createdAt)),
    db.select().from(traineeSkills).where(eq(traineeSkills.userId, userId)).orderBy(asc(traineeSkills.createdAt)),
    db.select().from(traineeInterests).where(eq(traineeInterests.userId, userId)).orderBy(asc(traineeInterests.createdAt)),
    db.select().from(traineeCertificates).where(eq(traineeCertificates.userId, userId)).orderBy(asc(traineeCertificates.createdAt)),
  ]);
  return {
    profile: profile[0] ?? { userId, phone: "", location: "", headline: "", summary: "" },
    qualifications,
    experiences,
    skills,
    interests,
    certificates,
  };
}

router.get("/v1/trainee/profile", ...traineeOnly, async (req, res, next) => {
  try {
    const user = await findProfile(req.auth!.profile.id);
    if (!user) return res.status(404).json({ message: "Profile not found." });
    return res.json({ user: serializeProfile(user), ...(await profileData(user.id)) });
  } catch (error) {
    return next(error);
  }
});

router.patch("/v1/trainee/profile", ...traineeOnly, async (req, res, next) => {
  const body = req.body ?? {};
  const userId = req.auth!.profile.id;
  const base = body.user ?? body;
  const headline = text(body.headline);
  const phone = text(body.phone);
  const location = text(body.location);
  const summary = text(body.summary);
  const qualifications = list(body.qualifications)
    .map((item) => ({
      institution: text(item?.institution),
      qualification: text(item?.qualification),
      field: text(item?.field),
      year: Number.isFinite(Number(item?.year)) && Number(item.year) > 0 ? Math.floor(Number(item.year)) : null,
      description: text(item?.description),
    }))
    .filter((item) => item.institution && item.qualification);
  const experiences = list(body.experiences)
    .map((item) => ({
      organization: text(item?.organization),
      role: text(item?.role),
      startDate: text(item?.startDate),
      endDate: text(item?.endDate),
      description: text(item?.description),
    }))
    .filter((item) => item.organization && item.role);
  const skills = list(body.skills)
    .map((item) => ({ name: text(typeof item === "string" ? item : item?.name), proficiency: text(item?.proficiency) || "Working" }))
    .filter((item) => item.name);
  const interests = list(body.interests)
    .map((item) => ({ name: text(typeof item === "string" ? item : item?.name) }))
    .filter((item) => item.name);
  const certificates = list(body.certificates)
    .map((item) => ({
      name: text(item?.name),
      issuer: text(item?.issuer),
      issuedDate: text(item?.issuedDate),
      credentialUrl: text(item?.credentialUrl),
    }))
    .filter((item) => item.name);

  if (base.name !== undefined && text(base.name).length < 2) {
    return res.status(400).json({ message: "Your name must be at least two characters." });
  }

  try {
    await updateProfile(userId, {
      ...(base.name !== undefined ? { name: text(base.name) } : {}),
      ...(base.department !== undefined ? { department: text(base.department) } : {}),
      ...(base.title !== undefined ? { title: text(base.title) } : {}),
      ...(base.bio !== undefined ? { bio: text(base.bio) } : {}),
      ...(base.experienceYears !== undefined && Number.isFinite(Number(base.experienceYears))
        ? { experienceYears: Number(base.experienceYears) }
        : {}),
    });
    await db.transaction(async (tx) => {
      await tx.insert(traineeProfiles).values({ userId, phone, location, headline, summary })
        .onConflictDoUpdate({
          target: traineeProfiles.userId,
          set: { phone, location, headline, summary, updatedAt: new Date() },
        });
      await Promise.all([
        tx.delete(traineeQualifications).where(eq(traineeQualifications.userId, userId)),
        tx.delete(traineeExperiences).where(eq(traineeExperiences.userId, userId)),
        tx.delete(traineeSkills).where(eq(traineeSkills.userId, userId)),
        tx.delete(traineeInterests).where(eq(traineeInterests.userId, userId)),
        tx.delete(traineeCertificates).where(eq(traineeCertificates.userId, userId)),
      ]);
      if (qualifications.length) await tx.insert(traineeQualifications).values(qualifications.map((item) => ({ ...item, id: randomUUID(), userId })));
      if (experiences.length) await tx.insert(traineeExperiences).values(experiences.map((item) => ({ ...item, id: randomUUID(), userId })));
      if (skills.length) await tx.insert(traineeSkills).values(skills.map((item) => ({ ...item, id: randomUUID(), userId })));
      if (interests.length) await tx.insert(traineeInterests).values(interests.map((item) => ({ ...item, id: randomUUID(), userId })));
      if (certificates.length) await tx.insert(traineeCertificates).values(certificates.map((item) => ({ ...item, id: randomUUID(), userId })));
    });
    const user = await findProfile(userId);
    if (!user) return res.status(404).json({ message: "Profile not found." });
    return res.json({ user: serializeProfile(user), ...(await profileData(userId)) });
  } catch (error) {
    return next(error);
  }
});

router.get("/v1/trainee/courses/:courseId/resources", ...traineeOnly, async (req, res, next) => {
  try {
    const enrollment = await db
      .select()
      .from(traineeEnrollments)
      .where(and(
        eq(traineeEnrollments.userId, req.auth!.profile.id),
        eq(traineeEnrollments.courseId, String(req.params.courseId)),
      ))
      .limit(1);
    if (!enrollment.length) return res.status(403).json({ message: "Enroll in the course to access its resources." });
    return res.json(await db.select().from(courseResources)
      .where(and(eq(courseResources.courseId, String(req.params.courseId)), eq(courseResources.status, "PUBLISHED")))
      .orderBy(asc(courseResources.createdAt)));
  } catch (error) {
    return next(error);
  }
});

export default router;