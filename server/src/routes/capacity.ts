import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../../db/src";
import {
  courseResources,
  traineeAssessmentAttempts,
  traineeCertificatesIssued,
  traineeEnrollments,
  traineeFeedback,
  traineeModuleProgress,
  contentAchievements,
  contentAnnouncements,
  contentNotifications,
  learningContents,
} from "../../../db/src/schema";
import {
  CreateCourseBody,
  GetCourseParams,
  ListCoursesQueryParams,
  ListRecommendedTrainersParams,
  MarkNotificationReadParams,
} from "../../../shared/schemas";
import { requireApproved, requireAuth, requireRole } from "../middleware/auth";
import { writeAuditLog } from "../lib/audit";

type Course = {
  id: string;
  title: string;
  subject: string;
  difficulty: string;
  durationHours: number;
  trainer: string;
  rating: number;
  enrolled: number;
  progress: number;
  thumbnailTone: string;
  description: string;
  objectives: string[];
  modules: { id: string; title: string; durationMinutes: number; completed: boolean }[];
  trainerBio: string;
  nextSession: string;
  ownerId?: string;
};

type Competency = {
  id: string;
  name: string;
  score: number;
  level: number;
  levelTitle: string;
  trend: number;
  color: string;
};

type Notification = {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
};

type AssessmentQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctOption: number;
  explanation: string;
  competency: string;
  marks: number;
};

type Assessment = {
  id: string;
  title: string;
  subject: string;
  courseId: string;
  course: string;
  status: "ACTIVE" | "COMPLETED";
  durationMinutes: number;
  deadline: string;
  passingScore: number;
  attemptLimit: number;
  questions: AssessmentQuestion[];
};

type AssessmentResult = {
  id: string;
  assessment: string;
  assessmentId: string;
  courseId: string;
  score: number;
  percentage: number;
  status: "PASSED" | "NOT_PASSED";
  correct: number;
  incorrect: number;
  skipped: number;
  timeTaken: string;
  competencyBreakdown: { name: string; percentage: number }[];
  submittedAt: string;
};

type Certificate = {
  id: string;
  title: string;
  course: string;
  issued: string;
  status: "ISSUED";
  courseId: string;
};

type Feedback = {
  id: string;
  courseId: string;
  rating: number;
  contentQuality: number;
  trainerQuality: number;
  usefulness: number;
  comments: string;
  submittedAt: string;
  contentType?: string;
};

const levelTitles = ["Awareness", "Basic", "Practitioner", "Advanced", "Expert"];

const courses: Course[] = [
  {
    id: "nwp-fundamentals",
    title: "Introduction to Numerical Weather Prediction",
    subject: "Numerical Weather Prediction",
    difficulty: "Intermediate",
    durationHours: 18,
    trainer: "Dr. Ananya Sharma",
    rating: 4.8,
    enrolled: 84,
    progress: 68,
    thumbnailTone: "indigo",
    description:
      "Build a practical foundation in the models, data assimilation, and forecast interpretation that underpin modern operational weather prediction.",
    objectives: [
      "Explain the NWP forecast cycle and core model components",
      "Interpret forecast fields and identify common model biases",
      "Use verification metrics to communicate forecast confidence",
    ],
    modules: [
      { id: "nwp-1", title: "Forecast cycle and model architecture", durationMinutes: 42, completed: true },
      { id: "nwp-2", title: "Data assimilation fundamentals", durationMinutes: 56, completed: true },
      { id: "nwp-3", title: "Reading model guidance", durationMinutes: 48, completed: false },
      { id: "nwp-4", title: "Verification and uncertainty", durationMinutes: 38, completed: false },
    ],
    trainerBio: "Numerical modelling specialist with 12 years supporting operational forecasting and capacity building.",
    nextSession: "Thursday, 19 September · 14:00 IST",
  },
  {
    id: "satellite-meteorology",
    title: "Satellite Meteorology Fundamentals",
    subject: "Satellite Meteorology",
    difficulty: "Beginner",
    durationHours: 12,
    trainer: "Dr. Kavita Verma",
    rating: 4.9,
    enrolled: 61,
    progress: 0,
    thumbnailTone: "teal",
    description:
      "Learn to interpret multispectral satellite imagery for cloud analysis, rainfall estimation, and severe weather monitoring.",
    objectives: [
      "Distinguish visible, infrared, and water vapour products",
      "Identify convective signatures in satellite imagery",
      "Translate satellite observations into forecast decisions",
    ],
    modules: [
      { id: "sat-1", title: "Remote sensing essentials", durationMinutes: 40, completed: false },
      { id: "sat-2", title: "Multispectral imagery", durationMinutes: 52, completed: false },
      { id: "sat-3", title: "Applications for severe weather", durationMinutes: 46, completed: false },
    ],
    trainerBio: "Satellite applications lead focused on observation-led forecasting and remote sensing education.",
    nextSession: "Monday, 23 September · 11:00 IST",
  },
  {
    id: "climate-data",
    title: "Climate Data Analysis",
    subject: "Data Analysis",
    difficulty: "Advanced",
    durationHours: 24,
    trainer: "Dr. Rohan Iyer",
    rating: 4.7,
    enrolled: 42,
    progress: 25,
    thumbnailTone: "amber",
    description:
      "Work with climate datasets, anomalies, trends, and uncertainty to produce defensible analysis for planning and policy.",
    objectives: [
      "Prepare station and gridded climate datasets",
      "Quantify trends and anomalies with reproducible methods",
      "Communicate uncertainty in climate indicators",
    ],
    modules: [
      { id: "climate-1", title: "Data quality and homogenization", durationMinutes: 58, completed: true },
      { id: "climate-2", title: "Trend and anomaly analysis", durationMinutes: 64, completed: false },
      { id: "climate-3", title: "Communicating uncertainty", durationMinutes: 44, completed: false },
    ],
    trainerBio: "Climate analytics researcher translating long-term datasets into operational intelligence.",
    nextSession: "Wednesday, 25 September · 15:30 IST",
  },
  {
    id: "early-warning",
    title: "Disaster and Early Warning Systems",
    subject: "Early Warning Systems",
    difficulty: "Intermediate",
    durationHours: 16,
    trainer: "Dr. Meera Nair",
    rating: 4.8,
    enrolled: 97,
    progress: 0,
    thumbnailTone: "rose",
    description:
      "Connect hazard monitoring, impact-based forecasting, and last-mile communication into an effective early warning workflow.",
    objectives: [
      "Map the components of a people-centred early warning system",
      "Use impact thresholds to shape warning messages",
      "Evaluate warning performance after an event",
    ],
    modules: [
      { id: "ews-1", title: "Risk and impact-based forecasting", durationMinutes: 48, completed: false },
      { id: "ews-2", title: "Warning protocols", durationMinutes: 50, completed: false },
      { id: "ews-3", title: "Post-event evaluation", durationMinutes: 42, completed: false },
    ],
    trainerBio: "Early warning programme lead with a focus on translating forecasts into timely public action.",
    nextSession: "Friday, 27 September · 10:00 IST",
  },
];

