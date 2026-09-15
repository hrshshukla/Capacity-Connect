import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ShieldCheck } from "lucide-react";
import { type Certificate } from "@/lib/capacity-api";
import { getTraineeProfile, updateTraineeProfile } from "@/lib/trainee-api";
import { createAvatarUpload, updateProfile, type UserProfile } from "@/lib/auth-api";
import { useAuth } from "@/lib/auth-context";
import { Flash, initials } from "@/components/common";
import { Shell } from "@/components/layout";
import { getUserFriendlyError } from "@/lib/error-message";
export function ProfilePage() {
  const { user, reload } = useAuth();
  const [form, setForm] = useState({
    name: "",
    department: "",
    title: "",
    bio: "",
    qualifications: "",
    interests: "",
    experienceYears: 0,
  });
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [avatarPending, setAvatarPending] = useState(false);

  useEffect(() => {
    if (user)
      setForm({
        name: user.name,
        department: user.department,
        title: user.title,
        bio: user.bio,
        qualifications: user.qualifications,
        interests: user.interests,
        experienceYears: user.experienceYears,
      });
  }, [user]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await updateProfile(form);
      await reload();
      setFlash(
        "Profile saved. Your information is ready for the learning team.",
      );
    } catch (caught) {
      setError(getUserFriendlyError(caught, "We could not save your profile."));
    } finally {
      setPending(false);
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setError("Choose an image smaller than 5 MB.");
      return;
    }
    setAvatarPending(true);
    setError("");
    try {
      const upload = await createAvatarUpload();
      const response = await fetch(upload.signedUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("The avatar upload failed.");
      await reload();
      setFlash("Profile photo uploaded securely to Supabase Storage.");
    } catch (caught) {
      setError(getUserFriendlyError(caught, "We could not upload that image."));
    } finally {
      setAvatarPending(false);
      event.target.value = "";
    }
  }

  return (
    <Shell>
      <div className="content-header animate-in">
        <div>
          <div className="eyebrow">Your identity record</div>
          <h1>Make your profile useful.</h1>
          <p>
            Keep your experience and interests current so approvals,
            recommendations, and trainer matching have better evidence.
          </p>
        </div>
        <div className="pill">{user?.approvalStatus}</div>
      </div>
      <form
        className="surface pad profile-form animate-in delay-1"
        onSubmit={save}
      >
        <div className="panel-title">
          <h2>Profile details</h2>
          <span className="eyebrow">{user?.role}</span>
        </div>
        <div className="profile-avatar-upload">
          <span className="avatar avatar-large">
            {initials(user?.name ?? "")}
          </span>
          <div>
            <strong>Profile photo</strong>
            <span>
              Stored privately in Supabase Storage. JPG, PNG, or WebP up to 5
              MB.
            </span>
          </div>
          <label className="btn btn-outline btn-small">
            {avatarPending ? "Uploading…" : "Upload photo"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={uploadAvatar}
              hidden
              disabled={avatarPending}
              data-testid="input-profile-avatar"
            />
          </label>
        </div>
        <div className="split-grid">
          <div className="form-field">
            <label htmlFor="profile-name">Full name</label>
            <input
              id="profile-name"
              className="input"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              required
              data-testid="input-profile-name"
            />
          </div>
          <div className="form-field">
            <label>Email</label>
            <input
              className="input"
              value={user?.email ?? ""}
              disabled
              data-testid="input-profile-email"
            />
          </div>
        </div>
        <div className="split-grid">
          <div className="form-field">
            <label htmlFor="profile-department">Department</label>
            <input
              id="profile-department"
              className="input"
              value={form.department}
              onChange={(event) =>
                setForm({ ...form, department: event.target.value })
              }
              data-testid="input-profile-department"
            />
          </div>
          <div className="form-field">
            <label htmlFor="profile-title">Current title</label>
            <input
              id="profile-title"
              className="input"
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              data-testid="input-profile-title"
            />
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="profile-bio">Short professional summary</label>
          <textarea
            id="profile-bio"
            className="input textarea"
            value={form.bio}
            onChange={(event) => setForm({ ...form, bio: event.target.value })}
            placeholder="What kind of work do you do?"
            data-testid="input-profile-bio"
          />
        </div>
        <div className="split-grid">
          <div className="form-field">
            <label htmlFor="profile-qualifications">Qualifications</label>
            <textarea
              id="profile-qualifications"
              className="input textarea"
              value={form.qualifications}
              onChange={(event) =>
                setForm({ ...form, qualifications: event.target.value })
              }
              placeholder="Degrees, certifications, or specialist training"
              data-testid="input-profile-qualifications"
            />
          </div>
          <div className="form-field">
            <label htmlFor="profile-interests">Learning interests</label>
            <textarea
              id="profile-interests"
              className="input textarea"
              value={form.interests}
              onChange={(event) =>
                setForm({ ...form, interests: event.target.value })
              }
              placeholder="Topics you want to develop"
              data-testid="input-profile-interests"
            />
          </div>
        </div>
        <div className="form-field" style={{ maxWidth: 220 }}>
          <label htmlFor="profile-experience">Years of experience</label>
          <input
            id="profile-experience"
            className="input"
            type="number"
            min={0}
            value={form.experienceYears}
            onChange={(event) =>
              setForm({ ...form, experienceYears: Number(event.target.value) })
            }
            data-testid="input-profile-experience"
          />
        </div>
        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}
        <div className="modal-actions">
          <span className="profile-review-note">
            <ShieldCheck size={15} /> Approval status: {user?.approvalStatus}
          </span>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={pending}
            data-testid="button-save-profile"
          >
            {pending ? "Saving…" : "Save profile"} <Check size={15} />
          </button>
        </div>
      </form>
      {user?.role === "TRAINEE" && <TraineeDetailsForm user={user} />}
      {flash && <Flash message={flash} onClose={() => setFlash("")} />}
    </Shell>
  );
}

