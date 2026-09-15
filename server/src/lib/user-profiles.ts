import { eq, asc } from "drizzle-orm";
import { db } from "../../../db/src";
import { userProfiles } from "../../../db/src/schema";

export const USER_ROLES = ["TRAINEE", "TRAINER", "ADMIN"] as const;
export const APPROVAL_STATUSES = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export type ProfileInput = {
  name?: string;
  department?: string;
  title?: string;
  bio?: string;
  qualifications?: string;
  interests?: string;
  experienceYears?: number;
  avatarPath?: string | null;
};

export type AuthIdentity = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
};

function metadataString(metadata: Record<string, unknown>, key: string, fallback = "") {
  return typeof metadata[key] === "string" ? metadata[key].trim() : fallback;
}

function metadataRole(identity: AuthIdentity): UserRole {
  const appRole = metadataString(identity.app_metadata ?? {}, "role");
  if (appRole === "ADMIN") return "ADMIN";
  const userRole = metadataString(identity.user_metadata ?? {}, "role");
  return userRole === "TRAINER" ? "TRAINER" : "TRAINEE";
}

export function serializeProfile(profile: typeof userProfiles.$inferSelect) {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role as UserRole,
    approvalStatus: profile.approvalStatus as ApprovalStatus,
    department: profile.department,
    title: profile.title,
    bio: profile.bio,
    qualifications: profile.qualifications,
    interests: profile.interests,
    experienceYears: profile.experienceYears,
    avatarPath: profile.avatarPath,
  };
}

export async function findProfile(id: string) {
  const rows = await db.select().from(userProfiles).where(eq(userProfiles.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listProfiles() {
  const rows = await db.select().from(userProfiles).orderBy(asc(userProfiles.createdAt));
  return rows.map(serializeProfile);
}

export async function ensureProfile(identity: AuthIdentity, initialInput: ProfileInput = {}) {
  const existing = await findProfile(identity.id);
  const metadata = identity.user_metadata ?? {};
  const role = metadataRole(identity);
  const email = identity.email?.trim().toLowerCase() ?? existing?.email ?? "";
  const name = initialInput.name?.trim() || metadataString(metadata, "full_name") || existing?.name || email.split("@")[0] || "Capacity Connect user";

  if (!email) throw new Error("Authenticated identity is missing an email address.");
  if (existing) {
    // Only server-controlled app_metadata can grant ADMIN. User metadata is
    // intentionally limited to the public signup roles above.
    if (role === "ADMIN" && existing.role !== "ADMIN") {
      const [updated] = await db.update(userProfiles)
        .set({ role: "ADMIN", approvalStatus: "APPROVED", updatedAt: new Date() })
        .where(eq(userProfiles.id, identity.id))
        .returning();
      return updated;
    }
    return existing;
  }

  const [created] = await db.insert(userProfiles).values({
    id: identity.id,
    email,
    name,
    role,
    approvalStatus: role === "ADMIN" ? "APPROVED" : "PENDING",
    department: initialInput.department?.trim() || metadataString(metadata, "department"),
    title: initialInput.title?.trim() || metadataString(metadata, "title"),
    bio: initialInput.bio?.trim() || "",
    qualifications: initialInput.qualifications?.trim() || "",
    interests: initialInput.interests?.trim() || "",
    experienceYears: Math.max(0, Math.floor(initialInput.experienceYears ?? 0)),
    avatarPath: null,
  }).returning();
  return created;
}

export async function updateProfile(id: string, input: ProfileInput) {
  const [updated] = await db.update(userProfiles).set({
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.department !== undefined ? { department: input.department.trim() } : {}),
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.bio !== undefined ? { bio: input.bio.trim() } : {}),
    ...(input.qualifications !== undefined ? { qualifications: input.qualifications.trim() } : {}),
    ...(input.interests !== undefined ? { interests: input.interests.trim() } : {}),
    ...(input.experienceYears !== undefined ? { experienceYears: Math.max(0, Math.floor(input.experienceYears)) } : {}),
    ...(input.avatarPath !== undefined ? { avatarPath: input.avatarPath } : {}),
    updatedAt: new Date(),
  }).where(eq(userProfiles.id, id)).returning();
  return updated ?? null;
}

export async function updateApproval(id: string, approvalStatus: ApprovalStatus, role?: UserRole) {
  const [updated] = await db.update(userProfiles).set({
    approvalStatus,
    ...(role ? { role } : {}),
    updatedAt: new Date(),
  }).where(eq(userProfiles.id, id)).returning();
  return updated ?? null;
}