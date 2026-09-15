import type { NextFunction, Request, Response } from "express";
import {
  ensureProfile,
  serializeProfile,
  type ApprovalStatus,
  type UserRole,
} from "../lib/user-profiles";
import { getSupabaseUser, supabaseUserMetadata } from "../lib/supabase";

export type AuthContext = {
  accessToken: string;
  identity: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
  };
  profile: ReturnType<typeof serializeProfile>;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

function accessTokenFromRequest(req: Request) {
  const header = req.header("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim() || null;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const accessToken = accessTokenFromRequest(req);
  if (!accessToken) return next();
  try {
    const user = await getSupabaseUser(accessToken);
    if (!user) return next();
    const identity = {
      id: user.id,
      email: user.email,
      user_metadata: supabaseUserMetadata(user),
      app_metadata: (user.app_metadata ?? {}) as Record<string, unknown>,
    };
    const isInvitationRequest = req.path.startsWith("/auth/admin-invitations/");
    const profile = isInvitationRequest
      ? {
          id: identity.id,
          email: identity.email ?? "",
          name: typeof identity.user_metadata?.full_name === "string" ? identity.user_metadata.full_name : "",
          role: "TRAINEE" as const,
          approvalStatus: "PENDING" as const,
          department: "",
          title: "",
          bio: "",
          qualifications: "",
          interests: "",
          experienceYears: 0,
          avatarPath: null,
        }
      : serializeProfile(await ensureProfile(identity));
    req.auth = { accessToken, identity, profile };
    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireAuth() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ message: "Authentication is required." });
    return next();
  };
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ message: "Authentication is required." });
    if (!roles.includes(req.auth.profile.role)) {
      return res.status(403).json({ message: "You do not have permission to perform this action." });
    }
    return next();
  };
}

export function hasSuperAdminAccess(req: Request) {
  if (!req.auth) return false;
  const configuredId = process.env.SUPER_ADMIN_USER_ID;
  const configuredEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(
    (configuredId && req.auth.identity.id === configuredId) ||
    (configuredEmail && req.auth.identity.email?.toLowerCase() === configuredEmail) ||
    req.auth.identity.app_metadata?.super_admin === true,
  );
}

export function requireSuperAdmin() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ message: "Authentication is required." });
    if (!hasSuperAdminAccess(req)) return res.status(403).json({ message: "Super administrator access is required." });
    return next();
  };
}

export function requireAnyRole(...roles: UserRole[]) {
  return requireRole(...roles);
}

export function requireApproved() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ message: "Authentication is required." });
    if (req.auth.profile.approvalStatus !== "APPROVED") {
      return res.status(403).json({
        message: `Account approval is ${req.auth.profile.approvalStatus.toLowerCase()}.`,
        approvalStatus: req.auth.profile.approvalStatus,
      });
    }
    return next();
  };
}

export function approvalStatus(value: unknown): value is ApprovalStatus {
  return value === "PENDING" || value === "APPROVED" || value === "REJECTED" || value === "SUSPENDED";
}