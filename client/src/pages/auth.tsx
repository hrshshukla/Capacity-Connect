import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Link, Redirect, useLocation } from "wouter";
import { Shell } from "@/components/layout";
import { PasswordInput } from "@/components/common";
import { getUserFriendlyError } from "@/lib/error-message";
export function AuthPage() {
  const { user, login, signup } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "TRAINEE" as "TRAINEE" | "TRAINER",
  });
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (user)
      setLocation(
        user.role === "ADMIN"
          ? "/admin/dashboard"
          : user.approvalStatus === "APPROVED"
            ? "/trainee/dashboard"
            : "/account/profile",
      );
  }, [setLocation, user]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const session =
        mode === "login"
          ? await login(form.email, form.password)
          : await signup(form);
      if (session.requiresEmailVerification) {
        setPendingVerification(true);
        return;
      }
      if (session.user)
        setLocation(
          session.user.role === "ADMIN"
            ? "/admin/dashboard"
            : session.user.approvalStatus === "APPROVED"
              ? "/trainee/dashboard"
              : "/account/profile",
        );
    } catch (caught) {
      setError(getUserFriendlyError(caught, "We could not complete that request."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card surface">
        <div className="eyebrow">Capacity Connect access</div>
        <h1>
          {mode === "login" ? "Welcome back." : "Join the capability network."}
        </h1>
        <p className="auth-intro">
          {mode === "login"
            ? "Sign in to continue your learning and competency journey."
            : "Create a trainee or trainer account. An administrator will review your access before learning features open."}
        </p>
        {pendingVerification ? (
          <div className="auth-message" data-testid="status-email-verification">
            Check your inbox to verify your email, then return here to sign in.
          </div>
        ) : (
          <form onSubmit={submit} className="form-stack">
            {mode === "signup" && (
              <div className="form-field">
                <label htmlFor="auth-name">Full name</label>
                <input
                  id="auth-name"
                  className="input"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  required
                  data-testid="input-auth-name"
                />
              </div>
            )}
            <div className="form-field">
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                className="input"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                required
                data-testid="input-auth-email"
              />
            </div>
            <div className="form-field">
              <label htmlFor="auth-password">Password</label>
              <PasswordInput
                id="auth-password"
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                minLength={8}
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
                required
                data-testid="input-auth-password"
              />
            </div>
            {mode === "signup" && (
              <div className="form-field">
                <label htmlFor="auth-role">I am joining as</label>
                <select
                  id="auth-role"
                  className="select"
                  value={form.role}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      role: event.target.value as "TRAINEE" | "TRAINER",
                    })
                  }
                  data-testid="select-auth-role"
                >
                  <option value="TRAINEE">Trainee</option>
                  <option value="TRAINER">Trainer</option>
                </select>
              </div>
            )}
            {error && (
              <div className="auth-error" role="alert" data-testid="error-auth">
                {error}
              </div>
            )}
            <button
              className="btn btn-primary"
              type="submit"
              disabled={pending}
              data-testid="button-auth-submit"
            >
              {pending
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}{" "}
              <ArrowRight size={15} />
            </button>
          </form>
        )}
        <button
          className="text-button auth-switch"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
            setPendingVerification(false);
          }}
          data-testid="button-auth-switch"
        >
          {mode === "login"
            ? "Need an account? Create one"
            : "Already have an account? Sign in"}
        </button>
        <Link href="/" className="text-button auth-home">
          Return to public overview
        </Link>
      </div>
    </div>
  );
}

export function PendingPage() {
  const { user } = useAuth();
  return (
    <Shell>
      <div className="auth-card surface pending-card animate-in">
        <div className="eyebrow">Access review</div>
        <h1>Your profile is under review.</h1>
        <p>
          Thanks for joining Capacity Connect, {user?.name}. An administrator
          needs to approve your {user?.role.toLowerCase()} account before
          protected learning data is available.
        </p>
        <div className="approval-status-card">
          <ShieldCheck size={22} />
          <div>
            <strong>Status: {user?.approvalStatus}</strong>
            <span>
              Complete your profile now so the learning team has the context
              they need.
            </span>
          </div>
        </div>
        <Link href="/account/profile" className="btn btn-primary">
          Complete my profile <ArrowRight size={15} />
        </Link>
      </div>
    </Shell>
  );
}

export function ProtectedRoute({
  children,
  roles,
  allowPending = false,
}: {
  children: ReactNode;
  roles?: Array<"TRAINEE" | "TRAINER" | "ADMIN">;
  allowPending?: boolean;
}) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="loading-stack page-wrap">
        <div className="skeleton" style={{ height: 150 }} />
        <div className="skeleton" style={{ height: 220 }} />
      </div>
    );
  if (!user) return <Redirect to="/auth" />;
  if (roles && !roles.includes(user.role))
    return <Redirect to="/account/profile" />;
  if (!allowPending && user.approvalStatus !== "APPROVED")
    return <PendingPage />;
  return <>{children}</>;
}

