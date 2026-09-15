import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BookOpen, Check, Download, FileText, GraduationCap, Trash2, Upload } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Shell } from "@/components/layout";
import {
  createTrainerLibraryItem,
  createTrainerQuestionnaire,
  deleteTrainerLibraryItem,
  exportTrainerParticipation,
  getLearnerLibraryDownload,
  getTrainerDashboard,
  listLearnerLibrary,
  listTrainerLibrary,
  listTrainerParticipation,
  listTrainerQuestionnaires,
  updateTrainerLibraryItem,
  updateTrainerQuestionnaire,
  uploadTrainerLibraryFile,
} from "@/lib/trainer-api";

function AdminLoading() { return <div className="admin-loading"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>; }
function AdminError({ retry }: { retry: () => void }) { return <div className="error-state"><p>Could not load this trainer view.</p><button className="btn btn-outline" onClick={retry}>Try again</button></div>; }

function TrainerHeader({ title, description }: { title: string; description: string }) {
  return <div className="content-header animate-in"><div><div className="eyebrow">Trainer workspace</div><h1>{title}</h1><p>{description}</p></div><Link className="btn btn-outline" href="/account/profile">Manage profile</Link></div>;
}

export function TrainerConsolePage() {
  const [location] = useLocation();
  if (location.startsWith("/trainer/participation")) return <TrainerParticipationPage />;
  if (location.startsWith("/trainer/questionnaires")) return <TrainerQuestionnairesPage />;
  if (location.startsWith("/trainer/library")) return <TrainerLibraryPage />;
  return <TrainerDashboardPage />;
}

