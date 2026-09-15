# Capacity Connect — Feature & Implementation Status Tracker

> **Project:** CAPACITY CONNECT  
> **SIH Problem Statement:** 26075  
> **Purpose:** Track the implementation status of every major requirement in the Capacity Connect application.
>
> **Status values**
> - `⬜ PENDING` — Not implemented or not working.
> - `🟨 PARTIALLY COMPLETE` — Some of the requirement works, but important functionality is missing, broken, mocked, or incomplete.
> - `✅ COMPLETE` — Implemented end-to-end, persisted where required, correctly authorized, tested, and working in the actual application.
> - `⚪ BLOCKED` — Cannot currently be completed because of an external dependency/configuration issue. Use only when genuinely blocked.
>
> **Important:** Status must be based on actual code, database, APIs, authentication, storage, and working UI—not on page existence or visual appearance alone.

---

## 0. Overall Project Status

| Area | Status | Evidence / Notes |
|---|---|---|
| Overall application | `🟨 PARTIALLY COMPLETE` | Auth/profile approval and a trainee learning slice exist, but most domain state is static or in-memory and major role workflows are absent. |
| Frontend | `🟨 PARTIALLY COMPLETE` | React/Vite pages exist for public, trainee, auth, profile, and admin-user views; trainer/admin product areas are missing and several views use static API data. |
| Express backend | `🟨 PARTIALLY COMPLETE` | Typed Express REST routes and middleware exist, but most capacity routes serve constants and learner state is held in process memory. |
| PostgreSQL + Drizzle | `🟨 PARTIALLY COMPLETE` | Drizzle/PostgreSQL connection and competency/profile/audit tables exist; courses, enrollments, assessments, certificates, feedback, and notifications are not persisted. |
| Supabase Auth | `🟨 PARTIALLY COMPLETE` | Supabase signup/login/session/logout and server `auth.getUser` verification exist; password reset and documented first-run admin provisioning are absent. |
| Supabase Storage | `🟨 PARTIALLY COMPLETE` | Signed avatar upload exists with client-side size/type checks; required buckets, protected resource flows, server-side validation, and retry/progress handling are absent. |
| RBAC | `🟨 PARTIALLY COMPLETE` | Server role/approval middleware protects implemented routes, but only a small subset of required role workflows and trainer/admin areas exists. |
| Competency engine | `🟨 PARTIALLY COMPLETE` | Weighted scoring, levels, experience/training scoring, and a DB repository exist, but active routes return hard-coded competency/gap data and recalculation is not wired to evidence changes. |
| Trainer matching | `🟨 PARTIALLY COMPLETE` | A matching formula and repository implementation exist, but the live route uses static trainer data and does not return the repository breakdown. |
| Assessments | `🟨 PARTIALLY COMPLETE` | Trainee assessment UI and answer scoring exist; assessments/questions are hard-coded, results are in-memory, and trainer assessment authoring/evidence updates are absent. |
| Certificates | `🟨 PARTIALLY COMPLETE` | A certificate object is created in memory after course/assessment actions and can be viewed/printed; it is not a persisted certificate record or downloadable generated document, and completion validation is inconsistent. |
| Notifications | `🟨 PARTIALLY COMPLETE` | List/read UI and routes exist, but notifications are a shared mutable constant with no per-user database persistence or complete event coverage. |
| Analytics | `⬜ PENDING` | No trainer/admin analytics pages or database-driven chart endpoints are implemented. |
| Security | `🟨 PARTIALLY COMPLETE` | Supabase verification, server RBAC, parameterized Drizzle queries, redacted Pino request logging, and signed avatar URLs exist; CORS is open and Helmet/rate limiting/full upload validation are absent. |
| Testing | `⬜ PENDING` | No project test files, Vitest, Playwright configuration, or executable test scripts are present. |
| Documentation | `🟨 PARTIALLY COMPLETE` | README, OpenAPI source, and generated client schemas exist, but the documented API is broader than the implemented routes and no API.md is present. |

### Audit evidence map

The detailed checklist below is requirement-level scope. The following status is the audited status for each numbered feature area, based on the source files currently present. A page, type, schema, or generated client alone was not treated as end-to-end completion.