export function TraineeDetailsForm({ user }: { user: UserProfile }) {
  const query = useQuery({ queryKey: ["trainee-profile"], queryFn: getTraineeProfile });
  const [form, setForm] = useState({
    phone: "",
    location: "",
    headline: "",
    summary: "",
    qualifications: "",
    experiences: "",
    skills: "",
    interests: "",
    certificates: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const data = query.data;
    if (!data) return;
    setForm({
      phone: data.profile.phone,
      location: data.profile.location,
      headline: data.profile.headline,
      summary: data.profile.summary,
      qualifications: data.qualifications.map((item) => [item.qualification, item.institution, item.field, item.year ?? "", item.description].join(" | ")).join("\n"),
      experiences: data.experiences.map((item) => [item.role, item.organization, item.startDate, item.endDate, item.description].join(" | ")).join("\n"),
      skills: data.skills.map((item) => `${item.name} | ${item.proficiency}`).join("\n"),
      interests: data.interests.map((item) => item.name).join("\n"),
      certificates: data.certificates.map((item) => [item.name, item.issuer, item.issuedDate, item.credentialUrl].join(" | ")).join("\n"),
    });
  }, [query.data]);

  function lines(value: string) {
    return value.split("\n").map((item) => item.trim()).filter(Boolean);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await updateTraineeProfile({
        user: { name: user.name, department: user.department, title: user.title, bio: user.bio, experienceYears: user.experienceYears },
        phone: form.phone,
        location: form.location,
        headline: form.headline,
        summary: form.summary,
        qualifications: lines(form.qualifications).map((line) => {
          const [qualification = "", institution = "", field = "", year = "", description = ""] = line.split("|").map((part) => part.trim());
          return { qualification, institution, field, year: year ? Number(year) : null, description };
        }),
        experiences: lines(form.experiences).map((line) => {
          const [role = "", organization = "", startDate = "", endDate = "", description = ""] = line.split("|").map((part) => part.trim());
          return { role, organization, startDate, endDate, description };
        }),
        skills: lines(form.skills).map((line) => {
          const [name = "", proficiency = "Working"] = line.split("|").map((part) => part.trim());
          return { name, proficiency };
        }),
        interests: lines(form.interests).map((name) => ({ name })),
        certificates: lines(form.certificates).map((line) => {
          const [name = "", issuer = "", issuedDate = "", credentialUrl = ""] = line.split("|").map((part) => part.trim());
          return { name, issuer, issuedDate, credentialUrl };
        }),
      });
      await query.refetch();
      setMessage("Trainee details saved.");
    } catch (caught) {
      setError(getUserFriendlyError(caught, "We could not save trainee details."));
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="surface pad profile-form trainee-details-form" onSubmit={save}>
      <div className="panel-title">
        <div>
          <h2>Professional profile</h2>
          <p className="section-description">Add one item per line. Use “|” between fields as shown in each placeholder.</p>
        </div>
      </div>
      <div className="split-grid">
        <div className="form-field"><label>Phone</label><input className="input" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
        <div className="form-field"><label>Location</label><input className="input" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></div>
      </div>
      <div className="split-grid">
        <div className="form-field"><label>Professional headline</label><input className="input" value={form.headline} onChange={(event) => setForm({ ...form, headline: event.target.value })} /></div>
        <div className="form-field"><label>Profile summary</label><input className="input" value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} /></div>
      </div>
      <div className="split-grid">
        <ProfileTextarea label="Qualifications" value={form.qualifications} placeholder="M.Sc. Meteorology | IMD Academy | Meteorology | 2024 | Optional notes" onChange={(value) => setForm({ ...form, qualifications: value })} />
        <ProfileTextarea label="Work experience" value={form.experiences} placeholder="Forecast Analyst | IMD | 2022-01 | Present | Optional description" onChange={(value) => setForm({ ...form, experiences: value })} />
      </div>
      <div className="split-grid">
        <ProfileTextarea label="Skills" value={form.skills} placeholder="Numerical modelling | Strong" onChange={(value) => setForm({ ...form, skills: value })} />
        <ProfileTextarea label="Interests" value={form.interests} placeholder="Impact-based forecasting" onChange={(value) => setForm({ ...form, interests: value })} />
      </div>
      <ProfileTextarea label="Certificates" value={form.certificates} placeholder="Certificate name | Issuer | 2024-06-01 | https://optional-link" onChange={(value) => setForm({ ...form, certificates: value })} />
      {error && <div className="auth-error" role="alert">{error}</div>}
      {message && <div className="auth-message" role="status">{message}</div>}
      <div className="modal-actions">
        <span className="profile-review-note"><ShieldCheck size={15} /> Saved to your trainee record</span>
        <button className="btn btn-primary" type="submit" disabled={pending || query.isLoading}>{pending ? "Saving…" : "Save professional details"} <Check size={15} /></button>
      </div>
    </form>
  );
}

export function ProfileTextarea({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return <div className="form-field"><label>{label}</label><textarea className="input textarea" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></div>;
}