function TrainerDashboardPage() {
  const query = useQuery({ queryKey: ["trainer-dashboard"], queryFn: getTrainerDashboard });
  return <Shell><TrainerHeader title="Keep learning moving." description="Monitor your learners, deadlines, and performance from one trainer workspace." />{query.isLoading ? <AdminLoading /> : query.error ? <AdminError retry={() => query.refetch()} /> : query.data && <><div className="admin-kpi-grid">{[["Courses", query.data.metrics.courses], ["Active learners", query.data.metrics.activeLearners], ["Questionnaires", query.data.metrics.assessments], ["Completion rate", `${query.data.metrics.completionRate}%`], ["Average performance", `${query.data.metrics.averagePerformance}%`]].map(([label, value]) => <div className="surface admin-kpi" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="admin-tabs"><Link href="/trainer/questionnaires">Questionnaires</Link><Link href="/trainer/participation">Participation</Link><Link href="/trainer/library">Trainer library</Link></div><div className="admin-grid-two"><section className="surface admin-panel"><div className="panel-title"><h2>Upcoming deadlines</h2><GraduationCap size={18} /></div>{query.data.upcomingDeadlines.length ? query.data.upcomingDeadlines.map((item) => <div className="activity-item" key={item.id}><div className="activity-copy"><strong>{item.title}</strong><span>Due {new Date(item.deadline).toLocaleDateString()}</span></div></div>) : <div className="admin-empty">No upcoming deadlines.</div>}</section><section className="surface admin-panel"><div className="panel-title"><h2>Recent learner activity</h2><BookOpen size={18} /></div>{query.data.recentActivity.length ? query.data.recentActivity.map((item, index) => <div className="activity-item" key={`${item.trainee}-${item.course}-${index}`}><div className="activity-copy"><strong>{item.trainee}</strong><span>{item.course} · {item.progress}% · {item.status}</span></div></div>) : <div className="admin-empty">No learner activity recorded.</div>}</section></div></>}</Shell>;
}

function TrainerQuestionnairesPage() {
  const [form, setForm] = useState({ title: "", description: "", deadline: "", courseId: "", prompt: "", options: ["", "", "", ""] });
  const query = useQuery({ queryKey: ["trainer-questionnaires"], queryFn: listTrainerQuestionnaires });
  const create = useMutation({ mutationFn: () => createTrainerQuestionnaire({ title: form.title, description: form.description, deadline: form.deadline, courseId: form.courseId, questions: [{ prompt: form.prompt, options: form.options, correctOption: 0 }] }), onSuccess: () => { setForm({ title: "", description: "", deadline: "", courseId: "", prompt: "", options: ["", "", "", ""] }); void query.refetch(); } });
  return <Shell><TrainerHeader title="Questionnaires with clear deadlines." description="Create a multiple-choice questionnaire, set its due date, and track the resulting participation." /><div className="admin-grid-two"><section className="surface admin-panel"><h2>New questionnaire</h2><label className="form-field"><span>Title</span><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label className="form-field"><span>Description</span><textarea className="input textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><div className="split-grid"><label className="form-field"><span>Deadline</span><input className="input" type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></label><label className="form-field"><span>Course ID</span><input className="input" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} /></label></div><label className="form-field"><span>Question</span><textarea className="input textarea" value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} /></label>{form.options.map((option, index) => <label className="form-field" key={index}><span>Option {index + 1}</span><input className="input" value={option} onChange={(e) => setForm({ ...form, options: form.options.map((item, itemIndex) => itemIndex === index ? e.target.value : item) })} /></label>)}<button className="btn btn-primary" disabled={create.isPending || !form.title || !form.prompt || form.options.some((option) => !option)} onClick={() => create.mutate()}>Create questionnaire <Check size={14} /></button></section><section className="admin-card-list">{query.isLoading ? <AdminLoading /> : query.data?.map((item) => <article className="surface admin-list-card" key={item.id}><div><h3>{item.title}</h3><p>{item.description}</p><small>{item.deadline ? `Due ${new Date(item.deadline).toLocaleString()}` : "No deadline"} · {item.status}</small></div><select className="select" value={item.status} onChange={(e) => updateTrainerQuestionnaire(item.id, e.target.value).then(() => query.refetch())}><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></select></article>)}</section></div></Shell>;
}

function TrainerParticipationPage() {
  const [search, setSearch] = useState("");
  const query = useQuery({ queryKey: ["trainer-participation", search], queryFn: () => listTrainerParticipation({ search }) });
  async function downloadCsv() { const csv = await exportTrainerParticipation(); const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "trainer-participation.csv"; anchor.click(); URL.revokeObjectURL(url); }
  return <Shell><TrainerHeader title="Participation and performance." description="Search trainee progress, assessment scores, and completion from your courses." /><div className="admin-toolbar"><input className="input" placeholder="Search trainee or course" value={search} onChange={(e) => setSearch(e.target.value)} /><button className="btn btn-outline" onClick={() => void downloadCsv()}>Export CSV <Download size={14} /></button></div>{query.isLoading ? <AdminLoading /> : query.error ? <AdminError retry={() => query.refetch()} /> : <div className="surface admin-table-wrap"><table className="admin-table"><thead><tr><th>Trainee</th><th>Course</th><th>Progress</th><th>Assessment</th><th>Score</th><th>Status</th></tr></thead><tbody>{query.data?.items.map((item) => <tr key={item.id}><td><strong>{item.trainee}</strong><span>{item.email}</span></td><td>{item.course}</td><td>{item.progress}%</td><td>{item.assessment ?? "—"}</td><td>{item.score == null ? "—" : `${item.score}%`}</td><td>{item.status}</td></tr>)}</tbody></table>{!query.data?.items.length && <div className="admin-empty">No participation records found.</div>}</div>}</Shell>;
}

function TrainerLibraryPage() {
  const [form, setForm] = useState({ title: "", description: "", itemType: "LECTURE", resourceUrl: "", storagePath: "" });
  const query = useQuery({ queryKey: ["trainer-library"], queryFn: listTrainerLibrary });
  const create = useMutation({ mutationFn: () => createTrainerLibraryItem(form), onSuccess: () => { setForm({ title: "", description: "", itemType: "LECTURE", resourceUrl: "", storagePath: "" }); void query.refetch(); } });
  const update = useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => updateTrainerLibraryItem(id, status), onSuccess: () => void query.refetch() });
  const remove = useMutation({ mutationFn: deleteTrainerLibraryItem, onSuccess: () => void query.refetch() });
  async function upload(file: File) { const signed = await uploadTrainerLibraryFile(file.name); const response = await fetch(signed.signedUrl, { method: "PUT", headers: { "content-type": file.type }, body: file }); if (!response.ok) throw new Error("Upload failed."); setForm((current) => ({ ...current, storagePath: signed.path })); }
  return <Shell><TrainerHeader title="Share the right resources." description="Upload recorded lectures, presentations, and study materials for your trainees." /><div className="admin-grid-two"><section className="surface admin-panel"><h2>Add library item</h2><label className="form-field"><span>Title</span><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label className="form-field"><span>Description</span><textarea className="input textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><label className="form-field"><span>Type</span><select className="select" value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value })}><option>LECTURE</option><option>PRESENTATION</option><option>STUDY_MATERIAL</option></select></label><label className="btn btn-outline"><Upload size={14} />{form.storagePath ? "File ready" : "Upload file"}<input type="file" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file); }} /></label><label className="form-field"><span>Or resource URL</span><input className="input" value={form.resourceUrl} onChange={(e) => setForm({ ...form, resourceUrl: e.target.value })} /></label><button className="btn btn-primary" disabled={create.isPending || !form.title} onClick={() => create.mutate()}>Save as draft <Check size={14} /></button></section><section className="admin-card-list">{query.isLoading ? <AdminLoading /> : query.data?.map((item) => <article className="surface admin-list-card" key={item.id}><div><h3>{item.title}</h3><p>{item.description}</p><small>{item.itemType} · {item.status}</small></div><div className="admin-card-side"><select className="select" value={item.status} onChange={(e) => update.mutate({ id: item.id, status: e.target.value })}><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></select><button className="btn btn-small btn-danger" onClick={() => remove.mutate(item.id)}><Trash2 size={13} /></button></div></article>)}</section></div></Shell>;
}

export function TrainerLibraryForLearnersPage() {
  const query = useQuery({ queryKey: ["learner-library"], queryFn: listLearnerLibrary });
  return <Shell><TrainerHeader title="Trainer library." description="Published lectures, presentations, and study materials from your trainers." />{query.isLoading ? <AdminLoading /> : <div className="catalog-grid">{query.data?.map((item) => <article className="surface course-card" key={item.id}><div className="course-body"><div className="eyebrow">{item.itemType.replace("_", " ")}</div><h3>{item.title}</h3><p>{item.description}</p><div className="course-meta"><span>{item.trainerName}</span>{item.storagePath ? <button className="text-button" onClick={async () => { const download = await getLearnerLibraryDownload(item.id); window.open(download.url, "_blank", "noopener,noreferrer"); }}>Download <Download size={13} /></button> : item.resourceUrl ? <a className="text-button" href={item.resourceUrl} target="_blank" rel="noreferrer">Open <FileText size={13} /></a> : null}</div></div></article>)}</div>}</Shell>;
}