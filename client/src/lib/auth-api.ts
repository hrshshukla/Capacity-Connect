import { customFetch } from './api-client-react/custom-fetch';

export type UserRole = 'TRAINEE' | 'TRAINER' | 'ADMIN';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  approvalStatus: ApprovalStatus;
  rejectionReason?: string;
  department: string;
  title: string;
  bio: string;
  qualifications: string;
  interests: string;
  experienceYears: number;
  avatarPath: string | null;
};

export type AuthResponse = {
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
  user: UserProfile | null;
  requiresEmailVerification?: boolean;
};

export type ProfileInput = Omit<Partial<UserProfile>, 'id' | 'email' | 'role' | 'approvalStatus'>;

export const getAuthMe = () => customFetch<UserProfile>('/api/auth/me');
export const getProfile = () => customFetch<UserProfile>('/api/profile');
export const updateProfile = (input: ProfileInput) =>
  customFetch<UserProfile>('/api/profile', { method: 'PATCH', body: JSON.stringify(input) });
export type AdminInvitationDetails = { name: string; email: string };
export const getAdminInvitation = (id: string) => customFetch<AdminInvitationDetails>(`/api/auth/admin-invitations/${encodeURIComponent(id)}`);
export const completeAdminInvitation = (id: string, input: ProfileInput) =>
  customFetch<UserProfile>(`/api/auth/admin-invitations/${encodeURIComponent(id)}/complete`, { method: "POST", body: JSON.stringify(input) });
export const createAvatarUpload = () =>
  customFetch<{ bucket: string; path: string; token: string; signedUrl: string }>('/api/profile/avatar-upload', { method: 'POST' });
export const listAdminUsers = () => customFetch<UserProfile[]>('/api/admin/users');
export const updateUserApproval = (userId: string, approvalStatus: ApprovalStatus, role?: UserRole) =>
  customFetch<UserProfile>(`/api/admin/users/${userId}/approval`, {
    method: 'PATCH',
    body: JSON.stringify({ approvalStatus, ...(role ? { role } : {}) }),
  });