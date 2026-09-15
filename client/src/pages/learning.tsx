import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Award, BookOpen, Check, FileText } from "lucide-react";
import { getGetCourseQueryKey, getGetTraineeDashboardQueryKey, useCompleteCourse, useGetCourse, type Course } from "@/lib/api-client-react";
import { completeModule, getLearning, submitFeedback, type LearningItem } from "@/lib/capacity-api";
import { getCourseResources } from "@/lib/trainee-api";
import { Link, useParams } from "wouter";
import { EmptyState, Flash, QueryState } from "@/components/common";
import { Shell } from "@/components/layout";
import { queryClient } from "@/lib/query-client";
export function LearningPage() {
  const query = useQuery({ queryKey: ["learning"], queryFn: getLearning });
  const learning = query.data || [];
  return (
    <Shell>
      <div className="content-header animate-in">
        <div>
          <div className="eyebrow">Learning in motion</div>
          <h1>My learning path.</h1>
          <p>
            Continue from the last completed module and keep evidence connected
            to practice.
          </p>
        </div>
        <Link href="/trainee/assessments" className="btn btn-outline">
          <FileText size={15} /> View assessments
        </Link>
      </div>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        retry={() => query.refetch()}
        label="learning"
      >
        {learning.length ? (
          <div className="learning-grid">
            {learning.map((item, index) => (
              <LearningCard item={item} key={item.id} index={index} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BookOpen />}
            title="No learning enrolled yet"
            text="Choose a course from the catalogue to start your learning path."
            action={
              <Link href="/courses" className="btn btn-dark">
                Browse catalogue <ArrowRight size={14} />
              </Link>
            }
          />
        )}
      </QueryState>
    </Shell>
  );
}

export function LearningCard({ item, index }: { item: LearningItem; index: number }) {
  return (
    <article
      className={`surface learning-card animate-in delay-${Math.min(index + 1, 4)}`}
    >
      <div className="learning-card-top">
        <div
          className="course-swatch"
          style={
            { "--swatch": index % 2 ? "teal" : "indigo" } as React.CSSProperties
          }
        />
        <div>
          <div className="eyebrow">{item.subject}</div>
          <h2>{item.title}</h2>
        </div>
        <span className={`pill ${item.status === "COMPLETED" ? "low" : ""}`}>
          {item.status === "COMPLETED" ? "Completed" : "In progress"}
        </span>
      </div>
      <div className="learning-progress">
        <div className="competency-name">
          <span>{item.progress}% complete</span>
          <span>
            {item.modules.filter((module) => module.completed).length}/
            {item.modules.length} modules
          </span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      </div>
      <p className="learning-next">
        <strong>Next:</strong> {item.nextModule}
      </p>
      <Link href={`/trainee/courses/${item.courseId}`} className="btn btn-dark">
        {item.progress === 100 ? "Review learning" : "Continue learning"}{" "}
        <ArrowRight size={14} />
      </Link>
    </article>
  );
}

export function LearningExperiencePage() {
  const { courseId = "" } = useParams<{ courseId: string }>();
  const courseQuery = useGetCourse(courseId, {
    query: { enabled: !!courseId, queryKey: getGetCourseQueryKey(courseId) },
  });
  const learningQuery = useQuery({
    queryKey: ["learning"],
    queryFn: getLearning,
  });
  const resourcesQuery = useQuery({
    queryKey: ["course-resources", courseId],
    queryFn: () => getCourseResources(courseId),
    enabled: !!courseId,
  });
  const completeModuleMutation = useMutation({ mutationFn: completeModule });
  const completeCourseMutation = useCompleteCourse();
  const feedbackMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof submitFeedback>[1];
    }) => submitFeedback(id, data),
  });
  const detail = courseQuery.data;
  const learning = learningQuery.data?.find(
    (item) => item.courseId === courseId,
  );
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [flash, setFlash] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const selectedModule = detail?.modules.find(
    (module) =>
      module.id ===
      (selectedModuleId ||
        learning?.modules.find((module) => !module.completed)?.id ||
        detail.modules[0]?.id),
  );
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(courseId) });
    queryClient.invalidateQueries({ queryKey: ["learning"] });
    queryClient.invalidateQueries({
      queryKey: getGetTraineeDashboardQueryKey(),
    });
  };
  const markComplete = () => {
    if (!selectedModule) return;
    completeModuleMutation.mutate(selectedModule.id, {
      onSuccess: (result) => {
        invalidate();
        setFlash(
          `${selectedModule.title} marked complete. You are ${result.progress}% through the course.`,
        );
      },
    });
  };
  const finishCourse = () =>
    completeCourseMutation.mutate(
      { courseId },
      {
        onSuccess: () => {
          invalidate();
          setFlash("Course complete. Your certificate is ready.");
          setShowFeedback(true);
        },
      },
    );
  return (
    <Shell>
      <QueryState
         loading={courseQuery.isLoading || learningQuery.isLoading || resourcesQuery.isLoading}
         error={courseQuery.error || learningQuery.error || resourcesQuery.error}
        retry={() => {
          courseQuery.refetch();
          learningQuery.refetch();
           resourcesQuery.refetch();
        }}
        label="learning-experience"
      >
        {detail && (
          <div className="animate-in">
            <Link
              href="/trainee/my-learning"
              className="text-button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 18,
              }}
            >
              <ArrowLeft size={14} /> Back to my learning
            </Link>
            <div className="learning-header">
              <div>
                <div className="eyebrow">
                  {detail.subject} · {detail.durationHours} hours
                </div>
                <h1>{detail.title}</h1>
                <p>
                  Work through each module, then complete the assessment when
                  you are ready.
                </p>
              </div>
              <div className="learning-header-progress">
                <strong>{detail.progress}%</strong>
                <span>course progress</span>
              </div>
            </div>
            <div className="learning-layout">
              <aside className="surface learning-sidebar">
                <div className="panel-title">
                  <h2>Course path</h2>
                  <span className="pill">
                    {detail.modules.filter((module) => module.completed).length}
                    /{detail.modules.length}
                  </span>
                </div>
                {detail.modules.map((module, index) => (
                  <button
                    className={`learning-module ${selectedModule?.id === module.id ? "selected" : ""}`}
                    key={module.id}
                    onClick={() => setSelectedModuleId(module.id)}
                  >
                    <span
                      className={`module-number ${module.completed ? "module-done" : ""}`}
                    >
                      {module.completed ? <Check size={13} /> : index + 1}
                    </span>
                    <span>
                      <strong>{module.title}</strong>
                      <small>{module.durationMinutes} min</small>
                    </span>
                  </button>
                ))}
                <Link
                  href="/trainee/assessments"
                  className="learning-module assessment-link"
                >
                  <span className="module-number">
                    <FileText size={13} />
                  </span>
                  <span>
                    <strong>Assessment</strong>
                    <small>
                      {detail.progress === 100
                        ? "Ready to attempt"
                        : "Complete modules first"}
                    </small>
                  </span>
                </Link>
              </aside>
              <main className="surface pad learning-content">
                {selectedModule && (
                  <>
                    <div className="eyebrow">
                      Module{" "}
                      {detail.modules.findIndex(
                        (module) => module.id === selectedModule.id,
                      ) + 1}
                    </div>
                    <h2>{selectedModule.title}</h2>
                    <p className="content-lead">
                      This learning note connects the concepts to operational
                      decisions. Review the material, reflect on the examples,
                      and mark the module complete when you have finished it.
                    </p>
                    <div className="content-note">
                      <BookOpen size={20} />
                      <div>
                        <strong>Field note</strong>
                        <p>
                          Use this module to build a repeatable understanding of{" "}
                          {detail.subject.toLowerCase()} and record questions
                          for your next training conversation.
                        </p>
                      </div>
                    </div>
                     {(resourcesQuery.data?.filter((resource) => !resource.moduleId || resource.moduleId === selectedModule.id).length ?? 0) > 0 ? (
                       resourcesQuery.data?.filter((resource) => !resource.moduleId || resource.moduleId === selectedModule.id).map((resource) => (
                         <div className="module-resource" key={resource.id}>
                           <div className="resource-icon"><FileText size={18} /></div>
                           <div><strong>{resource.title}</strong><span>{resource.resourceType} · {resource.description || "Course learning resource"}</span></div>
                           {resource.resourceUrl ? <a className="btn btn-outline" href={resource.resourceUrl} target="_blank" rel="noreferrer">Open</a> : <span className="pill">Available</span>}
                         </div>
                       ))
                     ) : (
                       <div className="module-resource">
                         <div className="resource-icon"><FileText size={18} /></div>
                         <div><strong>Core learning material</strong><span>Reading · {selectedModule.durationMinutes} minutes</span></div>
                         <button className="btn btn-outline" onClick={() => setFlash("Learning material opened in this workspace.")}>Open</button>
                       </div>
                     )}
                    <div className="learning-actions">
                      <button
                        className="btn btn-primary"
                        onClick={markComplete}
                        disabled={
                          selectedModule.completed ||
                          completeModuleMutation.isPending
                        }
                      >
                        {completeModuleMutation.isPending
                          ? "Saving…"
                          : selectedModule.completed
                            ? "Module completed"
                            : "Mark module complete"}{" "}
                        <Check size={14} />
                      </button>
                      {detail.progress === 100 && (
                        <button
                          className="btn btn-dark"
                          onClick={finishCourse}
                          disabled={completeCourseMutation.isPending}
                        >
                          {completeCourseMutation.isPending
                            ? "Finishing…"
                            : "Finish course"}{" "}
                          <Award size={14} />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </main>
            </div>
            {showFeedback && (
              <FeedbackForm
                courseId={courseId}
                pending={feedbackMutation.isPending}
                onSubmit={(data) =>
                  feedbackMutation.mutate(
                    { id: courseId, data },
                    {
                      onSuccess: () => {
                        setShowFeedback(false);
                        setFlash("Thank you. Your feedback has been recorded.");
                      },
                    },
                  )
                }
              />
            )}
          </div>
        )}
      </QueryState>
      {flash && <Flash message={flash} onClose={() => setFlash("")} />}
    </Shell>
  );
}

export function FeedbackForm({
  courseId,
  pending,
  onSubmit,
}: {
  courseId: string;
  pending: boolean;
  onSubmit: (data: Parameters<typeof submitFeedback>[1]) => void;
}) {
  const [form, setForm] = useState({
    contentType: "COURSE" as "COURSE" | "CONTENT" | "TRAINER",
    rating: 5,
    contentQuality: 5,
    trainerQuality: 5,
    usefulness: 5,
    comments: "",
  });
  const change = (key: keyof typeof form, value: string) =>
    setForm((current) => ({
      ...current,
      [key]: key === "comments" ? value : Number(value),
    }));
  return (
    <div className="surface pad feedback-panel">
      <div className="eyebrow">Help improve the programme</div>
      <h2>Share course feedback</h2>
      <p>One response per course keeps the learning signal useful.</p>
      <label className="form-field">
        Feedback about
        <select className="select" value={form.contentType} onChange={(event) => setForm({ ...form, contentType: event.target.value as typeof form.contentType })}>
          <option value="COURSE">The course</option>
          <option value="CONTENT">Training content</option>
          <option value="TRAINER">The trainer</option>
        </select>
      </label>
      <div className="feedback-fields">
        {(
          ["rating", "contentQuality", "trainerQuality", "usefulness"] as const
        ).map((key) => (
          <label key={key}>
            {key === "contentQuality"
              ? "Content quality"
              : key === "trainerQuality"
                ? "Trainer quality"
                : key === "usefulness"
                  ? "Usefulness"
                  : "Overall rating"}
            <select
              className="select"
              value={form[key]}
              onChange={(event) => change(key, event.target.value)}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value} / 5
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <label className="form-field">
        Comments
        <textarea
          className="input"
          value={form.comments}
          onChange={(event) => change("comments", event.target.value)}
          placeholder="What should we keep or improve?"
        />
      </label>
      <div className="modal-actions">
        <button
          className="btn btn-dark"
          disabled={pending || !form.comments.trim()}
          onClick={() => onSubmit(form)}
        >
          {pending ? "Submitting…" : "Submit feedback"}
        </button>
      </div>
    </div>
  );
}