| Area | Status | Evidence / Notes |
|---|---|---|
| 1. Architecture & Technology | `🟨 PARTIALLY COMPLETE` | Vite/React/TypeScript, Tailwind, shadcn component files, Lucide, TanStack Query, Express, Drizzle, OpenAPI generation, and migrations are present; Next.js/App Router, Framer Motion usage, React Hook Form usage in product forms, and verified workflow are not. |
| 2. Authentication | `🟨 PARTIALLY COMPLETE` | Supabase signup/login/session/logout, email verification messaging, server JWT verification, protected routes, and token-protected first-admin provisioning exist; password reset and documented first-run setup remain absent. |
| 3. RBAC & User Status | `🟨 PARTIALLY COMPLETE` | Roles/statuses, server-side RBAC, approval/rejection with reasons, suspension/reactivation, role changes, and audit writes exist; runtime test coverage and broader role workflows remain incomplete. |
| 4. Database & Data Model | `🟨 PARTIALLY COMPLETE` | Drizzle schemas, migrations, foreign keys, timestamps, indexes, unique constraints, and a seed command exist for the implemented domain; many requested profile, evidence, resource, answer, notification, and feedback tables remain absent. |
| 5. Trainee Professional Profile | `🟨 PARTIALLY COMPLETE` | Authenticated profile edit/save and signed avatar upload persist the implemented fields; phone, location, structured qualification/experience/skills/certificates, and file management workflows remain absent. |
| 6. Trainer Professional Profile | `🟨 PARTIALLY COMPLETE` | The shared protected profile page supports trainer identity, image, designation, department, biography, qualifications, interests, and experience editing; structured expertise, subjects, certifications, and training history remain absent. |
| 7. Competency Framework | `🟨 PARTIALLY COMPLETE` | Competency, five levels, subject mappings, trainee/trainer competency schemas, and admin configuration APIs/UI exist; evidence entities/workflows and runtime verification remain absent. |
| 8. Competency Scoring Engine | `🟨 PARTIALLY COMPLETE` | `calculateCompetencyScore`, requested weights, clamping, and level conversion exist in `server/src/lib/competency-engine.ts`; no live evidence mutation/recalculation endpoint or persisted level update is connected to the UI. |
| 9. Experience & Certification Scoring | `🟨 PARTIALLY COMPLETE` | Experience thresholds are implemented and used by the matching library; certification scoring thresholds, verification-aware scoring, and subject-relevance integration are missing. |
| 10. Competency Assessments | `🟨 PARTIALLY COMPLETE` | Static assessments associate questions with competency names and produce normalized results; no trainer competency assessment workflow, 50-question support, DB evidence persistence, or score update exists. |
| 11. Training History & Verification | `🟨 PARTIALLY COMPLETE` | Training-count scoring and score columns exist; training history records, admin verification states, persisted verification changes, and verification audit workflow are absent. |
| 12. Competency Gap Analysis | `🟨 PARTIALLY COMPLETE` | Trainee UI and a DB-backed repository gap algorithm exist; the active route serves static gaps and there is no evidence-driven update path. |
| 13. Subject Competency Requirements | `🟨 PARTIALLY COMPLETE` | Subject/competency mapping schema, seeded mappings, admin configuration UI/API, and persistence exist; weight-total validation and live learner integration remain incomplete. |
| 14. Trainer Matching Engine | `🟨 PARTIALLY COMPLETE` | Repository matching implements capped weighted competency, mandatory eligibility, 60/20/10/10 scoring, ranking, and reasoning; live capacity route uses static arrays and omits full breakdown data. |
| 15. Explainable Trainer Recommendation | `🟨 PARTIALLY COMPLETE` | Trainee recommendation page shows static match score, eligibility, experience, strengths, and reasoning; profile/breakdown/missing-competency detail and live database-backed recommendations are incomplete. |
| 16. Competency Dashboards | `🟨 PARTIALLY COMPLETE` | Trainee competency and gap page exists with score/level/progress views; trainer dashboard, evidence drill-down, targets, and database-backed evidence detail are absent. |
| 17. Public Homepage | `🟨 PARTIALLY COMPLETE` | Hero, overview, learning/matching messaging, and dynamic published announcements, notifications, achievements, and learning content exist; featured trainers and real platform statistics remain absent. |
| 18. Public Course Catalog | `🟨 PARTIALLY COMPLETE` | `/courses` has API-backed current catalog search and subject/difficulty filters; sorting, category/trainer/duration filters, pagination, debounce, and large-dataset server persistence are absent. |
| 19. Course Details | `🟨 PARTIALLY COMPLETE` | `/courses/:id` renders details, objectives, modules, trainer information, enrollment, and progress actions; resources, assessment/completion detail, and durable enrollment are missing. |
| 20. Trainee Dashboard | `🟨 PARTIALLY COMPLETE` | `/trainee/dashboard` renders metrics, courses, competencies, gaps, activity, and notifications; its API response includes hard-coded recommendations/activity/competencies/gaps and lacks several requested dashboard data paths. |
| 21. Trainee My Courses | `🟨 PARTIALLY COMPLETE` | `/trainee/my-learning` lists in-progress courses with progress and continue links; the specified `/trainee/my-courses` route, search, filters, certificate/progress actions, and durable enrollment are absent. |
| 22. Course Learning Experience | `🟨 PARTIALLY COMPLETE` | Module navigation and completion requests exist; content is a hard-coded reading placeholder, no video/PDF/PPT resources exist, completion is in-memory, and completion requirements are not fully enforced. |
| 23. Trainer Library | `🟨 PARTIALLY COMPLETE` | Trainer library CRUD, publication state, uploads, protected signed downloads, and trainee access exist; subject/course metadata, edit form, and dedicated resource buckets remain absent. |
| 24. File Storage | `🟨 PARTIALLY COMPLETE` | Supabase signed upload/download is implemented for avatars and trainer library files with filename and permission checks; dedicated buckets, MIME/size validation, progress, cancel, and retry remain absent. |
| 25. Trainer Course Management | `🟨 PARTIALLY COMPLETE` | Backend in-memory create/update/delete routes with owner/admin checks exist; no `/trainer/courses` UI, publish lifecycle, modules/resources, archive, duplicate, or durable ownership data exists. |
| 26. Course Creation | `🟨 PARTIALLY COMPLETE` | A small course suggestion form and Zod-backed create route cover title/subject/level/duration/description; objectives, audience, prerequisites, thumbnail, modules/resources, full validation, and persistence are absent. |
| 27. Course Approval / Publishing Workflow | `⬜ PENDING` | No course status model or admin review/approve/reject/publish/unpublish/archive workflow is implemented. |
| 28. Trainer Assessment Builder | `🟨 PARTIALLY COMPLETE` | Trainer questionnaire creation, publication, deadlines, and participation access exist; edit, results, duplicate, archive, and full assessment configuration remain absent. |
| 29. Question Builder | `🟨 PARTIALLY COMPLETE` | Trainer questionnaire creation persists MCQ questions and four options; edit/delete, explanations, difficulty, and competency tagging remain absent. |
| 30. Trainee Assessment Experience | `🟨 PARTIALLY COMPLETE` | Question navigation, answers, submit, client pending state, and server deadline check exist; no countdown, confirmation, full navigation panel, server attempt limit, draft answer persistence, or durable assessment data exists. |
| 31. Assessment Results | `🟨 PARTIALLY COMPLETE` | Actual submitted answers produce score, percentage, correct/incorrect/skipped, time, and competency breakdown; results are in-memory and do not update competency evidence. |
| 32. Feedback | `🟨 PARTIALLY COMPLETE` | Course feedback form validates five-point ratings/comments and blocks duplicate course feedback within process memory; trainer/content feedback, database persistence, and authorized viewing are absent. |
| 33. Certificates | `🟨 PARTIALLY COMPLETE` | Certificate records are created in memory and listed/view-printed; trainee name, durable record, generated professional document/download, and strict course-plus-assessment gating are incomplete. |
| 34. Trainer Dashboard | `⬜ PENDING` | No trainer dashboard page or implemented metrics endpoint exists. |
| 35. Trainer Participation Monitoring | `⬜ PENDING` | No participation route/page, filters, pagination, or CSV export exists. |
| 36. Trainer Performance Dashboard | `⬜ PENDING` | No performance dashboard or real analytics charts/queries exist. |
| 37. Admin Dashboard | `🟨 PARTIALLY COMPLETE` | `/admin/dashboard` and its endpoint provide database-backed user, course, enrollment, certificate, assessment, participation, and trend metrics; several requested breakdowns and runtime tests remain absent. |
| 38. Admin User Management | `🟨 PARTIALLY COMPLETE` | `/admin/users` provides tabs, search, pagination, role changes, approve/reject/suspend/reactivate, detail/document review, server authorization, and audit writes; runtime tests and broader account workflows remain incomplete. |
| 39. Admin Pending Approval | `🟨 PARTIALLY COMPLETE` | `/admin/users/pending` provides a dedicated queue, profile/document review, approve/reject actions, rejection reasons, persisted status changes, and server authorization; runtime tests remain absent. |
| 40. Admin Course Management | `🟨 PARTIALLY COMPLETE` | Admin course listing and persisted status transitions, including publish/archive/reject, exist in the admin UI/API; full CRUD, review detail, and runtime tests remain incomplete. |
| 41. Admin Assessment Monitoring | `🟨 PARTIALLY COMPLETE` | Admin assessment listing is database-backed and available in the monitoring UI; requested analytics and drill-down metrics are absent. |
| 42. Admin Certification Monitoring | `🟨 PARTIALLY COMPLETE` | Admin certificate listing is database-backed and available in the monitoring UI; search, breakdowns, and metrics are absent. |
| 43. Admin Enrollment Monitoring | `🟨 PARTIALLY COMPLETE` | Admin enrollment listing is database-backed and available in the monitoring UI; filters, drill-down, and broader analytics are absent. |
| 44. Admin Content Management / CMS | `🟨 PARTIALLY COMPLETE` | Admin APIs/UI provide database-backed create, edit, publish/archive, and delete flows for announcements, notifications, achievements, and learning content; public homepage integration and runtime tests remain absent. |
| 45. Notifications | `🟨 PARTIALLY COMPLETE` | Notification list, unread count, bell/navigation, mark-read UI/API exist; values are static/shared, read state is not user-scoped or persisted, and event types are incomplete. |
| 46. Global / Contextual Search | `🟨 PARTIALLY COMPLETE` | Course search filters title/subject/trainer in the course route; trainer/subject/library search, debounce, visibility-aware server search, and global search are absent. |
| 47. API Layer | `🟨 PARTIALLY COMPLETE` | `/api/v1` includes dashboard, courses, enrollment/progress, assessments, results, feedback, competencies, recommendations, and notifications; most required users/admin/module/resource/CMS/analytics endpoints are absent and live data is often static. |
| 48. API Response Standards | `🟨 PARTIALLY COMPLETE` | Routes return JSON errors with some appropriate HTTP statuses and structured Zod errors; response envelopes, pagination, consistent validation/error shape, and full status coverage are not standardized. |
| 49. Security | `🟨 PARTIALLY COMPLETE` | Supabase user verification, role middleware, Drizzle parameterization, signed avatar URL, browser-safe anon key, and redacted request logs exist; CORS is unrestricted, Helmet/rate limiting are absent, and upload validation is client-only. |
| 50. Audit Logging | `🟨 PARTIALLY COMPLETE` | Audit table and writes for profiles, user approval/role changes, and course create/update/delete exist; most required event types, foreign keys, admin UI protections, and immutable-log controls are absent. |
| 51. Environment &   | `🟨 PARTIALLY COMPLETE` | `.env.example` includes DB/Supabase variables and service key is server-only in code; duplicate/missing naming coverage, secret configuration verification, and   workflow setup are not audited or present. |
| 52. Homepage / Content Data Flow | `⬜ PENDING` | Homepage content and statistics are hard-coded; only the health indicator is fetched dynamically and no CMS data flow exists. |
| 53. Responsive Design | `🟨 PARTIALLY COMPLETE` | CSS includes desktop/tablet/mobile breakpoints, collapsing navigation, responsive grids, and mobile learning layouts; there is no verification evidence for all required tables/forms/overflow/touch cases. |
| 54. Design System & UI Quality | `🟨 PARTIALLY COMPLETE` | Consistent custom tokens, typography, spacing patterns, colors, borders, focus styling, and shadcn primitives exist; the product mostly uses custom CSS/raw controls and accessibility/consistency are not fully demonstrated. |
| 55. Animations | `🟨 PARTIALLY COMPLETE` | CSS entrance, hover, progress, modal, and skeleton animations exist and are generally subtle; Framer Motion and richer state transitions are not used. |
| 56. Loading States | `🟨 PARTIALLY COMPLETE` | Query skeleton/error states and disabled pending buttons exist for several flows; upload/publish/approve/delete/generate-specific states and full page coverage are absent. |
| 57. Error Handling | `🟨 PARTIALLY COMPLETE` | Query error states, retry UI, client messages, and JSON API errors exist; status-specific 401/403/404/409/422/429/500 handling and a centralized safe backend error handler are incomplete. |
| 58. Confirmation Dialogs | `⬜ PENDING` | No confirmation dialogs are wired for destructive or privileged actions; the modal present is course creation, not confirmation. |
| 59. Forms & Validation | `🟨 PARTIALLY COMPLETE` | Native/client checks and Zod for course/query schemas exist; React Hook Form is only in a generic UI primitive, client Zod schemas and comprehensive backend validation are absent. |
| 60. Table UX | `⬜ PENDING` | No feature table with sorting/filtering/pagination/row actions/status coverage is implemented. |
| 61. Topbar & Navigation | `🟨 PARTIALLY COMPLETE` | Responsive top navigation, role-aware admin link, avatar/profile, role text, sign-out, and mobile menu exist; required role-specific navigation sections, breadcrumbs, notification behavior, and trainer/admin destinations are absent. |
| 62. Dashboard Components | `🟨 PARTIALLY COMPLETE` | KPI cards, progress bars, activity feed, recommendations, and competency panels exist; trend/line/bar/doughnut analytics and trainer/admin dashboard components do not. |
| 63. Accessibility | `🟨 PARTIALLY COMPLETE` | Labels, some ARIA roles/labels, semantic links/buttons, focus styles, and responsive touch sizing exist; dialogs/focus management, screen-reader coverage, contrast verification, and non-color status coverage are incomplete. |
| 64. Empty / Not Found / Error Pages | `🟨 PARTIALLY COMPLETE` | Reusable empty/error states, custom not-found route, and error boundary exist; unauthorized/forbidden/network-specific pages and complete list coverage are absent. |
| 65. Performance | `🟨 PARTIALLY COMPLETE` | TanStack Query, basic invalidation, and indexes for implemented tables exist; pagination/debounce/lazy loading/efficient persisted joins are incomplete, and several APIs use process constants. |
| 66. Database Indexes | `🟨 PARTIALLY COMPLETE` | Implemented tables declare secondary indexes for user status/role, course status/owner/subject, assessments, enrollments, certificates, content, documents, and competency relationships; several requested future entities do not exist. |
| 67. Testing | `⬜ PENDING` | No tests/configuration/scripts are present for unit, API, E2E, or competency cases. |
| 68. Logging | `🟨 PARTIALLY COMPLETE` | Pino and pino-http provide request method/path/status/id logging with authorization/cookie redaction; duration/user ID/sensitive-data guarantees are not explicitly implemented. |
| 69. Rate Limiting | `⬜ PENDING` | No rate-limiting middleware or endpoint-specific limits exist. |
| 70. API Documentation | `🟨 PARTIALLY COMPLETE` | `shared/api-spec/openapi.yaml` and generated client files exist; the spec includes routes not implemented in Express and no API.md or complete auth/role/error documentation exists. |
| 71. Project Structure & Code Quality | `🟨 PARTIALLY COMPLETE` | Client/server/db/shared separation and strict TypeScript settings exist; requested app/lib/server module structure, migrations, tests, lint config, and removal of duplicated/static business data are incomplete. |
| 72. Development Commands | `🟨 PARTIALLY COMPLETE` | npm scripts exist for dev/build/start/typecheck/codegen and DB generate/migrate/push/seed/studio commands; lint/test scripts and full runtime execution evidence remain absent. |
| 73. Realistic Seed Data | `🟨 PARTIALLY COMPLETE` | `npm run db:seed` exists and seeds competency levels, meteorology subjects, mappings, trainers, courses, and assessments; demo users, modules, questions, enrollments, evidence, notifications, and certificates are not seeded. |
| 74. Final End-to-End Demo Flow | `⬜ PENDING` | The central admin → trainer → trainee → competency loop cannot run end-to-end because trainer/admin workflows, durable domain data, and matching/evidence integration are missing. |
| 75. Final Acceptance Criteria | `⬜ PENDING` | Multiple acceptance groups remain absent or only partially implemented; the application cannot be considered fully complete under the stated definition. |
| 76. Status Update Rules | `✅ COMPLETE` | The tracker defines the audit rules and completion definition; this is documentation, not a claim about application functionality. |
| 77. Audit Summary | `✅ COMPLETE` | This audit records the current status, evidence, blockers, priorities, and audit metadata below. |
| 78. Completion Definition | `✅ COMPLETE` | The end-to-end completion standard and central product loop are explicitly documented. |