const competencies: Competency[] = [
  { id: "meteorology", name: "Meteorology", score: 78, level: 4, levelTitle: "Advanced", trend: 6, color: "#3f5bd8" },
  { id: "nwp", name: "Numerical Weather Prediction", score: 52, level: 3, levelTitle: "Practitioner", trend: 11, color: "#0c8f87" },
  { id: "data-analysis", name: "Data Analysis", score: 67, level: 4, levelTitle: "Advanced", trend: 3, color: "#e09b35" },
  { id: "python", name: "Python", score: 43, level: 3, levelTitle: "Practitioner", trend: 8, color: "#cb5577" },
  { id: "forecasting", name: "Forecasting", score: 71, level: 4, levelTitle: "Advanced", trend: 4, color: "#6c5bb7" },
];

const gaps = [
  {
    id: "nwp-gap",
    name: "Numerical Weather Prediction",
    currentLevel: 3,
    requiredLevel: 5,
    gap: 2,
    priority: "High",
    recommendedCourse: "Introduction to Numerical Weather Prediction",
    recommendedTrainer: "Dr. Ananya Sharma",
  },
  {
    id: "python-gap",
    name: "Python",
    currentLevel: 3,
    requiredLevel: 4,
    gap: 1,
    priority: "Medium",
    recommendedCourse: "Python for Meteorological Data Analysis",
    recommendedTrainer: "Dr. Rohan Iyer",
  },
  {
    id: "data-gap",
    name: "Data Analysis",
    currentLevel: 4,
    requiredLevel: 5,
    gap: 1,
    priority: "Medium",
    recommendedCourse: "Climate Data Analysis",
    recommendedTrainer: "Dr. Rohan Iyer",
  },
];

const trainers = [
  {
    id: "ananya-sharma",
    name: "Dr. Ananya Sharma",
    title: "Lead Numerical Modelling Specialist",
    levels: { meteorology: 5, nwp: 5, "data-analysis": 4, python: 3, forecasting: 5 },
    experienceYears: 12,
    relevantTrainings: 9,
    strongestCompetencies: ["Meteorology", "Numerical Weather Prediction", "Forecasting"],
    missingCompetencies: [],
  },
  {
    id: "kavita-verma",
    name: "Dr. Kavita Verma",
    title: "Satellite Applications Lead",
    levels: { meteorology: 5, nwp: 3, "data-analysis": 4, python: 3, forecasting: 4 },
    experienceYears: 10,
    relevantTrainings: 7,
    strongestCompetencies: ["Meteorology", "Satellite Meteorology", "Forecasting"],
    missingCompetencies: ["Advanced NWP"],
  },
  {
    id: "rohan-iyer",
    name: "Dr. Rohan Iyer",
    title: "Climate Analytics Researcher",
    levels: { meteorology: 4, nwp: 3, "data-analysis": 5, python: 5, forecasting: 3 },
    experienceYears: 8,
    relevantTrainings: 6,
    strongestCompetencies: ["Data Analysis", "Python", "Climate Science"],
    missingCompetencies: ["Expert NWP"],
  },
];

