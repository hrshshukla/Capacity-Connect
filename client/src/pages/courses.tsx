import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Award, Check, CheckCircle2, Clock3, Compass, FilePlus2, GraduationCap, Search, Sparkles, Star, Target, Users, X } from "lucide-react";
import { getGetCourseQueryKey, getGetTraineeDashboardQueryKey, getListCoursesQueryKey, useCompleteCourse, useCreateCourse, useEnrollInCourse, useGetCourse, useListCourses, type Course, type CourseInput } from "@/lib/api-client-react";
import { Link, useParams } from "wouter";
import { EmptyState, Flash, QueryState } from "@/components/common";
import { Shell } from "@/components/layout";
import { initials } from "@/components/common";
import { queryClient } from "@/lib/query-client";
export function Catalog() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [subject, setSubject] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [flash, setFlash] = useState("");
  const params = useMemo(
    () => ({
      search: search || undefined,
      difficulty: difficulty || undefined,
      subject: subject || undefined,
    }),
    [search, difficulty, subject],
  );
  const query = useListCourses(params, {
    query: { queryKey: getListCoursesQueryKey(params) },
  });
  const courses = query.data || [];
  const subjects = [...new Set(courses.map((course) => course.subject))];
  const createCourse = useCreateCourse();
  const submitCourse = (input: CourseInput) =>
    createCourse.mutate(
      { data: input },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListCoursesQueryKey(params),
          });
          setShowCreate(false);
          setFlash("Course suggestion sent for review.");
        },
      },
    );
  return (
    <Shell>
      <div className="content-header animate-in">
        <div>
          <div className="eyebrow">Learning catalogue</div>
          <h1>Choose your next field note.</h1>
          <p>
            Search focused courses built around the capability signals your team
            uses every day.
          </p>
        </div>
        <button
          className="btn btn-dark"
          onClick={() => setShowCreate(true)}
          data-testid="button-suggest-course"
        >
          <FilePlus2 size={15} /> Suggest a course
        </button>
      </div>
      <div className="catalog-toolbar animate-in delay-1">
        <div className="input-wrap">
          <Search size={16} />
          <input
            className="input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by topic or capability"
            data-testid="input-course-search"
          />
        </div>
        <select
          className="select"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          data-testid="select-course-subject"
        >
          <option value="">All subjects</option>
          {subjects.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          className="select"
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value)}
          data-testid="select-course-difficulty"
        >
          <option value="">All levels</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </div>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        retry={() => query.refetch()}
        label="courses"
      >
        <>
          {courses.length ? (
            <div className="catalog-grid">
              {courses.map((course, index) => (
                <CourseCard course={course} key={course.id} index={index} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Compass />}
              title="No courses match that signal"
              text="Try a broader topic or clear one of the filters."
              action={
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setSearch("");
                    setSubject("");
                    setDifficulty("");
                  }}
                  data-testid="button-clear-filters"
                >
                  Clear filters
                </button>
              }
            />
          )}
        </>
      </QueryState>
      {showCreate && (
        <CreateCourseModal
          pending={createCourse.isPending}
          error={createCourse.error}
          onClose={() => setShowCreate(false)}
          onSubmit={submitCourse}
        />
      )}
      {flash && <Flash message={flash} onClose={() => setFlash("")} />}
    </Shell>
  );
}

export function CourseCard({ course, index }: { course: Course; index: number }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className={`surface course-card animate-in delay-${Math.min((index % 4) + 1, 4)}`}
      data-testid={`card-catalog-course-${course.id}`}
    >
      <div
        className="course-art"
        style={{ "--art": course.thumbnailTone } as React.CSSProperties}
      >
        <span className="course-art-label">{course.subject}</span>
      </div>
      <div className="course-body">
        <h3>{course.title}</h3>
        <p>
          {course.difficulty} · {course.durationHours} hours
        </p>
        <div className="course-meta">
          <span>{course.trainer}</span>
          <span>
            <Star size={12} fill="currentColor" /> {course.rating.toFixed(1)}
          </span>
        </div>
      </div>
      <div className="course-footer">
        <span>{course.enrolled} enrolled</span>
        <span>
          View course{" "}
          <ArrowRight size={13} style={{ verticalAlign: "middle" }} />
        </span>
      </div>
    </Link>
  );
}