---

# 1. Architecture & Technology

- [ ] Next.js frontend exists and runs
- [x] TypeScript is used throughout frontend
- [ ] Next.js App Router is used
- [x] Tailwind CSS is configured and working
- [x] shadcn/ui is used as the base component system
- [x] Lucide React icons are used consistently
- [ ] Framer Motion is configured for subtle UX animation
- [x] TanStack Query is used for server state
- [ ] React Hook Form is used for important forms
- [x] Zod is used for validation
- [ ] Recharts is used for real analytics/charts
- [x] Express backend exists separately
- [x] Express backend is TypeScript
- [x] REST API architecture is implemented
- [ ] Backend has modular routes/controllers/services/repositories/schemas/types
- [x] PostgreSQL is the application database
- [x] Drizzle ORM is used
- [x] Drizzle migrations exist
- [x] NPM is the package manager
- [x] No pnpm/yarn/bun dependency remains in the project workflow
- [ ] Project runs cleanly on  
- [ ] Frontend and backend can be started through the documented development workflow

---

# 2. Authentication

- [x] Supabase Auth is the identity provider
- [x] Email/password signup works
- [x] Login works
- [x] Logout works
- [ ] Password reset works
- [x] Email verification flow works where configured
- [x] Supabase session/JWT is used for authenticated identity
- [x] Express verifies Supabase JWTs on protected routes
- [x] Application `users` table maps Supabase auth user ID
- [x] Public signup cannot create an ADMIN
- [x] TRAINEE signup works
- [x] TRAINER signup works
- [x] Admin provisioning is secure/server-side
- [ ] First-run admin setup is documented and protected
- [x] Protected routes work
- [x] Unauthorized users cannot access protected application areas
- [x] No custom password hashing/session/password table has been introduced

---

# 3. RBAC & User Status

- [x] Roles exist: TRAINEE, TRAINER, ADMIN
- [x] RBAC is enforced in frontend
- [x] RBAC is enforced in backend
- [x] Trainee cannot access admin functionality
- [x] Trainer cannot access admin functionality
- [ ] Trainee cannot create courses
- [x] Trainee cannot approve users
- [x] Trainer cannot change user roles
- [x] Trainer cannot publish admin announcements
- [x] Admin can perform permitted administrative operations
- [x] User statuses exist: PENDING, APPROVED, REJECTED, SUSPENDED
- [x] Signup → PENDING workflow works
- [x] Admin approval workflow works
- [x] Rejection workflow works
- [x] Rejection reason can be stored where applicable
- [x] Suspension workflow works
- [x] Reactivation workflow works

---

# 4. Database & Data Model

