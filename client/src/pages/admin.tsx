import { useState, type ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowLeft, BarChart3, BookOpen, Check, ChevronLeft, ChevronRight, FileCheck2, FileText, LayoutDashboard, ListChecks, Megaphone, Settings, ShieldCheck, SlidersHorizontal, Trash2, UserCheck, Users, X } from "lucide-react";
import {
  createAdminContent,
  deleteAdminContent,
  getAdminDashboard,
  getAdminUser,
  getCompetencyConfig,
  getTrainerMatches,
  listAdminAssessments,
  listAdminAuditLogs,
  listAdminCertificates,
  listAdminContent,
  listAdminCourses,
  listAdminEnrollments,
  listAdminSettings,
  listAdminUsers,
  reviewAdminDocument,
  saveAdminSettings,
  updateAdminContentStatus,
  updateAdminCourseStatus,
  updateAdminUserRole,
  updateAdminUserStatus,
  updateCompetency,
  updateCompetencyLevel,
  updateSubjectRequirement,
  type AdminContent,
  type AdminDocument,
  type ContentKind,
} from "@/lib/admin-api";
import type { ApprovalStatus, UserProfile, UserRole } from "@/lib/auth-api";
import { useAuth } from "@/lib/auth-context";
import { getSuperAdminStatus } from "@/lib/admin-api";

