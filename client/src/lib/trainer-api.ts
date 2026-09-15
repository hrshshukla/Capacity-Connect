import { customFetch } from "@/lib/api-client-react/custom-fetch";

export type TrainerDashboard = {
  metrics: {
    courses: number;
    activeLearners: number;
    assessments: number;
    completionRate: number;
    averagePerformance: number;
  };
  upcomingDeadlines: Array<{ id: string; title: string; deadline: string }>;
  recentActivity: Array<{ trainee: string; course: string; progress: number; status: string; updatedAt: string }>;
};

export type TrainerParticipation = {
  items: Array<{
    id: string;
    trainee: string;
    email: string;
    course: string;
    enrollmentDate: string;
    progress: number;
    status: string;
    assessment: string | null;
    score: number | null;
    completion: string | null;
  }>;
  pagination: { page: number; pageSize: number; total: number };
};

export type TrainerLibraryItem = {
  id: string;
  title: string;
  description: string;
  itemType: "LECTURE" | "PRESENTATION" | "STUDY_MATERIAL";
  storagePath?: string | null;
  resourceUrl?: string | null;
  status: string;
  publishedAt?: string | null;
  trainerName?: string;
  createdAt: string;
};

export const getTrainerDashboard = () => customFetch<TrainerDashboard>("/api/trainer/dashboard");
export const listTrainerParticipation = (params: { search?: string; status?: string; page?: number } = {}) =>
  customFetch<TrainerParticipation>(`/api/trainer/participation?${new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== "").map(([key, value]) => [key, String(value)]))}`);
export const exportTrainerParticipation = () =>
  customFetch<string>("/api/trainer/participation?format=csv", { responseType: "text" });
export const listTrainerQuestionnaires = () => customFetch<Array<{ id: string; title: string; description: string; deadline: string | null; status: string; createdAt: string }>>("/api/trainer/questionnaires");
export const createTrainerQuestionnaire = (input: { title: string; description: string; deadline: string; courseId: string; questions: Array<{ prompt: string; options: string[]; correctOption: number }> }) =>
  customFetch("/api/trainer/questionnaires", { method: "POST", body: JSON.stringify(input) });
export const updateTrainerQuestionnaire = (id: string, status: string) =>
  customFetch(`/api/trainer/questionnaires/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
export const listTrainerLibrary = () => customFetch<TrainerLibraryItem[]>("/api/trainer/library");
export const uploadTrainerLibraryFile = (fileName: string) =>
  customFetch<{ bucket: string; path: string; signedUrl: string }>("/api/trainer/library/upload", { method: "POST", body: JSON.stringify({ fileName }) });
export const createTrainerLibraryItem = (input: { title: string; description: string; itemType: string; storagePath?: string; resourceUrl?: string }) =>
  customFetch<TrainerLibraryItem>("/api/trainer/library", { method: "POST", body: JSON.stringify(input) });
export const updateTrainerLibraryItem = (id: string, status: string) =>
  customFetch<TrainerLibraryItem>(`/api/trainer/library/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
export const deleteTrainerLibraryItem = (id: string) =>
  customFetch(`/api/trainer/library/${id}`, { method: "DELETE" });
export const listLearnerLibrary = () => customFetch<TrainerLibraryItem[]>("/api/v1/trainer-library");
export const getLearnerLibraryDownload = (id: string) => customFetch<{ url: string }>(`/api/v1/trainer-library/${id}/download`);