- [ ] Normalized PostgreSQL schema exists
- [ ] `users`
- [ ] `trainee_profiles`
- [ ] `trainer_profiles`
- [ ] `qualifications`
- [ ] `work_experience`
- [ ] `skills`
- [ ] `interests`
- [ ] `user_skills`
- [ ] `user_interests`
- [ ] `certificates`
- [ ] `certificate_records`
- [x] `subjects`
- [x] `competencies`
- [x] `competency_levels`
- [x] `subject_competencies`
- [x] `trainer_competencies`
- [x] `trainee_competencies`
- [ ] `competency_evidence`
- [x] `courses`
- [x] `course_modules`
- [ ] `course_resources`
- [x] `enrollments`
- [ ] `course_progress`
- [x] `assessments`
- [x] `assessment_questions`
- [ ] `question_options`
- [x] `assessment_attempts`
- [ ] `assessment_answers`
- [ ] `feedback`
- [x] `trainer_library_items`
- [ ] `notifications`
- [x] `announcements`
- [x] `achievements`
- [x] `learning_contents`
- [ ] `trainer_training_history`
- [x] `audit_logs`
- [x] Primary keys are correctly configured
- [x] Foreign keys are correctly configured
- [x] Unique constraints are implemented
- [x] Appropriate indexes exist
- [ ] Check constraints exist where appropriate
- [x] created_at / updated_at timestamps are consistent
- [ ] Soft-delete fields exist where appropriate
- [x] Database migrations work
- [x] Seed command works
- [ ] Seed data is realistic and IMD/MoES-focused

---

# 5. Trainee Professional Profile

- [x] Profile page exists
- [x] Full name
- [x] Profile picture
- [x] Email
- [ ] Phone
- [ ] Location
- [x] Department/organization
- [x] Qualifications
- [ ] Degree
- [ ] Institution
- [ ] Field/specialization
- [ ] Start year
- [ ] Completion year
- [ ] Grade/score
- [ ] Work experience
- [ ] Organization
- [ ] Designation
- [ ] Start date
- [ ] End date
- [ ] Description
- [x] Subject interests
- [x] Professional interests
- [ ] Skills
- [ ] Skill level
- [ ] Certificates
- [ ] Certificate name
- [ ] Issuing authority
- [ ] Issue date
- [ ] Expiry date
- [ ] Certificate file upload
- [x] Edit works
- [x] Save works
- [ ] Cancel works
- [ ] Add works
- [ ] Remove works
- [x] Upload works
- [ ] Download works
- [ ] Preview works where applicable
- [x] Data persists to PostgreSQL

---

# 6. Trainer Professional Profile

- [x] Trainer profile page exists
- [x] Profile image
- [x] Full name
- [x] Designation
- [x] Department
- [ ] Organization
- [x] Biography
- [x] Qualifications
- [ ] Work experience
- [ ] Skills
- [x] Interests
- [ ] Certifications
- [ ] Areas of expertise
- [ ] Subjects taught
- [x] Years of experience
- [ ] Training history
- [x] Trainer can edit/manage own profile
- [x] Trainer profile data persists
- [ ] Public/professional profile visibility is appropriate
- [x] Private information is protected

---

# 7. Competency Framework

- [x] Competency entities exist in database
- [x] Configurable 5-level framework exists
- [x] Level 1 — Awareness
- [x] Level 2 — Basic
- [x] Level 3 — Practitioner
- [x] Level 4 — Advanced
- [x] Level 5 — Expert
- [x] Level number is stored
- [x] Level title is stored
- [x] Level description is stored
- [x] Score threshold is stored
- [x] Admin can configure levels
- [ ] Competency score is evidence-based rather than manually typed
- [ ] Qualification evidence exists
- [ ] Experience evidence exists
- [ ] Certification evidence exists
- [ ] Assessment evidence exists
- [ ] Training history evidence exists
- [ ] Verification evidence exists

---

# 8. Competency Scoring Engine

- [x] Weighted scoring engine exists
- [x] Qualification weight = 15%
- [x] Relevant experience weight = 20%
- [x] Certification weight = 10%
- [x] Assessment weight = 30%
- [x] Training history weight = 15%
- [x] Admin verification weight = 10%
- [x] Formula is implemented correctly
- [x] Score is clamped between 0 and 100
- [x] Score converts to competency level
- [x] 0–20 → Level 1
- [x] 21–40 → Level 2
- [x] 41–60 → Level 3
- [x] 61–80 → Level 4
- [x] 81–100 → Level 5
- [x] Score calculation is transparent/explainable
- [ ] Level is persisted
- [ ] Score recalculates when relevant evidence changes
- [ ] Score calculation is transparent/explainable
- [ ] Configuration is not unnecessarily hard-coded

---

# 9. Experience & Certification Scoring

### Experience

- [ ] 0–1 years → 20
- [ ] 2–3 years → 40
- [ ] 4–6 years → 60
- [ ] 7–9 years → 80
- [ ] 10+ years → 100
- [ ] Relevant experience is considered for subject/competency where applicable

### Certification

- [ ] No relevant certification → 0
- [ ] Basic → 40
- [ ] Intermediate → 70
- [ ] Advanced → 100
- [ ] Verification affects certification evidence correctly
- [ ] Only verified certifications receive full verification benefit

---

# 10. Competency Assessments

- [ ] Trainer can be assessed for a competency
- [ ] Competency assessment can be associated with a competency
- [ ] Assessment score contributes to competency evidence
- [ ] Example 50-question assessment can produce normalized score
- [ ] Assessment evidence is persisted
- [ ] Competency score updates after configured assessment results

---

# 11. Training History & Verification

- [ ] Relevant training history is stored
- [ ] 0 trainings → 0
- [ ] 1–2 → 30
- [ ] 3–5 → 50
- [ ] 6–10 → 75
- [ ] 10+ → 100
- [ ] Relevant training count is used where possible
- [ ] Admin can verify competency evidence
- [ ] Verification states: PENDING / VERIFIED / REJECTED
- [ ] Verification changes are persisted
- [ ] Verification changes are audited

---

# 12. Competency Gap Analysis

- [ ] Trainee competency profile exists
- [ ] Required competency level is available
- [ ] Current competency level is available
- [ ] Gap is calculated
- [ ] Gap screen exists
- [ ] Current level shown
- [ ] Required level shown
- [ ] Gap shown
- [ ] Priority shown
- [ ] Recommended training shown
- [ ] Gap calculation is database-driven
- [ ] Gap updates when competency changes

---

# 13. Subject Competency Requirements

- [x] Subjects exist
- [x] Competencies can be mapped to subjects
- [x] Required level is configurable
- [x] Weight is configurable
- [x] Mandatory competency flag exists
- [ ] Weights are validated to total 100%
- [x] Admin can configure subject requirements
- [x] Example NWP mapping works
- [x] Subject requirements are persisted

---

# 14. Trainer Matching Engine

- [x] Trainer competency can be compared with subject requirements
- [x] Compatibility formula is implemented
- [x] Compatibility is capped at 1
- [x] Weighted competency match is calculated
- [x] Match score is normalized to 0–100
- [x] Mandatory competency rules are enforced
- [x] Missing mandatory competency makes trainer ineligible
- [ ] Final match score uses:
        - [x] Competency Match 60%
        - [x] Experience 20%
        - [x] Certification 10%
        - [x] Training History 10%
- [x] Final score is calculated correctly
- [x] Eligibility is returned
- [x] Competency breakdown is returned
- [x] Missing competencies are returned
- [x] Strongest competencies are returned
- [x] Reasoning is returned
- [x] Trainers are automatically ranked
- [ ] Ranking is database-driven
- [ ] Matching is not based on fake/static scores

---

# 15. Explainable Trainer Recommendation

- [ ] Recommendation page exists
- [ ] Match percentage shown
- [ ] Eligibility shown
- [ ] Competency Match shown
- [ ] Experience shown
- [ ] Certification shown
- [ ] Training History shown
- [ ] Strong competencies shown
- [ ] Relevant experience shown
- [ ] Previous relevant trainings shown
- [ ] Missing competencies shown where applicable
- [ ] User can view trainer profile
- [ ] User can view competency breakdown
- [ ] Recommendation reasoning is understandable

---

# 16. Competency Dashboards

### Trainee

- [ ] Competency list
- [ ] Visual score/progress
- [ ] Current level
- [ ] Target level
- [ ] Gap
- [ ] Evidence breakdown
- [ ] Click competency → evidence breakdown

### Trainer

- [ ] Competency list
- [ ] Level
- [ ] Score
- [ ] Evidence
- [ ] Strengths
- [ ] Gaps
- [ ] Click competency → evidence breakdown

---

# 17. Public Homepage

