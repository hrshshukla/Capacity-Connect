import { useEffect, useState } from "react";
import { useLocation, Redirect } from "wouter";
import { supabase } from "@/lib/supabase";
import { completeAdminInvitation, getAdminInvitation, type AdminInvitationDetails } from "@/lib/auth-api";
import { PasswordInput } from "@/components/common";
import { getUserFriendlyError } from "@/lib/error-message";

export function AdminAccountSetupPage() {
  const [, setLocation] = useLocation();
  const [invitation, setInvitation] = useState<AdminInvitationDetails | null>(null);
  const [id, setId] = useState(""); const [error, setError] = useState(""); const [pending, setPending] = useState(false);
  const [form, setForm] = useState({ department: "", title: "", bio: "", qualifications: "", interests: "", experienceYears: 0, password: "", confirm: "" });
  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data }) => {
      const invitationId = typeof data.session?.user.user_metadata?.invitation_id === "string" ? data.session.user.user_metadata.invitation_id : "";
      if (!data.session || !invitationId) { setError("This invitation link is invalid."); return; }
      try { setId(invitationId); setInvitation(await getAdminInvitation(invitationId)); } catch (caught) { setError(getUserFriendlyError(caught, "This invitation is invalid or expired.")); }
    });
  }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    if (form.password.length < 8 || form.password !== form.confirm) { setError("Passwords must match and be at least 8 characters."); return; }
    setPending(true);
    try {
      const { error: passwordError } = await supabase.auth.updateUser({ password: form.password });
      if (passwordError) throw new Error(passwordError.message);
      await completeAdminInvitation(id, {
        department: form.department,
        title: form.title,
        bio: form.bio,
        qualifications: form.qualifications,
        interests: form.interests,
        experienceYears: form.experienceYears,
      });
      await supabase.auth.signOut(); setLocation("/auth");
    } catch (caught) { setError(getUserFriendlyError(caught, "Unable to complete account setup.")); } finally { setPending(false); }
  }
  if (!invitation && !error) return <div className="loading-stack page-wrap"><div className="skeleton" /></div>;
  return <div className="auth-page"><div className="auth-card surface"><div className="eyebrow">Administrator invitation</div><h1>Set up your account.</h1>{error && <div className="auth-error">{error}</div>}{invitation && <form className="form-stack" onSubmit={submit}>
    <label className="form-field"><span>Name</span><input className="input" value={invitation.name} readOnly /></label>
    <label className="form-field"><span>Email</span><input className="input" value={invitation.email} readOnly /></label>
    {(["department", "title", "bio", "qualifications", "interests"] as const).map(key => <label className="form-field" key={key}><span>{key[0].toUpperCase() + key.slice(1)}</span><textarea className="input textarea" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required={key === "department" || key === "title"} /></label>)}
    <label className="form-field"><span>Experience (years)</span><input className="input" type="number" min="0" value={form.experienceYears} onChange={e => setForm({ ...form, experienceYears: Number(e.target.value) })} /></label>
     <label className="form-field"><span>Password</span><PasswordInput minLength={8} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></label>
     <label className="form-field"><span>Confirm password</span><PasswordInput minLength={8} value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required /></label>
    <button className="btn btn-primary" disabled={pending}>{pending ? "Creating…" : "Create account"}</button>
  </form>}</div></div>;
}