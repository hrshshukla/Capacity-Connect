import { Activity, ArrowRight, Bell, BookOpen, CheckCircle2 } from "lucide-react";
import { useGetTraineeDashboard, type Course, type Competency, type CompetencyGap } from "@/lib/api-client-react";
import { Link } from "wouter";
import { EmptyState, QueryState } from "@/components/common";
import { Shell } from "@/components/layout";
export function Dashboard() {
  const query = useGetTraineeDashboard();
  const dash = query.data;
  return (
    <Shell>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        retry={() => query.refetch()}
        label="dashboard"
      >
        {dash && (
          <div className="animate-in">
            <div className="content-header">
              <div>
                <div className="eyebrow">Personal workspace</div>
                <h1>Good morning, {dash.user.name.split(" ")[0]}.</h1>
                <p>
                  Your capability signal is clear enough for a good next move.
                </p>
              </div>
              <div className="content-actions">
                <Link
                  href="/trainee/notifications"
                  className="btn btn-outline"
                  data-testid="link-dashboard-notifications"
                >
                  <Bell size={15} />{" "}
                  {dash.notifications.filter((item) => !item.read).length}{" "}
                  updates
                </Link>
                <Link
                  href="/courses"
                  className="btn btn-dark"
                  data-testid="link-dashboard-catalogue"
                >
                  Find learning <ArrowRight size={15} />
                </Link>
              </div>
            </div>
            <div className="metric-grid">
              {[
                ["Enrolled", dash.stats.enrolledCourses, "courses in motion"],
                ["Active", dash.stats.activeCourses, "keep the rhythm"],
                ["Completed", dash.stats.completedCourses, "evidence earned"],
                ["Certificates", dash.stats.certificates, "ready to share"],
              ].map(([label, value, note], index) => (
                <div
                  className={`surface metric-card animate-in delay-${index + 1}`}
                  key={label as string}
                >
                  <span className="metric-label">{label}</span>
                  <strong
                    className="metric-value"
                    data-testid={`metric-${String(label).toLowerCase()}`}
                  >
                    {value}
                  </strong>
                  <span className="metric-note">{note}</span>
                </div>
              ))}
            </div>
            <div className="dashboard-grid">
              <div className="surface pad">
                <div className="panel-title">
                  <h2>Recommended for your next move</h2>
                  <Link
                    href="/courses"
                    data-testid="link-dashboard-recommendations"
                  >
                    View catalogue{" "}
                    <ArrowRight size={13} style={{ verticalAlign: "middle" }} />
                  </Link>
                </div>
                <div className="course-list">
                  {dash.recommendations.length ? (
                    dash.recommendations
                      .slice(0, 4)
                      .map((course, index) => (
                        <CourseRow
                          course={course}
                          key={course.id}
                          delay={index}
                        />
                      ))
                  ) : (
                    <EmptyState
                      icon={<BookOpen />}
                      title="Your learning map is taking shape"
                      text="Complete a competency check to reveal tailored learning."
                      action={
                        <Link
                          href="/trainee/competencies"
                          className="btn btn-outline"
                        >
                          Review competencies
                        </Link>
                      }
                    />
                  )}
                </div>
              </div>
              <div className="surface pad">
                <div className="panel-title">
                  <h2>Capability pulse</h2>
                  <Link
                    href="/trainee/competencies"
                    data-testid="link-view-competencies"
                  >
                    Full view{" "}
                    <ArrowRight size={13} style={{ verticalAlign: "middle" }} />
                  </Link>
                </div>
                <div className="competency-list">
                  {dash.competencies.slice(0, 4).map((item) => (
                    <CompetencyBar item={item} key={item.id} />
                  ))}
                </div>
              </div>
            </div>
            <div className="split-grid" style={{ marginTop: 16 }}>
              <div className="surface pad">
                <div className="panel-title">
                  <h2>Priority gaps</h2>
                  <span className="pill high">
                    {dash.gaps.length} to work on
                  </span>
                </div>
                {dash.gaps.length ? (
                  dash.gaps
                    .slice(0, 3)
                    .map((gap) => <GapRow gap={gap} key={gap.id} />)
                ) : (
                  <EmptyState
                    icon={<CheckCircle2 />}
                    title="No active gaps"
                    text="Your current competency evidence is meeting requirements."
                  />
                )}
              </div>
              <div className="surface pad">
                <div className="panel-title">
                  <h2>Recent activity</h2>
                  <Activity size={19} color="hsl(var(--primary))" />
                </div>
                <ActivityList activity={dash.activity} />
              </div>
            </div>
          </div>
        )}
      </QueryState>
    </Shell>
  );
}

export function CourseRow({ course, delay = 0 }: { course: Course; delay?: number }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className={`course-row animate-in delay-${delay + 1}`}
      data-testid={`card-course-${course.id}`}
    >
      <span
        className="course-swatch"
        style={{ "--swatch": course.thumbnailTone } as React.CSSProperties}
      />
      <div className="course-row-main">
        <div className="course-row-title">{course.title}</div>
        <div className="course-row-meta">
          <span>{course.subject}</span>
          <span>{course.durationHours}h</span>
          <span>{course.trainer}</span>
        </div>
      </div>
      <div className="course-progress">
        <label>{course.progress}%</label>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${course.progress}%` }}
          />
        </div>
      </div>
      <ArrowRight size={15} color="hsl(var(--muted-foreground))" />
    </Link>
  );
}

export function CompetencyBar({ item }: { item: Competency }) {
  return (
    <div className="competency-item" data-testid={`competency-${item.id}`}>
      <div>
        <div className="competency-name">
          <span>{item.name}</span>
          <span className="competency-level">
            Level {item.level} · {item.levelTitle}
          </span>
        </div>
        <div className="competency-bar">
          <span style={{ width: `${item.score}%`, background: item.color }} />
        </div>
      </div>
      <span className={`trend ${item.trend >= 0 ? "up" : "down"}`}>
        {item.trend >= 0 ? "+" : ""}
        {item.trend} pts
      </span>
    </div>
  );
}

export function GapRow({ gap }: { gap: CompetencyGap }) {
  return (
    <div
      className="gap-item"
      style={
        {
          "--gap-color":
            gap.priority.toLowerCase() === "high" ? "#d56e4f" : "#e1bc38",
        } as React.CSSProperties
      }
      data-testid={`gap-${gap.id}`}
    >
      <div>
        <h3>{gap.name}</h3>
        <p>
          Level {gap.currentLevel} → {gap.requiredLevel} · Suggested:{" "}
          {gap.recommendedCourse}
        </p>
      </div>
      <span className={`pill ${gap.priority.toLowerCase()}`}>
        {gap.priority}
      </span>
    </div>
  );
}

export function ActivityList({
  activity,
}: {
  activity: {
    id: string;
    label: string;
    detail: string;
    time: string;
    tone: string;
  }[];
}) {
  if (!activity.length)
    return (
      <EmptyState
        icon={<Activity />}
        title="No activity yet"
        text="Your learning activity will appear here."
      />
    );
  return (
    <div className="activity-list">
      {activity.slice(0, 5).map((item) => (
        <div
          className="activity-item"
          key={item.id}
          data-testid={`activity-${item.id}`}
        >
          <span className="activity-dot" style={{ background: item.tone }} />
          <div className="activity-copy">
            <strong>{item.label}</strong>
            <span>{item.detail}</span>
          </div>
          <span className="activity-time">{item.time}</span>
        </div>
      ))}
    </div>
  );
}