- [x] Hero
- [x] Platform overview
- [ ] Featured courses
- [x] Announcements
- [x] Notifications/public relevant content where appropriate
- [x] Achievements
- [x] New learning content
- [ ] Featured trainers
- [ ] Platform statistics
- [x] How Capacity Connect works
- [ ] Competency-driven learning section
- [x] Footer
- [x] Homepage content is dynamic
- [x] Admin-managed content appears dynamically after publishing
- [ ] No hard-coded production statistics

---

# 18. Public Course Catalog

- [ ] `/courses` exists
- [ ] Search
- [ ] Filtering
- [ ] Sorting
- [ ] Category filter
- [ ] Subject filter
- [ ] Difficulty filter
- [ ] Trainer filter
- [ ] Duration filter
- [ ] Pagination
- [ ] Course thumbnail
- [ ] Course title
- [ ] Trainer
- [ ] Subject
- [ ] Duration
- [ ] Difficulty
- [ ] Rating
- [ ] Enrollment count where appropriate
- [ ] CTA works
- [ ] Server-side filtering works for large datasets
- [ ] Search is debounced

---

# 19. Course Details

- [ ] `/courses/[id]` exists
- [ ] Title
- [ ] Description
- [ ] Trainer
- [ ] Subject
- [ ] Duration
- [ ] Difficulty
- [ ] Objectives
- [ ] Modules
- [ ] Resources
- [ ] Assessment information
- [ ] Completion requirements
- [ ] Enrollment CTA
- [ ] Enrollment action works

---

# 20. Trainee Dashboard

- [ ] `/trainee/dashboard`
- [ ] Total enrolled courses
- [ ] Active courses
- [ ] Completed courses
- [ ] Certificates
- [ ] Upcoming assessments
- [ ] Recent activity
- [ ] Course progress
- [ ] Competency summary
- [ ] Competency gaps
- [ ] Recommended courses
- [ ] Recommended trainers
- [ ] Announcements
- [ ] Notifications
- [ ] All metrics come from APIs/database

---

# 21. Trainee My Courses

- [ ] `/trainee/my-courses`
- [ ] Search
- [ ] Filters
- [ ] Progress
- [ ] Continue learning
- [ ] Completion status
- [ ] Continue button works
- [ ] View Course works
- [ ] View Progress works
- [ ] View Certificate works

---

# 22. Course Learning Experience

- [ ] `/trainee/courses/[courseId]`
- [ ] Course title
- [ ] Progress bar
- [ ] Module sidebar
- [ ] Module navigation
- [ ] Video support
- [ ] PDF support
- [ ] PPT/content support where configured
- [ ] Previous works
- [ ] Next works
- [ ] Mark Complete works
- [ ] Module completion is persisted
- [ ] Module is not falsely auto-completed
- [ ] Course progress is calculated from real completion events
- [ ] Completion requirements are enforced

---

# 23. Trainer Library

- [x] `/trainer/library`
- [x] Upload recorded lectures
- [x] Upload PDFs
- [x] Upload presentations
- [x] Upload study materials
- [x] Title
- [x] Description
- [ ] Subject
- [ ] Course
- [ ] Category
- [x] File
- [x] Visibility
- [x] Trainer can create library item
- [ ] Trainer can edit library item
- [x] Trainer can delete library item
- [x] Trainer can publish library item
- [x] Trainee can access published items
- [x] Protected resources require appropriate authorization

---

# 24. File Storage

- [x] Supabase Storage is used
- [ ] `avatars` bucket
- [ ] `course-resources` bucket
- [ ] `trainer-library` bucket
- [ ] `certificates` bucket
- [x] Private files are not publicly exposed
- [x] Signed URLs are used for protected files
- [ ] File type validation
- [ ] File size validation
- [x] Filename validation
- [x] Upload permission validation
- [ ] Server does not blindly trust client MIME type
- [ ] Upload progress works
- [ ] Cancel upload works where supported
- [ ] Success state works
- [ ] Failure state works
- [ ] Retry works

---

# 25. Trainer Course Management

- [ ] `/trainer/courses`
- [ ] Create Course
- [ ] Edit
- [ ] Duplicate
- [ ] View
- [ ] Publish
- [ ] Unpublish
- [ ] Archive
- [ ] Delete
- [ ] Manage Modules
- [ ] Manage Resources
- [ ] Publish validation exists
- [ ] Course ownership/authorization is enforced

---

# 26. Course Creation

- [ ] Title
- [ ] Description
- [ ] Subject
- [ ] Category
- [ ] Difficulty
- [ ] Duration
- [ ] Learning objectives
- [ ] Target audience
- [ ] Prerequisites
- [ ] Thumbnail
- [ ] Module name
- [ ] Module description
- [ ] Module order
- [ ] Video resource
- [ ] PDF resource
- [ ] PPT resource
- [ ] Document resource
- [ ] External resource where supported
- [ ] Form validation
- [ ] Backend validation
- [ ] Save/persistence
- [ ] Edit persistence

---

# 27. Course Approval / Publishing Workflow

- [ ] Course states exist where required
- [ ] DRAFT
- [ ] PENDING_REVIEW
- [ ] APPROVED
- [ ] PUBLISHED
- [ ] REJECTED
- [ ] ARCHIVED
- [ ] Admin can review courses
- [ ] Admin can approve
- [ ] Admin can reject
- [ ] Admin can publish/unpublish/archive/delete
- [ ] Workflow is enforced server-side

---

# 28. Trainer Assessment Builder

- [ ] `/trainer/assessments`
- [x] Create Assessment
- [ ] Edit
- [x] Publish
- [x] Unpublish
- [ ] Duplicate
- [ ] View Results
- [x] View Participation
- [ ] Archive
- [x] Title
- [ ] Subject
- [x] Course
- [x] Description
- [ ] Duration
- [ ] Start date
- [x] Deadline
- [ ] Passing score
- [ ] Attempt limit

---

# 29. Question Builder

- [x] MCQ support
- [x] Four options
- [x] Correct option
- [ ] Explanation
- [x] Marks
- [ ] Difficulty
- [ ] Competency tag
- [ ] Questions can be associated with competencies
- [x] Add Question works
- [x] Save Question works
- [ ] Edit question works
- [ ] Delete question works
- [x] Question data persists

---

# 30. Trainee Assessment Experience

- [ ] `/trainee/assessments`
- [ ] Upcoming assessments
- [ ] Active assessments
- [ ] Completed assessments
- [ ] Expired assessments
- [ ] Assessment page works
- [ ] Question navigation
- [ ] Previous
- [ ] Next
- [ ] Submit
- [ ] Countdown timer
- [ ] Question navigation panel
- [ ] Answered/unanswered indicators
- [ ] Submit confirmation
- [ ] Deadline is enforced server-side
- [ ] Submission after deadline is prevented
- [ ] Attempt limit is enforced
- [ ] Answers persist appropriately
- [ ] Assessment submission is not fake

---

# 31. Assessment Results

- [ ] Total score
- [ ] Percentage
- [ ] Correct count
- [ ] Incorrect count
- [ ] Skipped count
- [ ] Passing status
- [ ] Time taken
- [ ] Competency-wise performance
- [ ] Results are persisted
- [ ] Results can update competency evidence where configured
- [ ] Result is based on actual submitted answers

---

# 32. Feedback

- [ ] Trainee can submit course feedback
- [ ] Trainee can submit trainer feedback
- [ ] Trainee can submit training-content feedback
- [ ] Overall rating
- [ ] Content quality
- [ ] Trainer quality
- [ ] Usefulness
- [ ] Comments
- [ ] Duplicate feedback is prevented unless explicitly allowed
- [ ] Feedback persists
- [ ] Feedback is visible only to authorized users

---

# 33. Certificates

- [ ] Certificate record is generated on successful completion
- [ ] Certificate title
- [ ] Trainee name
- [ ] Course name
- [ ] Completion date
- [ ] Certificate ID
- [ ] Professional certificate layout
- [ ] View certificate
- [ ] Download certificate
- [ ] Certificate record persists
- [ ] Certificate cannot be falsely generated without meeting completion requirements

---

# 34. Trainer Dashboard

- [x] Courses
- [x] Active learners
- [x] Assessments
- [x] Completion rate
- [x] Average performance
- [x] Upcoming deadlines
- [x] Recent learner activity
- [ ] Competency profile
- [ ] Trainer match score where relevant
- [x] Metrics are database-driven

---

# 35. Trainer Participation Monitoring