export function AdminFrame({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const superStatus = useQuery({ queryKey: ["super-admin-status"], queryFn: getSuperAdminStatus });
  const nav = [
    ["/admin/dashboard", "Dashboard", LayoutDashboard],
    ["/admin/users", "Users", Users],
    ["/admin/users/pending", "Pending approvals", UserCheck],
    ["/admin/courses", "Courses", BookOpen],
    ["/admin/assessments", "Assessments", ListChecks],
    ["/admin/enrollments", "Enrollments", BarChart3],
    ["/admin/certificates", "Certificates", FileCheck2],
    ["/admin/competencies", "Competencies", SlidersHorizontal],
    ["/admin/content", "Content", Megaphone],
    ["/admin/audit-logs", "Audit logs", FileText],
    ["/admin/settings", "Settings", Settings],
  ] as const;
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link href="/admin/dashboard" className="admin-brand"><ShieldCheck size={20} /> Capacity Connect</Link>
        <div className="admin-sidebar-label">Administration</div>
        <nav className="admin-sidebar-nav">
           {superStatus.data?.allowed && <Link href="/super-admin" className={`admin-sidebar-link ${location === "/super-admin" ? "active" : ""}`}><ShieldCheck size={16} /> Super Admin</Link>}
           {nav.map(([href, label, Icon]) => (
            <Link key={href} href={href} className={`admin-sidebar-link ${location === href || (href === "/admin/users" && location === "/admin/users") ? "active" : ""}`}>
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>
        <Link href="/" className="admin-back-link"><ArrowLeft size={15} /> Back to application</Link>
      </aside>
      <section className="admin-main">
        <header className="admin-mobile-header"><Link href="/admin/dashboard" className="admin-brand"><ShieldCheck size={18} /> Admin</Link><Link href="/" className="text-button">Exit</Link></header>
        <div className="admin-content">{children}</div>
      </section>
    </div>
  );
}

export function AdminHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="admin-page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function AdminDashboard() {
  const query = useQuery({ queryKey: ["admin-dashboard"], queryFn: getAdminDashboard });
  const metrics = query.data?.metrics ?? {};
  const cards = [
    ["Users", "users"], ["Pending approvals", "pendingApprovals"], ["Trainees", "trainees"], ["Trainers", "trainers"],
    ["Courses", "courses"], ["Enrollments", "enrollments"], ["Assessments", "assessments"], ["Certificates", "certificates"],
    ["Course completion", "courseCompletionRate", "%"], ["Active learners", "activeLearners"], ["Assessment average", "assessmentAverageScore", "%"], ["Assessment pass rate", "assessmentPassRate", "%"],
  ];
  return <AdminFrame><AdminHeader eyebrow="Admin dashboard" title="Platform overview" description="Operational metrics from the PostgreSQL-backed admin domain." />
    {query.isLoading ? <AdminLoading /> : query.error ? <AdminError retry={() => query.refetch()} /> : <>
      <div className="admin-kpi-grid">{cards.map(([label, key, suffix = ""]) => <div className="surface admin-kpi" key={key}><span>{label}</span><strong>{metrics[key] ?? 0}{suffix}</strong></div>)}</div>
      <div className="admin-grid-two">
        <section className="surface admin-panel"><h2>User growth</h2><TrendRows rows={query.data?.trends.userGrowth ?? []} /></section>
        <section className="surface admin-panel"><h2>Enrollment trend</h2><TrendRows rows={query.data?.trends.enrollments ?? []} /></section>
        <section className="surface admin-panel"><h2>Certificate issuance</h2><TrendRows rows={query.data?.trends.certificates ?? []} /></section>
        <section className="surface admin-panel"><h2>Course completion</h2><BreakdownRows rows={query.data?.breakdowns.courseCompletion ?? []} label={(row) => row.title} value={(row) => `${row.completed}/${row.total}`} /></section>
        <section className="surface admin-panel"><h2>Assessment performance</h2><BreakdownRows rows={query.data?.breakdowns.assessmentPerformance ?? []} label={(row) => row.title} value={(row) => `${Number(row.average_score).toFixed(1)}% avg · ${row.passed}/${row.attempts} passed`} /></section>
        <section className="surface admin-panel"><h2>Participation by department</h2><BreakdownRows rows={query.data?.breakdowns.participationByDepartment ?? []} label={(row) => row.department} value={(row) => `${row.completed}/${row.enrollments} completed`} /></section>
      </div>
      <section className="surface admin-panel admin-summary"><h2>Participation</h2><strong>{metrics.participationRate ?? 0}%</strong><span>{metrics.incompleteEnrollments ?? 0} incomplete enrollments across {metrics.activeLearners ?? 0} active learners</span></section>
    </>}</AdminFrame>;
}

function TrendRows({ rows }: { rows: Array<{ month: string; value: number }> }) {
  if (!rows.length) return <div className="admin-empty">No activity recorded yet.</div>;
  const max = Math.max(...rows.map((row) => row.value), 1);
  return <div className="trend-list">{rows.map((row) => <div className="trend-row" key={row.month}><span>{row.month}</span><div><i style={{ width: `${Math.max(4, row.value / max * 100)}%` }} /></div><strong>{row.value}</strong></div>)}</div>;
}

function BreakdownRows<T>({ rows, label, value }: { rows: T[]; label: (row: T) => string; value: (row: T) => string }) {
  if (!rows.length) return <div className="admin-empty">No activity recorded yet.</div>;
  return <div className="trend-list">{rows.map((row, index) => <div className="trend-row" key={`${label(row)}-${index}`}><span>{label(row)}</span><div /><strong>{value(row)}</strong></div>)}</div>;
}

function AdminUsers({ pendingOnly = false }: { pendingOnly?: boolean }) {
  const [location, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const tabs = [
    ["all", "All users", ""], ["pending", "Pending", "PENDING"], ["trainee", "Trainees", "TRAINEE"],
    ["trainer", "Trainers", "TRAINER"], ["admin", "Admins", "ADMIN"], ["suspended", "Suspended", "SUSPENDED"],
  ] as const;
  const active = pendingOnly ? "pending" : tabs.find(([key]) => location.includes(`user-filter=${key}`))?.[0] ?? "all";
  const activeStatus = tabs.find(([key]) => key === active)?.[2];
  const users = useQuery({
    queryKey: ["admin-users", search, activeStatus, page],
    queryFn: () => pendingOnly ? import("@/lib/admin-api").then(({ listPendingAdminUsers }) => listPendingAdminUsers(page)) : listAdminUsers({ search, status: activeStatus || undefined, page, pageSize: 20 }),
  });
  const detail = useQuery({ queryKey: ["admin-user", selected], queryFn: () => getAdminUser(selected!), enabled: Boolean(selected) });
  const refresh = () => { void users.refetch(); if (selected) void detail.refetch(); };
  const action = useMutation({
    mutationFn: async (input: { id: string; status?: ApprovalStatus; role?: UserRole }) => input.role ? updateAdminUserRole(input.id, input.role) : updateAdminUserStatus(input.id, input.status!, input.status === "REJECTED" ? window.prompt("Rejection reason") ?? "" : undefined),
    onSuccess: refresh,
  });
  const documentAction = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdminDocument["reviewStatus"] }) => reviewAdminDocument(id, status, status === "REJECTED" ? window.prompt("Document rejection reason") ?? "" : undefined),
    onSuccess: refresh,
  });
  const setTab = (key: string) => { setPage(1); setLocation(key === "all" ? "/admin/users" : `/admin/users?user-filter=${key}`); };
  return <AdminFrame><AdminHeader eyebrow={pendingOnly ? "Review queue" : "User management"} title={pendingOnly ? "Pending approvals" : "Manage access"} description="Review identity, access status, and role changes. Every action is authorized and audited server-side." />
    <div className="admin-tabs">{tabs.map(([key, label]) => <button className={active === key ? "active" : ""} onClick={() => setTab(key)} key={key}>{label}</button>)}</div>
    <div className="admin-toolbar"><input className="input" placeholder="Search name, email or department" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /><span className="admin-count">{users.data?.pagination.total ?? 0} records</span></div>
    {users.isLoading ? <AdminLoading /> : users.error ? <AdminError retry={() => users.refetch()} /> : <div className="surface admin-table-wrap"><table className="admin-table"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>{users.data?.items.map((user) => <tr key={user.id}><td><button className="admin-link-button" onClick={() => setSelected(user.id)}><strong>{user.name}</strong><span>{user.email}</span></button></td><td><select className="select admin-inline-select" value={user.role} onChange={(event) => action.mutate({ id: user.id, role: event.target.value as UserRole })}><option>TRAINEE</option><option>TRAINER</option><option>ADMIN</option></select></td><td><span className={`pill status-${user.approvalStatus.toLowerCase()}`}>{user.approvalStatus}</span></td><td><div className="admin-row-actions"><button className="btn btn-small btn-outline" onClick={() => setSelected(user.id)}>View</button>{user.approvalStatus !== "APPROVED" && <button className="btn btn-small btn-primary" onClick={() => action.mutate({ id: user.id, status: "APPROVED" })}>Approve</button>}{user.approvalStatus === "APPROVED" && <button className="btn btn-small btn-outline" onClick={() => action.mutate({ id: user.id, status: "SUSPENDED" })}>Suspend</button>}{user.approvalStatus === "SUSPENDED" && <button className="btn btn-small btn-primary" onClick={() => action.mutate({ id: user.id, status: "APPROVED" })}>Reactivate</button>}{user.approvalStatus !== "REJECTED" && <button className="btn btn-small btn-danger" onClick={() => action.mutate({ id: user.id, status: "REJECTED" })}>Reject</button>}</div></td></tr>)}</tbody></table>{!users.data?.items.length && <div className="admin-empty">No users match this view.</div>}</div>}
    <AdminPagination page={page} totalPages={users.data?.pagination.totalPages ?? 1} onPage={setPage} />
    {selected && <div className="admin-drawer surface"><button className="admin-close" onClick={() => setSelected(null)}><X size={16} /></button>{detail.isLoading ? <AdminLoading /> : detail.data && <><div className="eyebrow">Profile review</div><h2>{detail.data.profile.name}</h2><p>{detail.data.profile.email}</p><dl className="admin-detail-list"><dt>Status</dt><dd>{detail.data.profile.approvalStatus}</dd><dt>Department</dt><dd>{detail.data.profile.department || "Not provided"}</dd><dt>Title</dt><dd>{detail.data.profile.title || "Not provided"}</dd><dt>Rejection reason</dt><dd>{detail.data.profile.rejectionReason || "—"}</dd></dl><h3>Documents</h3>{detail.data.documents.length ? detail.data.documents.map((document) => <DocumentRow key={document.id} document={document} pending={documentAction.isPending} onReview={(status) => documentAction.mutate({ id: document.id, status })} />) : <div className="admin-empty">No documents submitted.</div>}</>}</div>}
  </AdminFrame>;
}