const notifications: Notification[] = [
  { id: "n-1", type: "COMPETENCY_RECOMMENDATION", title: "New training recommendation", description: "Your NWP gap is ready for review. See why Dr. Sharma is the strongest match.", time: "12 min ago", read: false },
  { id: "n-2", type: "ASSESSMENT_DEADLINE", title: "Assessment closes soon", description: "Climate Data Analysis assessment closes on 30 September.", time: "2 hrs ago", read: false },
  { id: "n-3", type: "NEW_COURSE", title: "New course published", description: "Disaster and Early Warning Systems is now available in the catalogue.", time: "Yesterday", read: true },
];

const currentUser = {
  id: "trainee-001",
  name: "Aarav Menon",
  role: "Trainee",
  department: "Forecasting Services",
  avatarInitials: "AM",
};

function userForRequest(req: import("express").Request) {
  const profile = req.auth?.profile;
  if (!profile) return currentUser;
  return {
    id: profile.id,
    name: profile.name,
    role: profile.role[0] + profile.role.slice(1).toLowerCase(),
    department: profile.department,
    avatarInitials: profile.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase(),
  };
}

const activity = [
  { id: "a-1", label: "Completed module", detail: "Data quality and homogenization", time: "Yesterday", tone: "teal" },
  { id: "a-2", label: "Assessment result", detail: "Meteorology fundamentals · 84%", time: "3 days ago", tone: "indigo" },
  { id: "a-3", label: "Course enrolled", detail: "Introduction to Numerical Weather Prediction", time: "12 Sep", tone: "amber" },
];

const assessments: Assessment[] = [
  {
    id: "nwp-checkpoint",
    title: "NWP Foundations Checkpoint",
    subject: "Numerical Weather Prediction",
    courseId: "nwp-fundamentals",
    course: "Introduction to Numerical Weather Prediction",
    status: "ACTIVE",
    durationMinutes: 20,
    deadline: "30 September 2026",
    passingScore: 70,
    attemptLimit: 2,
    questions: [
      {
        id: "nwp-q1",
        prompt: "What is the primary purpose of data assimilation in an NWP system?",
        options: ["To replace the forecast model", "To combine observations with a model state", "To increase the number of forecast maps", "To remove all uncertainty"],
        correctOption: 1,
        explanation: "Data assimilation combines observations and a prior model state to create the best available analysis.",
        competency: "Numerical Weather Prediction",
        marks: 1,
      },
      {
        id: "nwp-q2",
        prompt: "Which measure is most useful for communicating forecast error over many cases?",
        options: ["A single maximum value", "A verification metric such as RMSE", "The map colour palette", "The model run time"],
        correctOption: 1,
        explanation: "Aggregated verification measures such as RMSE summarize forecast performance across cases.",
        competency: "Forecasting",
        marks: 1,
      },
      {
        id: "nwp-q3",
        prompt: "A forecast ensemble is primarily used to represent:",
        options: ["Only the best forecast", "Uncertainty across plausible forecast outcomes", "The observation network", "A fixed climatology"],
        correctOption: 1,
        explanation: "An ensemble samples plausible outcomes to help describe forecast uncertainty.",
        competency: "Meteorology",
        marks: 1,
      },
      {
        id: "nwp-q4",
        prompt: "What should a forecaster do when model guidance disagrees with observations?",
        options: ["Ignore observations", "Use the discrepancy as evidence to investigate the forecast", "Publish both without context", "Delete the model run"],
        correctOption: 1,
        explanation: "Disagreement is a signal to investigate model error, observations, and the forecast context.",
        competency: "Forecasting",
        marks: 1,
      },
    ],
  },
];

type LearnerState = {
  enrollments: Map<string, { progress: number; completedModuleIds: Set<string>; enrolled: boolean }>;
  results: AssessmentResult[];
  certificates: Certificate[];
  feedbackCourseIds: Set<string>;
};

const learnerStates = new Map<string, LearnerState>();

function stateFor(req: import("express").Request) {
  const userId = req.auth?.profile.id;
  if (!userId) throw new Error("Authenticated learner state is required.");
  const existing = learnerStates.get(userId);
  if (existing) return existing;
  const state: LearnerState = {
    enrollments: new Map(),
    results: [],
    certificates: [],
    feedbackCourseIds: new Set(),
  };
  learnerStates.set(userId, state);
  return state;
}

function enrollmentFor(state: LearnerState, course: Course) {
  const existing = state.enrollments.get(course.id);
  if (existing) return existing;
  const created = {
    progress: 0,
    completedModuleIds: new Set<string>(),
    enrolled: false,
  };
  state.enrollments.set(course.id, created);
  return created;
}

async function loadEnrollmentState(userId: string, course: Course) {
  const state = learnerStates.get(userId) ?? {
    enrollments: new Map<string, { progress: number; completedModuleIds: Set<string>; enrolled: boolean }>(),
    results: [],
    certificates: [],
    feedbackCourseIds: new Set<string>(),
  };
  learnerStates.set(userId, state);

  const [savedEnrollment] = await db
    .select()
    .from(traineeEnrollments)
    .where(and(eq(traineeEnrollments.userId, userId), eq(traineeEnrollments.courseId, course.id)))
    .limit(1);
  const savedProgress = await db
    .select()
    .from(traineeModuleProgress)
    .where(and(eq(traineeModuleProgress.userId, userId), eq(traineeModuleProgress.courseId, course.id)));
  const existing = enrollmentFor(state, course);
  const completedModuleIds = new Set(
    savedProgress.filter((item) => item.completed).map((item) => item.moduleId),
  );
  if (!savedProgress.length) {
    existing.completedModuleIds.forEach((moduleId) => completedModuleIds.add(moduleId));
  }
  const enrollment = {
    progress: savedEnrollment?.progress ?? existing.progress,
    completedModuleIds,
    enrolled: Boolean(savedEnrollment) || existing.enrolled,
  };
  state.enrollments.set(course.id, enrollment);
  return enrollment;
}

