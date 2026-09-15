import { customFetch } from "./api-client-react/custom-fetch";
import type { UserProfile } from "./auth-api";

export type Qualification = {
  id?: string;
  institution: string;
  qualification: string;
  field: string;
  year: number | null;
  description: string;
};

export type Experience = {
  id?: string;
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type Skill = { id?: string; name: string; proficiency: string };
export type Interest = { id?: string; name: string };
export type ProfileCertificate = {
  id?: string;
  name: string;
  issuer: string;
  issuedDate: string;
  credentialUrl: string;
};

export type TraineeProfile = {
  user: UserProfile;
  profile: {
    userId: string;
    phone: string;
    location: string;
    headline: string;
    summary: string;
  };
  qualifications: Qualification[];
  experiences: Experience[];
  skills: Skill[];
  interests: Interest[];
  certificates: ProfileCertificate[];
};

export type TraineeProfileInput = {
  user: Partial<Pick<UserProfile, "name" | "department" | "title" | "bio" | "experienceYears">>;
  phone: string;
  location: string;
  headline: string;
  summary: string;
  qualifications: Qualification[];
  experiences: Experience[];
  skills: Skill[];
  interests: Interest[];
  certificates: ProfileCertificate[];
};

export type CourseResource = {
  id: string;
  courseId: string;
  moduleId: string | null;
  title: string;
  description: string;
  resourceType: string;
  resourceUrl: string;
  status: string;
};

export const getTraineeProfile = () => customFetch<TraineeProfile>("/api/v1/trainee/profile");
export const updateTraineeProfile = (input: TraineeProfileInput) =>
  customFetch<TraineeProfile>("/api/v1/trainee/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
export const getCourseResources = (courseId: string) =>
  customFetch<CourseResource[]>(`/api/v1/trainee/courses/${courseId}/resources`);