- [x] `/trainer/participation`
- [x] Trainee
- [x] Course
- [x] Enrollment date
- [x] Progress
- [x] Assessment
- [x] Score
- [x] Completion
- [ ] Course filter
- [ ] Assessment filter
- [ ] Date filter
- [ ] Completion-status filter
- [x] CSV export works
- [x] Search works
- [ ] Sorting/filter/pagination work

---

# 36. Trainer Performance Dashboard

- [x] Average course completion
- [x] Assessment average
- [ ] Course feedback
- [x] Trainee count
- [ ] Training sessions
- [ ] Competency strengths
- [ ] Competency gaps
- [ ] Real database-driven charts
- [x] No hard-coded analytics

---

# 37. Admin Dashboard

- [x] `/admin/dashboard`
- [x] Total users
- [x] Pending approvals
- [x] Trainees
- [x] Trainers
- [x] Courses
- [x] Enrollments
- [x] Certificates
- [x] Assessments
- [x] Participation rate
- [x] Enrollment trends
- [ ] Course completion
- [ ] Assessment performance
- [x] User growth
- [ ] Certificate issuance
- [ ] Participation by department
- [ ] Subject popularity
- [ ] Competency distribution
- [x] All statistics come from API/database

---

# 38. Admin User Management

- [x] `/admin/users`
- [x] All users tab
- [x] Pending tab
- [x] Trainees tab
- [x] Trainers tab
- [x] Admins tab
- [x] Suspended tab
- [x] View
- [x] Approve
- [x] Reject
- [x] Suspend
- [x] Reactivate
- [x] Change Role
- [ ] Account workflow action where supported
- [x] Search
- [x] Pagination
- [x] Server-side authorization
- [x] Role changes audited

---

# 39. Admin Pending Approval

- [x] `/admin/users/pending`
- [x] View profile
- [x] Review documents
- [x] Approve
- [x] Reject
- [x] Rejection reason
- [x] Approval status persists
- [x] User access changes after approval

---

# 40. Admin Course Management

- [x] View
- [x] Approve
- [x] Reject
- [x] Publish
- [x] Unpublish
- [x] Archive
- [ ] Delete
- [x] Course state is persisted
- [x] Privileged operations are audited

---

# 41. Admin Assessment Monitoring

- [x] Number of assessments
- [ ] Active assessments
- [ ] Completed attempts
- [ ] Average scores
- [ ] Pass rate
- [ ] Subject-wise performance
- [ ] Drill-down
- [x] Database-driven metrics

---

# 42. Admin Certification Monitoring

- [x] Certificates issued
- [x] Certificates by course
- [ ] Certificates by department
- [x] Recent certificates
- [ ] Search
- [x] Database-driven metrics

---

# 43. Admin Enrollment Monitoring

- [x] Total enrollments
- [x] Course-wise enrollments
- [x] Completion rates
- [ ] Active learners
- [ ] Dropout/incomplete learning
- [ ] Filters/drill-down where appropriate

---

# 44. Admin Content Management / CMS

### Notifications

- [x] Create
- [x] Edit
- [x] Publish
- [x] Unpublish
- [ ] Schedule where practical

### Announcements

- [x] Title
- [x] Description
- [x] Image
- [x] Target audience
- [x] Publish state
- [x] Create/edit/delete/publish

### Achievements

- [x] Title
- [x] Description
- [x] Date
- [x] Image
- [x] Person/team/organization
- [x] Create/edit/delete

### New Learning Content

- [x] Course/resource
- [x] Description
- [x] Publish
- [x] Create/edit/delete where applicable

- [x] Published content appears dynamically on homepage
- [x] CMS content is stored in database

---

# 45. Notifications

- [ ] In-app notification system
- [ ] NEW_COURSE
- [ ] ASSESSMENT_CREATED
- [ ] ASSESSMENT_DEADLINE
- [ ] COURSE_APPROVED
- [ ] COURSE_REJECTED
- [ ] CERTIFICATE_ISSUED
- [ ] USER_APPROVED
- [ ] NEW_ANNOUNCEMENT
- [ ] NEW_LIBRARY_CONTENT
- [ ] COMPETENCY_RECOMMENDATION
- [ ] Notification bell
- [ ] Unread count
- [ ] Notification list
- [ ] Mark as read
- [ ] Mark all as read
- [ ] Database persistence
- [ ] Authorization ensures users see only their notifications

---

# 46. Global / Contextual Search

- [ ] Course search
- [ ] Trainer search
- [ ] Subject search
- [ ] Library resource search
- [ ] Debounced search
- [ ] Server-side filtering for large datasets
- [ ] Search respects role/visibility permissions

---

# 47. API Layer

- [ ] `/api/v1` base path
- [ ] `/me`
- [ ] `/me/profile`
- [ ] `/users`
- [ ] `/users/:id`
- [ ] User role/status APIs
- [ ] Admin pending/approve/reject APIs
- [ ] Course CRUD APIs
- [ ] Course publish/unpublish APIs
- [ ] Module CRUD APIs
- [ ] Resource APIs
- [ ] Enrollment APIs
- [ ] Progress APIs
- [ ] Assessment CRUD APIs
- [ ] Question APIs
- [ ] Attempt start/answer/submit APIs
- [ ] Result APIs
- [ ] Feedback APIs
- [ ] Certificate APIs
- [ ] Trainer library APIs
- [ ] Competency APIs
- [ ] Competency-gap APIs
- [ ] Trainer competency APIs
- [ ] Recommended-trainer APIs
- [ ] Trainer-match detail APIs
- [ ] Notification APIs
- [ ] Announcement APIs
- [ ] Achievement APIs
- [ ] Dashboard APIs
- [ ] All meaningful UI actions use real APIs
- [ ] No fake API responses
- [ ] No local arrays as a replacement for database state

---

# 48. API Response Standards

- [ ] Consistent success response
- [ ] Consistent error response
- [ ] Pagination response
- [ ] Safe error messages
- [ ] Validation errors structured consistently
- [ ] HTTP status codes are appropriate

---

# 49. Security

- [ ] Supabase JWT verification
- [ ] Server-side RBAC
- [ ] Helmet
- [ ] CORS whitelist
- [ ] Rate limiting
- [ ] Zod validation
- [ ] Drizzle parameterized queries
- [ ] Safe file validation
- [ ] Signed URLs for private files
- [ ] No frontend secrets
- [ ] No service-role key in browser
- [ ] Secure error handling
- [ ] Audit logs for privileged operations
- [ ] Sensitive environment variables server-side only
- [ ] No passwords in logs
- [ ] No access tokens in logs
- [ ] No service-role key in logs
- [ ] Sensitive personal data is not logged unnecessarily

---

# 50. Audit Logging

- [x] Audit log table
- [x] Role changes
- [x] User approvals
- [x] User rejections
- [x] User suspension
- [x] Course publishing
- [x] Content deletion
- [ ] Competency verification
- [ ] Trainer competency changes
- [x] Admin settings changes
- [x] Actor stored
- [x] Action stored
- [x] Entity stored
- [x] Entity ID stored
- [x] Metadata stored
- [x] Timestamp stored
- [ ] Logs are protected from unauthorized modification

---

# 51. Environment &  

