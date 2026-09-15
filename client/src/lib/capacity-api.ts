import { customFetch } from './api-client-react/custom-fetch';

export type LearningModule = {
  id: string;
  title: string;
  durationMinutes: number;
  completed: boolean;
};

export type LearningItem = {
  id: string;
  courseId: string;
  title: string;
  subject: string;
  progress: number;
  status: string;
  nextModule: string;
  modules: LearningModule[];
};

export type AssessmentSummary = {
  id: string;
  title: string;
  subject: string;
  courseId: string;
  course: string;
  status: string;
  questions: number;
  durationMinutes: number;
  deadline: string;
  passingScore: number;
};

export type AssessmentQuestion = {
  id: string;
  prompt: string;
  options: string[];
  competency: string;
  marks: number;
  explanation?: string;
};

export type AssessmentDetail = Omit<AssessmentSummary, 'questions'> & {
  questions: AssessmentQuestion[];
};

export type AssessmentResult = {
  id: string;
  assessment: string;
  assessmentId: string;
  courseId: string;
  score: number;
  percentage: number;
  status: string;
  correct: number;
  incorrect: number;
  skipped: number;
  timeTaken: string;
  competencyBreakdown: { name: string; percentage: number }[];
  submittedAt: string;
};

export type Certificate = {
  id: string;
  title: string;
  course: string;
  issued: string;
  status: string;
  courseId: string;
};

export type ModuleCompletion = {
  courseId: string;
  moduleId: string;
  progress: number;
  completed: boolean;
};

export type CourseFeedback = {
  contentType?: "COURSE" | "CONTENT" | "TRAINER";
  rating: number;
  contentQuality: number;
  trainerQuality: number;
  usefulness: number;
  comments: string;
};

export type HomepageContent = {
  announcements: Array<{ id: string; title: string; description: string; imagePath: string | null; targetAudience: string; publishedAt: string | null }>;
  notifications: Array<{ id: string; title: string; description: string; notificationType: string; targetAudience: string; publishedAt: string | null }>;
  achievements: Array<{ id: string; title: string; description: string; achievementDate: string | null; imagePath: string | null; personOrTeam: string; publishedAt: string | null }>;
  learningContent: Array<{ id: string; title: string; description: string; contentType: string; resourcePath: string | null; courseId: string | null; publishedAt: string | null }>;
};

export const getHomepageContent = () => customFetch<HomepageContent>('/api/v1/homepage-content');
export const getLearning = () => customFetch<LearningItem[]>('/api/v1/learning');
export const completeModule = (moduleId: string) =>
  customFetch<ModuleCompletion>(`/api/v1/modules/${moduleId}/complete`, { method: 'POST' });
export const listAssessments = () => customFetch<AssessmentSummary[]>('/api/v1/assessments');
export const getAssessment = (assessmentId: string) =>
  customFetch<AssessmentDetail>(`/api/v1/assessments/${assessmentId}`);
export const submitAssessment = (assessmentId: string, answers: Record<string, number>, timeTakenSeconds: number) =>
  customFetch<AssessmentResult>(`/api/v1/assessments/${assessmentId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers, timeTakenSeconds }),
  });
export const listResults = () => customFetch<AssessmentResult[]>('/api/v1/results');
export const listCertificates = () => customFetch<Certificate[]>('/api/v1/certificates');
export const submitFeedback = (courseId: string, feedback: CourseFeedback) =>
  customFetch(`/api/v1/courses/${courseId}/feedback`, {
    method: 'POST',
    body: JSON.stringify(feedback),
  });