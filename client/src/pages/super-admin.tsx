import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { X } from "lucide-react";
import { createAdminInvitation, getSuperAdminStatus, listAdminInvitations, resendAdminInvitation } from "@/lib/admin-api";
import { AdminFrame, AdminHeader } from "./admin";
import { getUserFriendlyError } from "@/lib/error-message";

export function SuperAdminPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const status = useQuery({ queryKey: ["super-admin-status"], queryFn: getSuperAdminStatus });
  const invitations = useQuery({ queryKey: ["admin-invitations"], queryFn: listAdminInvitations, refetchInterval: 5000 });
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [open, setOpen] = useState(false);
  const invite = useMutation({
    mutationFn: () => createAdminInvitation({ name, email }),
    onSuccess: () => {
      setOpen(false); setName(""); setEmail("");
      void queryClient.invalidateQueries({ queryKey: ["admin-invitations"] });
    },
  });
  const resend = useMutation({
    mutationFn: resendAdminInvitation,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin-invitations"] }),
  });
  useEffect(() => {
    if (status.isError || (status.isSuccess && !status.data.allowed)) setLocation("/account/profile");
  }, [setLocation, status.data?.allowed, status.isError, status.isSuccess]);
  if (status.isLoading) return <AdminFrame><div className="admin-loading"><div className="skeleton" /></div></AdminFrame>;
  if (status.isError || !status.data?.allowed) return null;
  return <AdminFrame>
    <AdminHeader eyebrow="Super administrator" title="Administrator access" description="Invite trusted administrators to Capacity Connect." action={<button className="btn btn-primary" onClick={() => setOpen(true)}>Create Admin</button>} />
    {invite.isSuccess && <div className="auth-message">Invitation sent successfully.</div>}
     <section className="admin-card-list">
       {invitations.isLoading ? <div className="admin-loading"><div className="skeleton" /></div> : invitations.data?.map((invitation) => (
         <article className="surface admin-list-card" key={invitation.id}>
           <div><h3>{invitation.name}</h3><p>{invitation.email}</p></div>
           <div className="admin-card-side">
             <span className={`pill status-${invitation.status.toLowerCase()}`}>{invitation.status === "COMPLETED" ? "Completed" : "Pending"}</span>
             <button className="btn btn-small btn-outline" disabled={invitation.status === "COMPLETED" || resend.isPending} onClick={() => resend.mutate(invitation.id)}>
               {resend.isPending ? "Sending…" : "Resend link"}
             </button>
           </div>
         </article>
       ))}
       {!invitations.isLoading && !invitations.data?.length && <div className="admin-empty">No administrator invitations yet.</div>}
     </section>
     {resend.error && <div className="auth-error">{getUserFriendlyError(resend.error, "Unable to resend the invitation.")}</div>}
    {open && <div className="modal-backdrop" role="presentation"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="invite-admin-title">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div><div className="eyebrow">Super administrator</div><h2 id="invite-admin-title">Invite administrator</h2><p>Send an administrator setup link by email.</p></div>
        <button className="text-button" onClick={() => setOpen(false)} aria-label="Close invitation modal"><X size={18} /></button>
      </div>
      <div className="form-grid">
        <label className="form-field"><span>Admin name</span><input className="input" value={name} onChange={e => setName(e.target.value)} required /></label>
        <label className="form-field"><span>Admin email</span><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
      </div>
       {invite.error && <div className="auth-error">{getUserFriendlyError(invite.error, "Unable to send the invitation.")}</div>}
      <div className="modal-actions"><button className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={invite.isPending || !name.trim() || !email.trim()} onClick={() => invite.mutate()}>{invite.isPending ? "Sending…" : "Send invitation"}</button></div>
    </div></div>}
   </AdminFrame>;
}