- [ ] `.env.example` exists
- [ ] `DATABASE_URL`
- [ ] `NEXT_PUBLIC_API_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `CORS_ORIGIN`
- [ ] `JWT_AUDIENCE`
- [ ] `JWT_ISSUER`
- [ ] Storage bucket variables
- [ ] No secrets hard-coded
- [ ]   Secrets/environment configuration works
- [ ] No local-only absolute paths
- [ ] No unnecessary Docker dependency
- [ ] PostgreSQL connection uses environment variable
- [ ] Supabase service-role key remains server-side

---

# 52. Homepage / Content Data Flow

- [ ] Announcements retrieved through backend API
- [ ] Achievements retrieved through backend API
- [ ] Learning content retrieved through backend API
- [ ] Featured items retrieved dynamically
- [ ] Publishing content changes public UI without source-code edits
- [ ] No hard-coded production statistics

---

# 53. Responsive Design

- [ ] Desktop layout
- [ ] Tablet layout
- [ ] Mobile layout
- [ ] Sidebar collapses appropriately
- [ ] Mobile navigation uses drawer/sheet where appropriate
- [ ] Tables become responsive cards or horizontal scroll
- [ ] Forms work on small screens
- [ ] Dashboards remain usable on mobile
- [ ] No major horizontal overflow
- [ ] Touch targets are usable

---

# 54. Design System & UI Quality

- [ ] Modern
- [ ] Professional
- [ ] Institutional
- [ ] Premium
- [ ] Clean
- [ ] Credible
- [ ] Calm
- [ ] Data-driven
- [ ] Restrained color palette
- [ ] Typography hierarchy
- [ ] Controlled whitespace
- [ ] Consistent 8px spacing system
- [ ] Consistent border radius
- [ ] Subtle shadows
- [ ] Clear focus states
- [ ] Accessible contrast
- [ ] shadcn/ui consistency
- [ ] No excessive gradients
- [ ] No random neon colors
- [ ] No excessive glassmorphism
- [ ] No oversized typography
- [ ] No unnecessary floating elements
- [ ] No generic AI-dashboard visual clichés
- [ ] No inconsistent spacing
- [ ] No random colors per page

---

# 55. Animations

- [ ] Page entrance animation where useful
- [ ] Dashboard card entrance
- [ ] List appearance
- [ ] Modal transitions
- [ ] Progress transitions
- [ ] Hover micro-interactions
- [ ] Tab transitions
- [ ] Loading/skeleton transitions
- [ ] Animations are subtle
- [ ] No distracting continuous animations
- [ ] No unnecessary parallax

---

# 56. Loading States

- [ ] Saving state
- [ ] Uploading state
- [ ] Publishing state
- [ ] Approving state
- [ ] Deleting state
- [ ] Submitting state
- [ ] Generating state
- [ ] Buttons disable during async operation
- [ ] Page-level skeletons
- [ ] No blank white loading screens

---

# 57. Error Handling

- [ ] Client validation errors
- [ ] 401 handling
- [ ] 403 handling
- [ ] 404 handling
- [ ] 409 handling
- [ ] 422 handling
- [ ] 429 handling
- [ ] 500 handling
- [ ] Meaningful frontend messages
- [ ] Raw backend stack traces are never shown to users
- [ ] Backend logs detailed errors safely
- [ ] Network errors have useful UI

---

# 58. Confirmation Dialogs

- [ ] Delete course confirmation
- [ ] Delete resource confirmation
- [ ] Reject user confirmation
- [ ] Suspend user confirmation
- [ ] Remove trainer competency confirmation
- [ ] Delete assessment confirmation
- [ ] Archive content confirmation
- [ ] Approve/reject modal
- [ ] Evidence verification modal
- [ ] Competency breakdown modal
- [ ] Role-change modal where appropriate

---

# 59. Forms & Validation

- [ ] React Hook Form
- [ ] Zod client validation
- [ ] Zod backend validation
- [ ] Clear labels
- [ ] Required indicators
- [ ] Field-level errors
- [ ] Loading states
- [ ] Success feedback
- [ ] Server validation is not skipped
- [ ] HTML validation is not the only validation

---

# 60. Table UX

- [ ] Sorting
- [ ] Search
- [ ] Filtering
- [ ] Pagination
- [ ] Row actions
- [ ] Responsive behavior
- [ ] Status badges
- [ ] Pending
- [ ] Approved
- [ ] Rejected
- [ ] Published
- [ ] Draft
- [ ] Active
- [ ] Completed
- [ ] Expired
- [ ] Suspended

---

# 61. Topbar & Navigation

### Trainee navigation

- [ ] Dashboard
- [ ] My Profile
- [ ] Courses
- [ ] My Learning
- [ ] Assessments
- [ ] Results
- [ ] Competencies
- [ ] Recommended Training
- [ ] Certificates
- [ ] Trainer Library
- [ ] Notifications

### Trainer navigation

- [ ] Dashboard
- [ ] My Profile
- [ ] My Courses
- [ ] Create Course
- [ ] Trainer Library
- [ ] Assessments
- [ ] Participation
- [ ] Performance
- [ ] Competencies
- [ ] Notifications

### Admin navigation

- [ ] Dashboard
- [ ] Users
- [ ] Pending Approvals
- [ ] Courses
- [ ] Enrollments
- [ ] Assessments
- [ ] Certificates
- [ ] Participation
- [ ] Competencies
- [ ] Trainer Matching
- [ ] Content
- [ ] Announcements
- [ ] Notifications
- [ ] Achievements
- [ ] Learning Content
- [ ] Audit Logs
- [ ] Settings

### Topbar

- [ ] Breadcrumbs where useful
- [ ] Notification bell
- [ ] User avatar
- [ ] Profile menu
- [ ] Role badge
- [ ] Logout
- [ ] Responsive menu

---

# 62. Dashboard Components

- [ ] KPI cards
- [ ] Trend indicators
- [ ] Line charts
- [ ] Bar charts
- [ ] Doughnut charts where useful
- [ ] Progress cards
- [ ] Activity feed
- [ ] Recent items
- [ ] Recommendation panels
- [ ] Dashboard metrics have clear purpose
- [ ] No dashboard clutter

---

# 63. Accessibility

- [ ] Keyboard navigation
- [ ] Visible focus states
- [ ] Form labels
- [ ] Appropriate ARIA attributes
- [ ] Good color contrast
- [ ] Semantic HTML
- [ ] Accessible dialogs
- [ ] Screen-reader-friendly controls
- [ ] Status is not communicated only through color

---

# 64. Empty / Not Found / Error Pages

- [ ] Meaningful empty state for every important list
- [ ] Custom 404
- [ ] Global error page
- [ ] Unauthorized page
- [ ] Forbidden page
- [ ] Network error state
- [ ] Empty states provide useful next action where appropriate

---

# 65. Performance

- [ ] Pagination
- [ ] Server-side filtering
- [ ] Lazy loading where appropriate
- [ ] Optimized images
- [ ] Database indexes
- [ ] Efficient joins
- [ ] TanStack Query caching
- [ ] Avoid unnecessary requests
- [ ] Debounced search
- [ ] No unnecessary global state
- [ ] APIs remain stateless
- [ ] Redis is not required for MVP

---

# 66. Database Indexes

- [ ] users.email
- [ ] users.role
- [ ] users.status
- [ ] courses.subject_id
- [ ] courses.status
- [ ] enrollments.user_id
- [ ] enrollments.course_id
- [ ] assessments.course_id
- [ ] assessments.deadline
- [ ] competency relationships
- [ ] notifications.user_id
- [ ] created_at where useful

---

# 67. Testing

### Unit tests

- [ ] Competency scoring
- [ ] Trainer matching
- [ ] Experience scoring
- [ ] Certification scoring
- [ ] Competency gap calculation

### API tests

- [ ] Authentication
- [ ] RBAC
- [ ] Course CRUD
- [ ] Enrollment
- [ ] Assessment submission
- [ ] Admin approval
- [ ] Trainer matching

### E2E tests

- [ ] Signup/login
- [ ] Admin approval
- [ ] Trainee enrollment
- [ ] Trainee learning
- [ ] Assessment
- [ ] Result
- [ ] Certificate
- [ ] Trainer creates course
- [ ] Trainer uploads resource
- [ ] Admin publishes course
- [ ] Competency matching

### Competency engine tests

- [ ] Level 5 trainer + required Level 5 → 100% compatibility
- [ ] Level 4 trainer + required Level 5 → 80% compatibility
- [ ] Missing mandatory competency → not eligible
- [ ] All evidence zero → Level 1 / score 0
- [ ] Score 81 → Level 5
- [ ] Score 80 → Level 4

- [ ] Vitest is configured
- [ ] Playwright is configured
- [ ] Tests actually execute successfully

---

# 68. Logging

- [ ] Pino is used on backend
- [ ] Request ID/correlation ID
- [ ] HTTP method
- [ ] Path
- [ ] Status
- [ ] Duration
- [ ] User ID where available
- [ ] Safe error details
- [ ] No passwords logged
- [ ] No access tokens logged
- [ ] No service-role key logged
- [ ] Sensitive personal data not unnecessarily logged

---

# 69. Rate Limiting

- [ ] Login-related endpoints protected
- [ ] Public APIs protected
- [ ] Expensive APIs protected
- [ ] Upload endpoints protected
- [ ] Assessment submission protected
- [ ] Limits are not overly restrictive

---

# 70. API Documentation

- [ ] `API.md` exists
- [ ] Endpoint documented
- [ ] Method documented
- [ ] Authentication requirement documented
- [ ] Role requirement documented
- [ ] Request body documented
- [ ] Response documented
- [ ] Errors documented
- [ ] OpenAPI/Swagger exists where practical

---

# 71. Project Structure & Code Quality

- [ ] Frontend/backend separation is maintained
- [ ] `app/` structure is organized
- [ ] `components/` is organized
- [ ] `lib/api/` exists
- [ ] `lib/auth/` exists
- [ ] `lib/validation/` exists
- [ ] `server/src/config/`
- [ ] `server/src/db/`
- [ ] `server/src/middleware/`
- [ ] `server/src/modules/`
- [ ] `server/src/utils/`
- [ ] `drizzle/migrations/`
- [ ] `tests/`
- [ ] No giant files
- [ ] No duplicated business logic
- [ ] No dead code
- [ ] TypeScript strict mode
- [ ] ESLint configured
- [ ] Naming is consistent
- [ ] Comments are useful rather than excessive

---

# 72. Development Commands

- [ ] `npm run dev`
- [ ] `npm run build`
- [ ] `npm start`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run db:generate`
- [ ] `npm run db:migrate`
- [ ] `npm run db:push`
- [ ] `npm run db:seed`
- [ ] `npm run db:studio`
- [ ] Commands work in  
- [ ] No broken package scripts