function courseForLearner(course: Course, req: import("express").Request) {
  if (!req.auth) return course;
  const enrollment = enrollmentFor(stateFor(req), course);
  return {
    ...course,
    progress: enrollment.progress,
    modules: course.modules.map((module) => ({ ...module, completed: enrollment.completedModuleIds.has(module.id) })),
  };
}

async function persistedCourseForLearner(course: Course, req: import("express").Request) {
  if (!req.auth) return course;
  const enrollment = await loadEnrollmentState(req.auth.profile.id, course);
  return {
    ...course,
    progress: enrollment.progress,
    modules: course.modules.map((module) => ({
      ...module,
      completed: enrollment.completedModuleIds.has(module.id),
    })),
  };
}

function canManageCourse(course: Course, req: import("express").Request) {
  return req.auth?.profile.role === "ADMIN" || course.ownerId === req.auth?.profile.id;
}

async function saveEnrollment(userId: string, courseId: string, progress: number, status = "ACTIVE") {
  const [enrollment] = await db.insert(traineeEnrollments).values({
    id: randomUUID(),
    userId,
    courseId,
    progress,
    status,
    completedAt: status === "COMPLETED" ? new Date() : null,
  }).onConflictDoUpdate({
    target: [traineeEnrollments.userId, traineeEnrollments.courseId],
    set: {
      progress,
      status,
      completedAt: status === "COMPLETED" ? new Date() : null,
      updatedAt: new Date(),
    },
  }).returning();
  return enrollment;
}

async function saveIssuedCertificate(userId: string, course: Course) {
  const [certificate] = await db.insert(traineeCertificatesIssued).values({
    id: `CC-${course.id.toUpperCase()}-${userId.slice(0, 8).toUpperCase()}`,
    userId,
    courseId: course.id,
    title: "Certificate of Capacity Building",
    status: "ISSUED",
  }).onConflictDoNothing().returning();
  if (certificate) return certificate;
  const existing = await db.select().from(traineeCertificatesIssued)
    .where(and(eq(traineeCertificatesIssued.userId, userId), eq(traineeCertificatesIssued.courseId, course.id))).limit(1);
  return existing[0] ?? null;
}

function serializeIssuedCertificate(certificate: typeof traineeCertificatesIssued.$inferSelect, course: Course) {
  return {
    id: certificate.id,
    title: certificate.title,
    course: course.title,
    issued: certificate.issuedAt.toISOString().slice(0, 10),
    status: "ISSUED" as const,
    courseId: course.id,
  };
}

function resultFromAttempt(attempt: typeof traineeAssessmentAttempts.$inferSelect, assessment: Assessment): AssessmentResult {
  const answers = JSON.parse(attempt.answers || "{}") as Record<string, number>;
  const answered = assessment.questions.filter((question) => answers[question.id] !== undefined).length;
  const correct = assessment.questions.filter((question) => Number(answers[question.id]) === question.correctOption).length;
  return {
    id: attempt.id,
    assessment: assessment.title,
    assessmentId: assessment.id,
    courseId: assessment.courseId,
    score: correct,
    percentage: attempt.percentage,
    status: attempt.passed ? "PASSED" : "NOT_PASSED",
    correct,
    incorrect: answered - correct,
    skipped: assessment.questions.length - answered,
    timeTaken: "Submitted",
    competencyBreakdown: [...new Set(assessment.questions.map((question) => question.competency))].map((name) => {
      const questions = assessment.questions.filter((question) => question.competency === name);
      const right = questions.filter((question) => Number(answers[question.id]) === question.correctOption).length;
      return { name, percentage: Math.round((right / questions.length) * 100) };
    }),
    submittedAt: attempt.submittedAt.toISOString(),
  };
}

function levelForScore(score: number) {
  return score >= 81 ? 5 : score >= 61 ? 4 : score >= 41 ? 3 : score >= 21 ? 2 : 1;
}