export function CreateCourseModal({
  pending,
  error,
  onClose,
  onSubmit,
}: {
  pending: boolean;
  error?: unknown;
  onClose: () => void;
  onSubmit: (data: CourseInput) => void;
}) {
  const [form, setForm] = useState<CourseInput>({
    title: "",
    subject: "",
    difficulty: "Intermediate",
    durationHours: 4,
    description: "",
  });
  const change = (key: keyof CourseInput, value: string) =>
    setForm((current) => ({
      ...current,
      [key]: key === "durationHours" ? Number(value) : value,
    }));
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal" role="dialog" aria-modal="true">
        <div
          style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
        >
          <div>
            <div className="eyebrow">Add to the network</div>
            <h2>Suggest a course</h2>
            <p>Share a useful capability topic with the learning team.</p>
          </div>
          <button
            className="text-button"
            onClick={onClose}
            aria-label="Close course suggestion"
            data-testid="button-close-course-modal"
          >
            <X size={18} />
          </button>
        </div>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="course-title">Title</label>
            <input
              id="course-title"
              className="input"
              value={form.title}
              onChange={(event) => change("title", event.target.value)}
              placeholder="e.g. Communicating forecast uncertainty"
              data-testid="input-new-course-title"
            />
          </div>
          <div className="split-grid">
            <div className="form-field">
              <label htmlFor="course-subject">Subject</label>
              <input
                id="course-subject"
                className="input"
                value={form.subject}
                onChange={(event) => change("subject", event.target.value)}
                placeholder="Subject area"
                data-testid="input-new-course-subject"
              />
            </div>
            <div className="form-field">
              <label htmlFor="course-level">Level</label>
              <select
                id="course-level"
                className="select"
                value={form.difficulty}
                onChange={(event) => change("difficulty", event.target.value)}
                data-testid="select-new-course-level"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="course-duration">Duration (hours)</label>
            <input
              id="course-duration"
              type="number"
              min="1"
              className="input"
              value={form.durationHours}
              onChange={(event) => change("durationHours", event.target.value)}
              data-testid="input-new-course-duration"
            />
          </div>
          <div className="form-field">
            <label htmlFor="course-description">Why it matters</label>
            <textarea
              id="course-description"
              className="input"
              style={{ height: 74, paddingTop: 10, resize: "vertical" }}
              value={form.description}
              onChange={(event) => change("description", event.target.value)}
              placeholder="What will this help a team do better?"
              data-testid="input-new-course-description"
            />
          </div>
        </div>
        {Boolean(error) && (
          <p
            style={{ color: "#ad593d", fontSize: 12, margin: "0 0 14px" }}
            data-testid="error-create-course"
          >
            The suggestion could not be sent. Check the fields and try again.
          </p>
        )}
        <div className="modal-actions">
          <button
            className="btn btn-outline"
            onClick={onClose}
            data-testid="button-cancel-course"
          >
            Cancel
          </button>
          <button
            className="btn btn-dark"
            disabled={
              pending ||
              form.title.trim().length < 3 ||
              !form.subject.trim() ||
              !form.description.trim()
            }
            onClick={() => onSubmit(form)}
            data-testid="button-submit-course"
          >
            {pending ? "Sending…" : "Send suggestion"} <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function CourseDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const query = useGetCourse(id, {
    query: { enabled: !!id, queryKey: getGetCourseQueryKey(id) },
  });
  const enroll = useEnrollInCourse();
  const complete = useCompleteCourse();
  const [enrolled, setEnrolled] = useState(false);
  const [flash, setFlash] = useState("");
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(id) });
    queryClient.invalidateQueries({
      queryKey: getGetTraineeDashboardQueryKey(),
    });
  };
  const detail = query.data;
  const doEnroll = () =>
    enroll.mutate(
      { courseId: id },
      {
        onSuccess: () => {
          setEnrolled(true);
          invalidate();
          setFlash("You are enrolled. Your learning path is ready.");
        },
      },
    );
  const doComplete = () =>
    complete.mutate(
      { courseId: id },
      {
        onSuccess: () => {
          invalidate();
          setFlash("Course complete. Your certificate is being prepared.");
        },
      },
    );
  return (
    <Shell>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        retry={() => query.refetch()}
        label="course-detail"
      >
        {detail && (
          <div className="animate-in">
            <Link
              href="/courses"
              className="text-button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 18,
              }}
              data-testid="link-back-courses"
            >
              <ArrowLeft size={14} /> Back to catalogue
            </Link>
            <div className="detail-hero">
              <div className="eyebrow" style={{ color: "var(--sun)" }}>
                {detail.subject} · {detail.difficulty}
              </div>
              <h1>{detail.title}</h1>
              <p>{detail.description}</p>
              <div className="detail-hero-meta">
                <span>
                  <Clock3 size={14} style={{ verticalAlign: "middle" }} />{" "}
                  {detail.durationHours} hours
                </span>
                <span>
                  <Users size={14} style={{ verticalAlign: "middle" }} />{" "}
                  {detail.enrolled} enrolled
                </span>
                <span>
                  <Star
                    size={14}
                    fill="currentColor"
                    style={{ verticalAlign: "middle", color: "var(--sun)" }}
                  />{" "}
                  {detail.rating.toFixed(1)} rating
                </span>
              </div>
            </div>
            <div className="detail-layout">
              <div className="surface pad">
                <div className="panel-title">
                  <h2>What you will be able to do</h2>
                  <Target size={19} color="hsl(var(--primary))" />
                </div>
                <div className="objectives">
                  {detail.objectives.map((objective) => (
                    <div className="objective" key={objective}>
                      <CheckCircle2 className="check-icon" size={16} />
                      <span>{objective}</span>
                    </div>
                  ))}
                </div>
                <div className="panel-title" style={{ marginTop: 34 }}>
                  <h2>Course path</h2>
                  <span className="pill">
                    {detail.modules.filter((module) => module.completed).length}
                    /{detail.modules.length} complete
                  </span>
                </div>
                <div className="module-list">
                  {detail.modules.map((module, index) => (
                    <div className="module-row" key={module.id}>
                      <span
                        className={`module-number ${module.completed ? "module-done" : ""}`}
                      >
                        {module.completed ? <Check size={13} /> : index + 1}
                      </span>
                      <strong>{module.title}</strong>
                      <span>{module.durationMinutes} min</span>
                    </div>
                  ))}
                </div>
              </div>
              <aside className="surface pad">
                <div className="panel-title">
                  <h2>Your next move</h2>
                  <Sparkles size={18} color="#b08318" />
                </div>
                <p
                  style={{
                    color: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                    lineHeight: 1.6,
                  }}
                >
                  A focused course is most useful when it connects back to a
                  real capability gap.
                </p>
                {detail.progress > 0 && (
                  <div style={{ margin: "18px 0" }}>
                    <div className="competency-name">
                      <span>Your progress</span>
                      <span>{detail.progress}%</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${detail.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                {detail.progress >= 100 ? (
                  <Link
                    href="/trainee/certificates"
                    className="btn btn-primary"
                    style={{ width: "100%", marginTop: 14 }}
                    data-testid="link-course-certificate"
                  >
                    <Award size={15} /> View certificate
                  </Link>
                ) : detail.progress > 0 || enrolled ? (
                  <Link
                    href={`/trainee/courses/${id}`}
                    className="btn btn-primary"
                    style={{ width: "100%", marginTop: 14 }}
                    data-testid="link-continue-learning"
                  >
                    Continue learning <ArrowRight size={14} />
                  </Link>
                ) : (
                  <button
                    className="btn btn-primary"
                    style={{ width: "100%", marginTop: 14 }}
                    disabled={enroll.isPending}
                    onClick={doEnroll}
                    data-testid="button-enroll-course"
                  >
                    {enroll.isPending ? (
                      "Enrolling…"
                    ) : (
                      <>
                        <GraduationCap size={15} /> Enrol me
                      </>
                    )}
                  </button>
                )}
                <div
                  style={{
                    marginTop: 24,
                    paddingTop: 18,
                    borderTop: "1px solid hsl(var(--border))",
                  }}
                >
                  <div className="eyebrow">Next live session</div>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      margin: "8px 0 18px",
                    }}
                  >
                    {detail.nextSession}
                  </p>
                  <div className="trainer-card">
                    <span className="trainer-avatar">
                      {initials(detail.trainer)}
                    </span>
                    <div>
                      <strong>{detail.trainer}</strong>
                      <span>{detail.trainerBio}</span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </QueryState>
      {flash && <Flash message={flash} onClose={() => setFlash("")} />}
    </Shell>
  );
}