---

# 73. Realistic Seed Data

- [ ] Meteorology
- [ ] Weather Forecasting
- [ ] Numerical Weather Prediction
- [ ] Climate Science
- [ ] Satellite Meteorology
- [ ] Radar Meteorology
- [ ] Meteorological Instruments
- [ ] GIS & Spatial Analysis
- [ ] Data Analysis
- [ ] Python for Meteorological Applications
- [ ] Disaster and Early Warning Systems
- [ ] Demo trainees
- [ ] Demo trainers
- [ ] Demo admin
- [ ] Courses
- [ ] Modules
- [ ] Resources
- [ ] Assessments
- [ ] Questions
- [ ] Competencies
- [ ] Subject competency mappings
- [ ] Trainer competencies
- [ ] Competency evidence
- [ ] Announcements
- [ ] Achievements
- [ ] Notifications
- [ ] Enrollments
- [ ] Results
- [ ] Demo accounts are documented and use non-production credentials

---

# 74. Final End-to-End Demo Flow

### Admin

- [ ] Login
- [ ] Approve trainer
- [ ] Approve trainee
- [ ] Define competency
- [ ] Define subject requirements
- [ ] Manage course
- [ ] Publish announcement

### Trainer

- [ ] Login
- [ ] Complete profile
- [ ] Add expertise
- [ ] Add competency evidence
- [ ] Upload trainer library
- [ ] Create course
- [ ] Create MCQ assessment
- [ ] Set deadline

### Trainee

- [ ] Login
- [ ] Complete professional profile
- [ ] Browse course
- [ ] Enroll
- [ ] Study content
- [ ] Attempt MCQ
- [ ] Receive result
- [ ] See competency status
- [ ] See competency gap
- [ ] Receive recommended course
- [ ] See suitable trainer
- [ ] Complete course
- [ ] Receive certificate
- [ ] Submit feedback

### System

- [ ] Calculate competency
- [ ] Calculate competency gap
- [ ] Calculate trainer match
- [ ] Rank trainers
- [ ] Explain why trainer was recommended
- [ ] Update competency after assessment

---

# 75. Final Acceptance Criteria

The project must NOT be marked fully complete until the following are actually working:

### Authentication
- [ ] Signup
- [ ] Login
- [ ] Logout
- [ ] Protected routes
- [ ] JWT verification
- [ ] RBAC
- [ ] Approval workflow

### Trainee
- [ ] Professional profile
- [ ] Qualifications
- [ ] Work experience
- [ ] Interests
- [ ] Skills
- [ ] Certificates
- [ ] Course enrollment
- [ ] Learning resources
- [ ] Progress tracking
- [ ] MCQ assessment
- [ ] Results
- [ ] Feedback
- [ ] Competency profile
- [ ] Competency gaps
- [ ] Recommended courses
- [ ] Recommended trainers

### Trainer
- [ ] Professional profile
- [ ] Expertise
- [ ] Competencies
- [ ] Evidence
- [ ] Course management
- [ ] Resource upload
- [ ] Trainer library
- [ ] Assessment builder
- [ ] Deadline
- [ ] Participation monitoring
- [ ] Performance analytics

### Admin
- [ ] User approval
- [ ] Role management
- [ ] Course management
- [ ] Enrollment analytics
- [ ] Assessment analytics
- [ ] Certification analytics
- [ ] Participation analytics
- [ ] Competency management
- [ ] Subject competency mapping
- [ ] Trainer matching
- [ ] Notifications
- [ ] Announcements
- [ ] Achievements
- [ ] Learning content
- [ ] Audit logs

### Platform
- [ ] Responsive
- [ ] Accessible
- [ ] Secure
- [ ] Modern UI
- [ ] Proper animations
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Database persistence
- [ ] Real APIs
- [ ] File storage
- [ ] Validation
- [ ] Logging
- [ ] Testing
- [ ] Documentation

---

# 76. Status Update Rules for  

When auditing this file:

1. Inspect the actual source code.
2. Inspect database schema and migrations.
3. Inspect API routes/controllers/services.
4. Inspect Supabase Auth integration.
5. Inspect Supabase Storage integration.
6. Inspect frontend pages and components.
7. Trace important buttons to their actual handlers/API calls.
8. Verify data is persisted in PostgreSQL where required.
9. Verify role authorization server-side.
10. Run the application and test critical workflows.
11. Run typecheck/lint/build/tests where available.
12. Do not mark a feature complete merely because a UI page exists.
13. Do not mark mocked, hard-coded, static, fake, or disconnected functionality as complete.
14. If a feature works partially, mark it `🟨 PARTIALLY COMPLETE`.
15. If a feature does not exist or does not work, mark it `⬜ PENDING`.
16. Use `⚪ BLOCKED` only for a real external/configuration blocker.
17. Add a short evidence note for every non-complete feature.
18. Keep the checklist synchronized with the actual project after fixes.
19. Do not remove checklist items merely because they are difficult.
20. Do not silently change the requirements of the checklist.

---

# 77. Audit Summary

> Counts below are for the 78 numbered feature areas in the audit evidence map above. Individual requirement bullets remain the detailed scope for each area.

| Status | Count |
|---|---:|
| ✅ COMPLETE | 3 |
| 🟨 PARTIALLY COMPLETE | 61 |
| ⬜ PENDING | 14 |
| ⚪ BLOCKED | 0 |

## Critical Blockers

- No external blocker was identified. The main implementation blockers are missing durable domain tables, incomplete trainer workflows, and static/in-memory learner capacity data.

## Highest-Priority Pending/Partial Features

- Replace static/in-memory courses, competencies, gaps, trainers, assessments, notifications, enrollments, results, certificates, and feedback with authorized PostgreSQL-backed workflows.
- Complete the remaining trainer workflows and analytics: assessment/question builders, trainer library, trainer dashboards, and richer admin monitoring.
- Connect evidence changes and assessment results to the competency engine, gap analysis, and database-backed trainer matching.
- Add remaining seeds, server-side validation/security controls, and automated unit/API/E2E coverage.

## Last Audit

- Date: `2026-09-14`
- Auditor: ` `
- Build status: `Typecheck passed; full production build not run`
- Test status: `NOT RUN (no test script/configuration present)`

---

# 78. Completion Definition

A feature is **COMPLETE** only when its intended workflow works end-to-end.

For example:

`Create → Validate → API → Database → Read → Update/Delete → Authorization → Loading/Error states → Tests`

A visible page, button, mock response, local array, hard-coded statistic, or static chart is **not** sufficient evidence of completion.

The central product loop must work:

```text
Professional Profile
        ↓
Competency Assessment
        ↓
Competency Gap
        ↓
Recommended Learning
        ↓
Suitable Trainer
        ↓
Training
        ↓
Assessment
        ↓
Performance
        ↓
Updated Competency
```