function DocumentRow({ document, pending, onReview }: { document: AdminDocument; pending: boolean; onReview: (status: AdminDocument["reviewStatus"]) => void }) {
  return <div className="admin-document"><div><strong>{document.title}</strong><span>{document.documentType} · {document.reviewStatus}</span></div>{document.reviewStatus === "PENDING" && <div className="admin-row-actions"><button className="btn btn-small btn-primary" disabled={pending} onClick={() => onReview("VERIFIED")}>Verify</button><button className="btn btn-small btn-danger" disabled={pending} onClick={() => onReview("REJECTED")}>Reject</button></div>}</div>;
}

function AdminMonitoring({ initialTab }: { initialTab: "courses" | "assessments" | "enrollments" | "certificates" }) {
  const [tab, setTab] = useState(initialTab);
  const courses = useQuery({ queryKey: ["admin-courses"], queryFn: listAdminCourses });
  const assessments = useQuery({ queryKey: ["admin-assessments"], queryFn: listAdminAssessments });
  const enrollments = useQuery({ queryKey: ["admin-enrollments"], queryFn: listAdminEnrollments });
  const certificates = useQuery({ queryKey: ["admin-certificates"], queryFn: listAdminCertificates });
  const courseAction = useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => updateAdminCourseStatus(id, status), onSuccess: () => void courses.refetch() });
  const tabs = [["courses", "Courses"], ["assessments", "Assessments"], ["enrollments", "Enrollments"], ["certificates", "Certificates"]] as const;
  return <AdminFrame><AdminHeader eyebrow="Operations" title="Learning operations" description="Monitor and control durable courses, assessments, enrollments, and certificates." /><div className="admin-tabs">{tabs.map(([key, label]) => <button className={tab === key ? "active" : ""} onClick={() => setTab(key)} key={key}>{label}</button>)}</div>
    {tab === "courses" && <DataPanel loading={courses.isLoading} error={courses.error} retry={() => courses.refetch()}><div className="admin-card-list">{courses.data?.map((course) => <article className="surface admin-list-card" key={course.id}><div><span className="eyebrow">{course.difficulty}</span><h3>{course.title}</h3><p>{course.description || "No description provided."}</p></div><div className="admin-card-side"><span className={`pill status-${course.status.toLowerCase()}`}>{course.status}</span><select className="select" value={course.status} onChange={(event) => courseAction.mutate({ id: course.id, status: event.target.value })}><option>DRAFT</option><option>PENDING_REVIEW</option><option>APPROVED</option><option>PUBLISHED</option><option>ARCHIVED</option><option>REJECTED</option></select></div></article>)}</div></DataPanel>}
    {tab === "assessments" && <SimpleRows loading={assessments.isLoading} error={assessments.error} retry={() => assessments.refetch()} headers={["Title", "Status", "Duration", "Pass score"]} rows={(assessments.data ?? []).map((item) => [item.title, item.status, `${item.durationMinutes} min`, `${item.passingScore}%`])} />}
    {tab === "enrollments" && <SimpleRows loading={enrollments.isLoading} error={enrollments.error} retry={() => enrollments.refetch()} headers={["User", "Course", "Progress", "Status"]} rows={(enrollments.data ?? []).map((item) => [item.userId, item.courseId, `${item.progress}%`, item.status])} />}
    {tab === "certificates" && <SimpleRows loading={certificates.isLoading} error={certificates.error} retry={() => certificates.refetch()} headers={["Title", "User", "Course", "Status"]} rows={(certificates.data ?? []).map((item) => [item.title, item.userId, item.courseId, item.status])} />}
  </AdminFrame>;
}