function recommendationForSubject(subjectId: string) {
  const required: Record<string, Record<string, number>> = {
    "numerical-weather-prediction": { meteorology: 5, nwp: 5, "data-analysis": 4, python: 3, forecasting: 4 },
    "satellite-meteorology": { meteorology: 5, forecasting: 4, "data-analysis": 4 },
    "data-analysis": { "data-analysis": 5, python: 4, meteorology: 3 },
  };
  const requirements = required[subjectId] ?? required["numerical-weather-prediction"];
  return trainers.map((trainer) => {
    const entries = Object.entries(requirements);
    const weightedMatch = entries.reduce((total, [key, requiredLevel]) => {
      const compatibility = Math.min((trainer.levels[key as keyof typeof trainer.levels] ?? 0) / requiredLevel, 1);
      return total + compatibility * (1 / entries.length);
    }, 0);
    const eligible = entries.every(([key, requiredLevel]) => (trainer.levels[key as keyof typeof trainer.levels] ?? 0) >= requiredLevel || key !== "nwp");
    const experienceScore = Math.min(trainer.experienceYears / 12, 1) * 100;
    const trainingScore = Math.min(trainer.relevantTrainings / 9, 1) * 100;
    const matchScore = Number((weightedMatch * 60 + experienceScore * 0.2 + 90 * 0.1 + trainingScore * 0.1).toFixed(1));
    return {
      id: trainer.id,
      name: trainer.name,
      title: trainer.title,
      matchScore,
      eligible,
      experienceYears: trainer.experienceYears,
      relevantTrainings: trainer.relevantTrainings,
      strongestCompetencies: trainer.strongestCompetencies,
      missingCompetencies: eligible ? [] : trainer.missingCompetencies,
      reasoning: eligible
        ? `Strong coverage across the subject requirements, backed by ${trainer.experienceYears} years of relevant experience and ${trainer.relevantTrainings} previous trainings.`
        : `Not currently eligible because the mandatory NWP threshold is not met; review the missing competency before assigning.`, 
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

const router: IRouter = Router();

router.get("/v1/me", requireAuth(), (req, res) => res.json(userForRequest(req)));

router.get("/v1/dashboard/trainee", requireApproved(), async (req, res, next) => {
  try {
    const savedEnrollments = await db
      .select()
      .from(traineeEnrollments)
      .where(eq(traineeEnrollments.userId, req.auth!.profile.id));
    const enrolledCourses = savedEnrollments.filter((item) => item.status !== "CANCELLED").length;
    const completedCourses = savedEnrollments.filter((item) => item.status === "COMPLETED").length;
    const learnerCourses = courses.map((course) => courseForLearner(course, req));
    const activeCourses = savedEnrollments.filter((item) => item.status === "ACTIVE").length;
    return res.json({
      user: userForRequest(req),
      stats: { enrolledCourses, activeCourses, completedCourses, certificates: completedCourses },
      competencies,
      gaps,
      recommendations: learnerCourses.slice(0, 3),
      activity,
      notifications,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/v1/courses", (req, res) => {
  const parsed = ListCoursesQueryParams.safeParse(req.query);
  const query = parsed.success ? parsed.data : {};
  const search = query.search?.toLowerCase();
  const filtered = courses.filter((course) => {
    const matchesSearch = !search || `${course.title} ${course.subject} ${course.trainer}`.toLowerCase().includes(search);
    const matchesDifficulty = !query.difficulty || course.difficulty === query.difficulty;
    const matchesSubject = !query.subject || course.subject === query.subject;
    return matchesSearch && matchesDifficulty && matchesSubject;
  });
  res.json(filtered);
});

router.get("/v1/homepage-content", async (_req, res, next) => {
  try {
    const [announcements, notifications, achievements, learningContent] = await Promise.all([
      db.select().from(contentAnnouncements).where(eq(contentAnnouncements.status, "PUBLISHED")).orderBy(desc(contentAnnouncements.publishedAt), desc(contentAnnouncements.createdAt)).limit(6),
      db.select().from(contentNotifications).where(eq(contentNotifications.status, "PUBLISHED")).orderBy(desc(contentNotifications.publishedAt), desc(contentNotifications.createdAt)).limit(6),
      db.select().from(contentAchievements).where(eq(contentAchievements.status, "PUBLISHED")).orderBy(desc(contentAchievements.publishedAt), desc(contentAchievements.createdAt)).limit(6),
      db.select().from(learningContents).where(eq(learningContents.status, "PUBLISHED")).orderBy(desc(learningContents.publishedAt), desc(learningContents.createdAt)).limit(6),
    ]);
    return res.json({ announcements, notifications, achievements, learningContent });
  } catch (error) {
    return next(error);
  }
});

router.post("/v1/courses", requireApproved(), requireRole("TRAINER", "ADMIN"), (req, res) => {
  const parsed = CreateCourseBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
  const course: Course = {
    id: `course-${Date.now()}`,
    ...parsed.data,
    trainer: userForRequest(req).name,
    rating: 0,
    enrolled: 0,
    progress: 0,
    thumbnailTone: "indigo",
    objectives: [],
    modules: [],
    trainerBio: "Capacity Connect trainer",
    nextSession: "To be scheduled",
    ownerId: req.auth?.profile.id,
  };
  courses.unshift(course);
  void writeAuditLog({
    actorId: req.auth!.profile.id,
    action: "COURSE_CREATED",
    entityType: "COURSE",
    entityId: course.id,
    metadata: { role: req.auth!.profile.role },
  });
  return res.status(201).json(course);
});

router.patch("/v1/courses/:courseId", requireApproved(), requireRole("TRAINER", "ADMIN"), (req, res) => {
  const course = courses.find((item) => item.id === req.params.courseId);
  if (!course) return res.status(404).json({ message: "Course not found" });
  if (!canManageCourse(course, req)) return res.status(403).json({ message: "You can only manage courses you own." });
  const parsed = CreateCourseBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
  Object.assign(course, parsed.data);
  void writeAuditLog({
    actorId: req.auth!.profile.id,
    action: "COURSE_UPDATED",
    entityType: "COURSE",
    entityId: course.id,
  });
  return res.json(course);
});

router.delete("/v1/courses/:courseId", requireApproved(), requireRole("TRAINER", "ADMIN"), (req, res) => {
  const index = courses.findIndex((item) => item.id === req.params.courseId);
  if (index === -1) return res.status(404).json({ message: "Course not found" });
  if (!canManageCourse(courses[index], req)) return res.status(403).json({ message: "You can only manage courses you own." });
  void writeAuditLog({
    actorId: req.auth!.profile.id,
    action: "COURSE_DELETED",
    entityType: "COURSE",
    entityId: courses[index].id,
  });
  courses.splice(index, 1);
  return res.status(204).send();
});

router.get("/v1/courses/:courseId", async (req, res, next) => {
  const parsed = GetCourseParams.safeParse(req.params);
  const course = courses.find((item) => item.id === (parsed.success ? parsed.data.courseId : req.params.courseId));
  if (!course) return res.status(404).json({ message: "Course not found" });
  try {
    return res.json(await persistedCourseForLearner(course, req));
  } catch (error) {
    return next(error);
  }
});

router.post("/v1/courses/:courseId/enroll", requireApproved(), async (req, res, next) => {
  const course = courses.find((item) => item.id === req.params.courseId);
  if (!course) return res.status(404).json({ message: "Course not found" });
  const enrollment = await loadEnrollmentState(req.auth!.profile.id, course);
  enrollment.enrolled = true;
  enrollment.progress = Math.max(enrollment.progress, 1);
  try {
    await saveEnrollment(req.auth!.profile.id, course.id, enrollment.progress);
    return res.status(201).json({ courseId: course.id, progress: enrollment.progress, status: "ACTIVE", certificateId: null });
  } catch (error) {
    return next(error);
  }
});

router.post("/v1/courses/:courseId/complete", requireApproved(), async (req, res, next) => {
  const course = courses.find((item) => item.id === req.params.courseId);
  if (!course) return res.status(404).json({ message: "Course not found" });
  const state = stateFor(req);
  const enrollment = await loadEnrollmentState(req.auth!.profile.id, course);
  if (!enrollment.enrolled) return res.status(409).json({ message: "Enroll in the course before completing it." });
  if (enrollment.progress < 100) return res.status(409).json({ message: "Complete every module before completing the course." });
  enrollment.progress = 100;
  try {
    await saveEnrollment(req.auth!.profile.id, course.id, 100, "COMPLETED");
    const savedAttempts = await db
      .select()
      .from(traineeAssessmentAttempts)
      .where(and(eq(traineeAssessmentAttempts.userId, req.auth!.profile.id), eq(traineeAssessmentAttempts.courseId, course.id)));
    const passedAssessment =
      savedAttempts.some((attempt) => attempt.passed) ||
      state.results.some((result) => result.courseId === course.id && result.status === "PASSED");
    const certificate = passedAssessment ? await saveIssuedCertificate(req.auth!.profile.id, course) : null;
    if (certificate && !state.certificates.some((item) => item.id === certificate.id)) {
      state.certificates.push(serializeIssuedCertificate(certificate, course));
    }
    return res.json({ courseId: course.id, progress: 100, status: "COMPLETED", certificateId: certificate?.id ?? null, assessmentRequired: !passedAssessment });
  } catch (error) {
    return next(error);
  }
});

router.get("/v1/learning", requireApproved(), async (_req, res, next) => {
  try {
    const persisted = await db.select().from(traineeEnrollments).where(eq(traineeEnrollments.userId, _req.auth!.profile.id));
    const persistedProgress = await db.select().from(traineeModuleProgress).where(eq(traineeModuleProgress.userId, _req.auth!.profile.id));
    const persistedByCourse = new Map(persisted.map((item) => [item.courseId, item]));
    const completedByCourse = new Map<string, Set<string>>();
    for (const item of persistedProgress) {
      if (!item.completed) continue;
      const modules = completedByCourse.get(item.courseId) ?? new Set<string>();
      modules.add(item.moduleId);
      completedByCourse.set(item.courseId, modules);
    }
    const learnerCourses = courses.map((course) => {
      const memoryCourse = courseForLearner(course, _req);
      const saved = persistedByCourse.get(course.id);
      const completed = completedByCourse.get(course.id);
      const modules = course.modules.map((module) => ({
        ...module,
        completed: completed ? completed.has(module.id) : memoryCourse.modules.find((item) => item.id === module.id)?.completed ?? false,
      }));
      return { ...memoryCourse, progress: saved?.progress ?? memoryCourse.progress, modules };
    });
    return res.json(learnerCourses.filter((course) => course.progress > 0).map((course) => ({
      id: `learning-${course.id}`,
      courseId: course.id,
      title: course.title,
      subject: course.subject,
      progress: course.progress,
      status: course.progress === 100 ? "COMPLETED" : "ACTIVE",
      nextModule: course.modules.find((module) => !module.completed)?.title ?? "Assessment",
      modules: course.modules,
    })));
  } catch (error) {
    return next(error);
  }
});

router.post("/v1/modules/:moduleId/complete", requireApproved(), async (req, res, next) => {
  for (const course of courses) {
    const module = course.modules.find((item) => item.id === req.params.moduleId);
    if (!module) continue;
    const enrollment = await loadEnrollmentState(req.auth!.profile.id, course);
    if (!enrollment.enrolled) return res.status(409).json({ message: "Enroll in the course before completing a module." });
    enrollment.completedModuleIds.add(module.id);
    enrollment.progress = Math.round((enrollment.completedModuleIds.size / course.modules.length) * 100);
    try {
      await saveEnrollment(req.auth!.profile.id, course.id, enrollment.progress);
      await db.insert(traineeModuleProgress).values({
        userId: req.auth!.profile.id,
        courseId: course.id,
        moduleId: module.id,
        completed: true,
        completedAt: new Date(),
      }).onConflictDoUpdate({
        target: [traineeModuleProgress.userId, traineeModuleProgress.moduleId],
        set: { completed: true, completedAt: new Date(), updatedAt: new Date() },
      });
      return res.json({ courseId: course.id, moduleId: module.id, progress: enrollment.progress, completed: true });
    } catch (error) {
      return next(error);
    }
  }
  return res.status(404).json({ message: "Module not found" });
});

router.get("/v1/assessments", requireApproved(), async (_req, res, next) => {
  try {
    const [savedAttempts] = await Promise.all([
      db.select().from(traineeAssessmentAttempts).where(eq(traineeAssessmentAttempts.userId, _req.auth!.profile.id)),
    ]);
    const attempted = new Set(savedAttempts.map((attempt) => attempt.assessmentId));
    const results = stateFor(_req).results;
    return res.json(assessments.map(({ questions, ...assessment }) => ({
      ...assessment,
      questions: questions.length,
      status: attempted.has(assessment.id) || results.some((result) => result.assessmentId === assessment.id) ? "COMPLETED" : assessment.status,
    })));
  } catch (error) {
    return next(error);
  }
});

router.get("/v1/assessments/:assessmentId", requireApproved(), (req, res) => {
  const assessment = assessments.find((item) => item.id === req.params.assessmentId);
  if (!assessment) return res.status(404).json({ message: "Assessment not found" });
  const { questions, ...summary } = assessment;
  return res.json({ ...summary, questions });
});

router.post("/v1/assessments/:assessmentId/submit", requireApproved(), async (req, res, next) => {
  const assessment = assessments.find((item) => item.id === req.params.assessmentId);
  if (!assessment) return res.status(404).json({ message: "Assessment not found" });
  const course = courses.find((item) => item.id === assessment.courseId);
  if (!course) return res.status(404).json({ message: "Assessment course not found" });
  const enrollment = await loadEnrollmentState(req.auth!.profile.id, course);
  if (!enrollment.enrolled) return res.status(409).json({ message: "Enroll in the course before attempting this assessment." });
  const answers = req.body?.answers;
  if (!answers || typeof answers !== "object") return res.status(400).json({ message: "Answers are required." });
  const previousAttempts = await db
    .select()
    .from(traineeAssessmentAttempts)
    .where(and(eq(traineeAssessmentAttempts.userId, req.auth!.profile.id), eq(traineeAssessmentAttempts.assessmentId, assessment.id)));
  if (previousAttempts.length >= assessment.attemptLimit) {
    return res.status(409).json({ message: "The attempt limit for this assessment has been reached." });
  }
  const submittedAt = new Date();
  const deadline = new Date("2026-09-30T23:59:59+05:30");
  if (submittedAt > deadline) return res.status(422).json({ message: "This assessment deadline has passed." });
  const correct = assessment.questions.filter((question) => answers[question.id] !== undefined && Number(answers[question.id]) === question.correctOption).length;
  const answered = assessment.questions.filter((question) => answers[question.id] !== undefined).length;
  const percentage = Math.round((correct / assessment.questions.length) * 100);
  const result: AssessmentResult = {
    id: `result-${Date.now()}`,
    assessment: assessment.title,
    assessmentId: assessment.id,
    courseId: assessment.courseId,
    score: correct,
    percentage,
    status: percentage >= assessment.passingScore ? "PASSED" : "NOT_PASSED",
    correct,
    incorrect: answered - correct,
    skipped: assessment.questions.length - answered,
    timeTaken: `${Math.max(1, Number(req.body?.timeTakenSeconds ?? 0) / 60).toFixed(1)} min`,
    competencyBreakdown: [...new Set(assessment.questions.map((question) => question.competency))].map((name) => {
      const questions = assessment.questions.filter((question) => question.competency === name);
      const right = questions.filter((question) => Number(answers[question.id]) === question.correctOption).length;
      return { name, percentage: Math.round((right / questions.length) * 100) };
    }),
    submittedAt: submittedAt.toISOString(),
  };
  const state = stateFor(req);
  state.results.unshift(result);
  try {
    await db.insert(traineeAssessmentAttempts).values({
      id: result.id,
      userId: req.auth!.profile.id,
      assessmentId: assessment.id,
      courseId: assessment.courseId,
      score: result.score,
      percentage: result.percentage,
      passed: result.status === "PASSED",
      answers: JSON.stringify(answers),
      submittedAt,
    });
    const savedEnrollment = await db.select().from(traineeEnrollments)
      .where(and(eq(traineeEnrollments.userId, req.auth!.profile.id), eq(traineeEnrollments.courseId, assessment.courseId))).limit(1);
    if (result.status === "PASSED" && course && (savedEnrollment[0]?.progress ?? enrollmentFor(state, course).progress) === 100) {
      const certificate = await saveIssuedCertificate(req.auth!.profile.id, course);
      if (certificate && !state.certificates.some((item) => item.id === certificate.id)) {
        state.certificates.push(serializeIssuedCertificate(certificate, course));
      }
    }
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
});

router.get("/v1/results", requireApproved(), async (req, res, next) => {
  try {
    const saved = await db.select().from(traineeAssessmentAttempts)
      .where(eq(traineeAssessmentAttempts.userId, req.auth!.profile.id))
      .orderBy(desc(traineeAssessmentAttempts.submittedAt));
    const persisted = saved.flatMap((attempt) => {
      const assessment = assessments.find((item) => item.id === attempt.assessmentId);
      return assessment ? [resultFromAttempt(attempt, assessment)] : [];
    });
    const memory = stateFor(req).results.filter((result) => !persisted.some((item) => item.id === result.id));
    return res.json([...persisted, ...memory]);
  } catch (error) {
    return next(error);
  }
});

router.get("/v1/certificates", requireApproved(), async (req, res, next) => {
  try {
    const saved = await db.select().from(traineeCertificatesIssued)
      .where(eq(traineeCertificatesIssued.userId, req.auth!.profile.id))
      .orderBy(desc(traineeCertificatesIssued.issuedAt));
    const persisted = saved.flatMap((certificate) => {
      const course = courses.find((item) => item.id === certificate.courseId);
      return course ? [serializeIssuedCertificate(certificate, course)] : [];
    });
    const memory = stateFor(req).certificates.filter((certificate) => !persisted.some((item) => item.id === certificate.id));
    return res.json([...persisted, ...memory]);
  } catch (error) {
    return next(error);
  }
});

router.post("/v1/courses/:courseId/feedback", requireApproved(), async (req, res, next) => {
  const course = courses.find((item) => item.id === req.params.courseId);
  if (!course) return res.status(404).json({ message: "Course not found" });
  const enrollment = await db
    .select()
    .from(traineeEnrollments)
    .where(and(eq(traineeEnrollments.userId, req.auth!.profile.id), eq(traineeEnrollments.courseId, course.id)))
    .limit(1);
  if (!enrollment.length) return res.status(403).json({ message: "Enroll in the course before submitting feedback." });
  const state = stateFor(req);
  const contentType = typeof req.body?.contentType === "string" ? req.body.contentType.toUpperCase() : "COURSE";
  if (state.feedbackCourseIds.has(`${course.id}:${contentType}`)) return res.status(409).json({ message: "Feedback has already been submitted for this course and content type." });
  const rating = Number(req.body?.rating);
  const contentQuality = Number(req.body?.contentQuality);
  const trainerQuality = Number(req.body?.trainerQuality);
  const usefulness = Number(req.body?.usefulness);
  if ([rating, contentQuality, trainerQuality, usefulness].some((value) => !Number.isInteger(value) || value < 1 || value > 5) || typeof req.body?.comments !== "string" || !req.body.comments.trim()) {
    return res.status(400).json({ message: "Ratings from 1 to 5 and a comment are required." });
  }
  const entry: Feedback = { id: `feedback-${Date.now()}`, courseId: course.id, rating, contentQuality, trainerQuality, usefulness, comments: req.body.comments.trim(), submittedAt: new Date().toISOString(), contentType };
  try {
    await db.insert(traineeFeedback).values({
      id: entry.id,
      userId: req.auth!.profile.id,
      courseId: course.id,
      contentType,
      rating,
      contentQuality,
      trainerQuality,
      usefulness,
      comments: entry.comments,
    });
    state.feedbackCourseIds.add(`${course.id}:${contentType}`);
    return res.status(201).json(entry);
  } catch (error) {
    if (String(error).toLowerCase().includes("duplicate") || String(error).toLowerCase().includes("unique")) {
      return res.status(409).json({ message: "Feedback has already been submitted for this course and content type." });
    }
    return next(error);
  }
});

router.get("/v1/competencies", requireApproved(), (_req, res) => res.json(competencies));
router.get("/v1/competencies/gaps", requireApproved(), (_req, res) => res.json(gaps));

router.get("/v1/subjects/:subjectId/recommended-trainers", requireApproved(), (req, res) => {
  const parsed = ListRecommendedTrainersParams.safeParse(req.params);
  return res.json(recommendationForSubject(parsed.success ? parsed.data.subjectId : String(req.params.subjectId)));
});

router.get("/v1/notifications", requireApproved(), (_req, res) => res.json(notifications));
router.post("/v1/notifications/:notificationId/read", requireApproved(), (req, res) => {
  const parsed = MarkNotificationReadParams.safeParse(req.params);
  const notification = notifications.find((item) => item.id === (parsed.success ? parsed.data.notificationId : req.params.notificationId));
  if (!notification) return res.status(404).json({ message: "Notification not found" });
  notification.read = true;
  return res.json(notification);
});

export default router;