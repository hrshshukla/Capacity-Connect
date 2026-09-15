import { customFetch } from "./api-client-react/custom-fetch";
import type { ApprovalStatus, UserProfile, UserRole } from "./auth-api";

export type AdminPage<T> = {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export type AdminUserDetail = {
  profile: UserProfile;
  documents: AdminDocument[];
};

export type AdminDocument = {
  id: string;
  userId: string;
  documentType: string;
  title: string;
  storagePath: string;
  reviewStatus: "PENDING" | "VERIFIED" | "REJECTED";
  rejectionReason: string;
};

export type AdminDashboard = {
  metrics: Record<string, number>;
  trends: {
    userGrowth: Array<{ month: string; value: number }>;
    enrollments: Array<{ month: string; value: number }>;
    certificates: Array<{ month: string; value: number }>;
  };
  breakdowns: {
    courseCompletion: Array<{ title: string; total: number; completed: number }>;
    assessmentPerformance: Array<{ title: string; attempts: number; average_score: number; passed: number }>;
    participationByDepartment: Array<{ department: string; enrollments: number; completed: number }>;
  };
};

export const getAdminDashboard = () => customFetch<AdminDashboard>("/api/admin/dashboard");
export const listAdminUsers = (params: { search?: string; status?: string; role?: string; page?: number; pageSize?: number } = {}) =>
  customFetch<AdminPage<UserProfile>>(`/api/admin/users?${new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== "").map(([key, value]) => [key, String(value)]))}`);
export const listPendingAdminUsers = (page = 1) => customFetch<AdminPage<UserProfile>>(`/api/admin/users/pending?page=${page}&pageSize=20`);
export const getAdminUser = (id: string) => customFetch<AdminUserDetail>(`/api/admin/users/${id}`);
export const updateAdminUserStatus = (id: string, approvalStatus: ApprovalStatus, rejectionReason?: string) =>
  customFetch<UserProfile>(`/api/admin/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ approvalStatus, rejectionReason }) });
export const updateAdminUserRole = (id: string, role: UserRole) =>
  customFetch<UserProfile>(`/api/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
export const reviewAdminDocument = (id: string, reviewStatus: AdminDocument["reviewStatus"], rejectionReason?: string) =>
  customFetch<AdminDocument>(`/api/admin/documents/${id}`, { method: "PATCH", body: JSON.stringify({ reviewStatus, rejectionReason }) });

export type AdminCourse = { id: string; title: string; description: string; status: string; difficulty: string; durationHours: number; rejectionReason: string };
export type AdminAssessment = { id: string; title: string; status: string; durationMinutes: number; passingScore: number; attemptLimit: number };
export type AdminEnrollment = { id: string; courseId: string; userId: string; progress: number; status: string };
export type AdminCertificate = { id: string; courseId: string; userId: string; title: string; status: string; issuedAt: string };
export const listAdminCourses = () => customFetch<AdminCourse[]>("/api/admin/courses");
export const updateAdminCourseStatus = (id: string, status: string, rejectionReason?: string) =>
  customFetch<AdminCourse>(`/api/admin/courses/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, rejectionReason }) });
export const listAdminAssessments = () => customFetch<AdminAssessment[]>("/api/admin/assessments");
export const listAdminEnrollments = () => customFetch<AdminEnrollment[]>("/api/admin/enrollments");
export const listAdminCertificates = () => customFetch<AdminCertificate[]>("/api/admin/certificates");

export type CompetencyConfig = {
  competencies: Array<{ id: string; name: string; color: string }>;
  levels: Array<{ level: number; title: string; description: string; scoreThreshold: number }>;
  subjects: Array<{ id: string; name: string }>;
  mappings: Array<{ subjectId: string; competencyId: string; requiredLevel: number; weight: number; mandatory: boolean }>;
};
export const getCompetencyConfig = () => customFetch<CompetencyConfig>("/api/admin/competency-config");
export const updateCompetency = (id: string, input: { name: string; color: string }) =>
  customFetch(`/api/admin/competencies/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const updateCompetencyLevel = (level: number, input: { title: string; description: string; scoreThreshold: number }) =>
  customFetch(`/api/admin/competency-levels/${level}`, { method: "PATCH", body: JSON.stringify(input) });
export const updateSubjectRequirement = (input: { subjectId: string; competencyId: string; requiredLevel: number; weight: number; mandatory: boolean }) =>
  customFetch("/api/admin/subject-requirements", { method: "PUT", body: JSON.stringify(input) });
export const getTrainerMatches = (subjectId: string) => customFetch<{ matches: Array<{ trainer: UserProfile; competencyMatch: number; eligible: boolean }> }>(`/api/admin/trainer-matching?subjectId=${encodeURIComponent(subjectId)}`);

export type ContentKind = "announcements" | "notifications" | "achievements" | "learning-content";
export type AdminContent = {
  id: string;
  title: string;
  description: string;
  status?: string;
  publishedAt?: string | null;
  imagePath?: string | null;
  targetAudience?: string;
  notificationType?: string;
  achievementDate?: string | null;
  personOrTeam?: string;
  contentType?: string;
  resourcePath?: string | null;
  courseId?: string | null;
};
export const listAdminContent = (kind: ContentKind) => customFetch<AdminContent[]>(`/api/admin/content/${kind}`);
export const createAdminContent = (kind: ContentKind, input: Record<string, unknown>) =>
  customFetch<AdminContent>(`/api/admin/content/${kind}`, { method: "POST", body: JSON.stringify(input) });
export const updateAdminContentStatus = (kind: ContentKind, id: string, status: string) =>
  customFetch<AdminContent>(`/api/admin/content/${kind}/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
export const deleteAdminContent = (kind: ContentKind, id: string) =>
  customFetch<void>(`/api/admin/content/${kind}/${id}`, { method: "DELETE" });
export const listAdminAuditLogs = () => customFetch<Array<{ id: string; actorId: string; action: string; entityType: string; entityId: string; metadata: string; createdAt: string }>>("/api/admin/audit-logs");
export const listAdminSettings = () => customFetch<Array<{ key: string; value: string }>>("/api/admin/settings");
export const saveAdminSettings = (values: Record<string, string>) => customFetch("/api/admin/settings", { method: "PUT", body: JSON.stringify(values) });
export const getSuperAdminStatus = () => customFetch<{ allowed: boolean }>("/api/admin/super-admin/status");
export type AdminInvitation = {
  id: string;
  name: string;
  email: string;
  status: "PENDING" | "COMPLETED";
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
};
export const listAdminInvitations = () => customFetch<AdminInvitation[]>("/api/admin/invitations");
export const createAdminInvitation = (input: { name: string; email: string }) =>
  customFetch<{ success: boolean }>("/api/admin/invitations", { method: "POST", body: JSON.stringify(input) });
export const resendAdminInvitation = (id: string) =>
  customFetch<{ success: boolean }>(`/api/admin/invitations/${encodeURIComponent(id)}/resend`, { method: "POST" });