function AdminCompetencies() {
  const config = useQuery({ queryKey: ["admin-competency-config"], queryFn: getCompetencyConfig });
  const [subjectId, setSubjectId] = useState("");
  const [competencyId, setCompetencyId] = useState("");
  const [requiredLevel, setRequiredLevel] = useState(3);
  const [weight, setWeight] = useState(0.2);
  const [mandatory, setMandatory] = useState(false);
  const [matchSubject, setMatchSubject] = useState("");
  const matches = useQuery({ queryKey: ["trainer-matches", matchSubject], queryFn: () => getTrainerMatches(matchSubject), enabled: Boolean(matchSubject) });
  const saveMapping = useMutation({ mutationFn: () => updateSubjectRequirement({ subjectId, competencyId, requiredLevel, weight, mandatory }), onSuccess: () => void config.refetch() });
  const saveLevel = useMutation({ mutationFn: (level: { level: number; title: string; description: string; scoreThreshold: number }) => updateCompetencyLevel(level.level, level), onSuccess: () => void config.refetch() });
  return <AdminFrame><AdminHeader eyebrow="Framework control" title="Competencies and matching" description="Configure competency levels, subject requirements, and inspect database-backed trainer matches." />{config.isLoading ? <AdminLoading /> : config.data && <div className="admin-grid-two"><section className="surface admin-panel"><h2>Competency levels</h2>{config.data.levels.map((level) => <div className="admin-level-row" key={level.level}><strong>L{level.level}</strong><input className="input" value={level.title} onChange={(event) => saveLevel.mutate({ ...level, title: event.target.value })} onBlur={(event) => saveLevel.mutate({ ...level, title: event.target.value })} /><span>from {level.scoreThreshold}</span></div>)}<h2>Competencies</h2>{config.data.competencies.map((item) => <CompetencyRow key={item.id} item={item} onSave={(input) => updateCompetency(item.id, input).then(() => void config.refetch())} />)}</section><section className="surface admin-panel"><h2>Subject requirements</h2><select className="select" value={subjectId} onChange={(event) => setSubjectId(event.target.value)}><option value="">Choose subject</option>{config.data.subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select className="select" value={competencyId} onChange={(event) => setCompetencyId(event.target.value)}><option value="">Choose competency</option>{config.data.competencies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><label className="form-field"><span>Required level</span><input className="input" type="number" min={1} max={5} value={requiredLevel} onChange={(event) => setRequiredLevel(Number(event.target.value))} /></label><label className="form-field"><span>Weight (0–1)</span><input className="input" type="number" min={0} max={1} step={0.05} value={weight} onChange={(event) => setWeight(Number(event.target.value))} /></label><label className="admin-check"><input type="checkbox" checked={mandatory} onChange={(event) => setMandatory(event.target.checked)} /> Mandatory competency</label><button className="btn btn-primary" disabled={!subjectId || !competencyId || saveMapping.isPending} onClick={() => saveMapping.mutate()}>Save requirement <Check size={14} /></button><h2>Trainer matching</h2><select className="select" value={matchSubject} onChange={(event) => setMatchSubject(event.target.value)}><option value="">Choose subject</option>{config.data.subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{matches.data?.matches.map((match) => <div className="match-row" key={match.trainer.id}><span>{match.trainer.name}</span><strong>{match.competencyMatch}%</strong><small>{match.eligible ? "Eligible" : "Missing mandatory competency"}</small></div>)}</section></div>}</AdminFrame>;
}

function CompetencyRow({ item, onSave }: { item: { id: string; name: string; color: string }; onSave: (input: { name: string; color: string }) => void }) {
  const [name, setName] = useState(item.name);
  const [color, setColor] = useState(item.color);
  return <div className="competency-row"><input className="input" value={name} onChange={(event) => setName(event.target.value)} /><input className="input color-input" type="color" value={color} onChange={(event) => setColor(event.target.value)} /><button className="btn btn-small btn-outline" onClick={() => onSave({ name, color })}>Save</button></div>;
}

function AdminContent() {
  const [kind, setKind] = useState<ContentKind>("announcements");
  const emptyForm = { title: "", description: "", imagePath: "", targetAudience: "ALL", notificationType: "GENERAL", achievementDate: "", personOrTeam: "", contentType: "ARTICLE", resourcePath: "", courseId: "" };
  const [form, setForm] = useState(emptyForm);
  const content = useQuery({ queryKey: ["admin-content", kind], queryFn: () => listAdminContent(kind) });
  const updateField = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const create = useMutation({
    mutationFn: () => createAdminContent(kind, {
      ...form,
      achievementDate: form.achievementDate || null,
      imagePath: form.imagePath || null,
      resourcePath: form.resourcePath || null,
      courseId: form.courseId || null,
    }),
    onSuccess: () => { setForm(emptyForm); void content.refetch(); },
  });
  const status = useMutation({ mutationFn: ({ id, value }: { id: string; value: string }) => updateAdminContentStatus(kind, id, value), onSuccess: () => void content.refetch() });
  const remove = useMutation({ mutationFn: (id: string) => deleteAdminContent(kind, id), onSuccess: () => void content.refetch() });
  const labels: Array<[ContentKind, string]> = [["announcements", "Announcements"], ["notifications", "Notifications"], ["achievements", "Achievements"], ["learning-content", "Learning content"]];
  return <AdminFrame><AdminHeader eyebrow="Content management" title="Publish platform content" description="Create, publish, archive, and remove content shown on the public homepage." /><div className="admin-tabs">{labels.map(([key, label]) => <button className={kind === key ? "active" : ""} onClick={() => setKind(key)} key={key}>{label}</button>)}</div><div className="admin-grid-two"><section className="surface admin-panel"><h2>Create {kind.replace("-", " ")}</h2><label className="form-field"><span>Title</span><input className="input" value={form.title} onChange={(event) => updateField("title", event.target.value)} /></label><label className="form-field"><span>Description</span><textarea className="input textarea" value={form.description} onChange={(event) => updateField("description", event.target.value)} /></label>{kind === "announcements" && <><label className="form-field"><span>Target audience</span><select className="select" value={form.targetAudience} onChange={(event) => updateField("targetAudience", event.target.value)}><option>ALL</option><option>TRAINEES</option><option>TRAINERS</option><option>ADMINS</option></select></label><label className="form-field"><span>Image URL</span><input className="input" value={form.imagePath} onChange={(event) => updateField("imagePath", event.target.value)} /></label></>}{kind === "notifications" && <><label className="form-field"><span>Notification type</span><select className="select" value={form.notificationType} onChange={(event) => updateField("notificationType", event.target.value)}><option>GENERAL</option><option>NEW_COURSE</option><option>NEW_ANNOUNCEMENT</option><option>NEW_LIBRARY_CONTENT</option></select></label><label className="form-field"><span>Target audience</span><select className="select" value={form.targetAudience} onChange={(event) => updateField("targetAudience", event.target.value)}><option>ALL</option><option>TRAINEES</option><option>TRAINERS</option><option>ADMINS</option></select></label></>}{kind === "achievements" && <><label className="form-field"><span>Date</span><input className="input" type="date" value={form.achievementDate} onChange={(event) => updateField("achievementDate", event.target.value)} /></label><label className="form-field"><span>Person, team, or organisation</span><input className="input" value={form.personOrTeam} onChange={(event) => updateField("personOrTeam", event.target.value)} /></label><label className="form-field"><span>Image URL</span><input className="input" value={form.imagePath} onChange={(event) => updateField("imagePath", event.target.value)} /></label></>}{kind === "learning-content" && <><label className="form-field"><span>Content type</span><select className="select" value={form.contentType} onChange={(event) => updateField("contentType", event.target.value)}><option>ARTICLE</option><option>RESOURCE</option><option>VIDEO</option><option>GUIDE</option></select></label><label className="form-field"><span>Resource URL</span><input className="input" value={form.resourcePath} onChange={(event) => updateField("resourcePath", event.target.value)} /></label><label className="form-field"><span>Course ID (optional)</span><input className="input" value={form.courseId} onChange={(event) => updateField("courseId", event.target.value)} /></label></>}<button className="btn btn-primary" disabled={!form.title.trim() || create.isPending} onClick={() => create.mutate()}>{create.isPending ? "Creating…" : "Create content"} <Check size={14} /></button></section><section className="admin-card-list">{content.isLoading ? <AdminLoading /> : content.data?.map((item) => <ContentRow key={item.id} item={item} onStatus={(value) => status.mutate({ id: item.id, value })} onDelete={() => { if (window.confirm("Delete this content?")) remove.mutate(item.id); }} />)}</section></div></AdminFrame>;
}

function ContentRow({ item, onStatus, onDelete }: { item: AdminContent; onStatus: (value: string) => void; onDelete: () => void }) {
  return <article className="surface admin-list-card"><div><h3>{item.title}</h3><p>{item.description}</p>{item.personOrTeam && <span>{item.personOrTeam}</span>}{item.publishedAt && <small>Published {new Date(item.publishedAt).toLocaleDateString()}</small>}</div><div className="admin-card-side">{item.status && <select className="select" value={item.status} onChange={(event) => onStatus(event.target.value)}><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></select>}<button className="btn btn-small btn-danger" onClick={onDelete}><Trash2 size={13} /></button></div></article>;
}

function AdminAuditSettings({ settings = false }: { settings?: boolean }) {
  const logs = useQuery({ queryKey: ["admin-audit-logs"], queryFn: listAdminAuditLogs, enabled: !settings });
  const settingsQuery = useQuery({ queryKey: ["admin-settings"], queryFn: listAdminSettings, enabled: settings });
  const [values, setValues] = useState<Record<string, string>>({});
  const save = useMutation({ mutationFn: () => saveAdminSettings(values), onSuccess: () => void settingsQuery.refetch() });
  if (settings) return <AdminFrame><AdminHeader eyebrow="Configuration" title="Admin settings" description="Persisted platform settings, changed only by authorized administrators." /><section className="surface admin-panel admin-settings">{(settingsQuery.data ?? []).map((setting) => <label className="form-field" key={setting.key}><span>{setting.key}</span><input className="input" value={values[setting.key] ?? setting.value} onChange={(event) => setValues({ ...values, [setting.key]: event.target.value })} /></label>)}<label className="form-field"><span>Default announcement audience</span><input className="input" value={values.default_audience ?? "ALL"} onChange={(event) => setValues({ ...values, default_audience: event.target.value })} /></label><button className="btn btn-primary" onClick={() => save.mutate()}>Save settings <Check size={14} /></button></section></AdminFrame>;
  return <AdminFrame><AdminHeader eyebrow="Security trail" title="Audit logs" description="Immutable-by-application records of privileged changes and their actors." /><SimpleRows loading={logs.isLoading} error={logs.error} retry={() => logs.refetch()} headers={["Action", "Entity", "Actor", "When"]} rows={(logs.data ?? []).map((log) => [log.action, `${log.entityType} · ${log.entityId}`, log.actorId, new Date(log.createdAt).toLocaleString()])} /></AdminFrame>;
}

function DataPanel({ loading, error, retry, children }: { loading: boolean; error: unknown; retry: () => void; children: ReactNode }) {
  if (loading) return <AdminLoading />;
  if (error) return <AdminError retry={retry} />;
  return <>{children}</>;
}
function SimpleRows({ loading, error, retry, headers, rows }: { loading: boolean; error: unknown; retry: () => void; headers: string[]; rows: string[][] }) {
  return <DataPanel loading={loading} error={error} retry={retry}><div className="surface admin-table-wrap"><table className="admin-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table>{!rows.length && <div className="admin-empty">No records available.</div>}</div></DataPanel>;
}
function AdminPagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  return <div className="admin-pagination"><button className="btn btn-small btn-outline" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft size={14} /></button><span>Page {page} of {totalPages}</span><button className="btn btn-small btn-outline" disabled={page >= totalPages} onClick={() => onPage(page + 1)}><ChevronRight size={14} /></button></div>;
}
function AdminLoading() { return <div className="admin-loading"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>; }
function AdminError({ retry }: { retry: () => void }) { return <div className="error-state"><p>Could not load this admin view.</p><button className="btn btn-outline" onClick={retry}>Try again</button></div>; }

export function AdminConsolePage() {
  const [location] = useLocation();
  const { user } = useAuth();
  if (user?.role !== "ADMIN") return <AdminFrame><AdminError retry={() => {}} /></AdminFrame>;
  if (location === "/admin/dashboard" || location === "/admin") return <AdminDashboard />;
  if (location.startsWith("/admin/users/pending")) return <AdminUsers pendingOnly />;
  if (location.startsWith("/admin/users")) return <AdminUsers />;
  if (location.startsWith("/admin/competencies")) return <AdminCompetencies />;
  if (location.startsWith("/admin/content") || location.startsWith("/admin/announcements") || location.startsWith("/admin/notifications") || location.startsWith("/admin/achievements")) return <AdminContent />;
  if (location.startsWith("/admin/audit-logs")) return <AdminAuditSettings />;
  if (location.startsWith("/admin/settings")) return <AdminAuditSettings settings />;
  const tab = location.includes("assessments") ? "assessments" : location.includes("enrollments") ? "enrollments" : location.includes("certificates") ? "certificates" : "courses";
  return <AdminMonitoring initialTab={tab} />;
}