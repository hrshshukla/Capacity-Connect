import { useState, type ReactNode } from "react";
import { Bell, BookOpen, GraduationCap, Menu, Radar, ShieldCheck } from "lucide-react";
import { type Course } from "@/lib/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { Link, useLocation } from "wouter";
import { initials } from "@/components/common";
export function Brand() {
  return (
    <Link href="/" className="brand-lockup" data-testid="link-brand">
      <span className="brand-mark">
        <Radar size={20} />
      </span>
      <span>Capacity Connect</span>
    </Link>
  );
}

export function TopNav({
  user: suppliedUser,
}: {
  user?: { name: string; role: string; avatarInitials?: string };
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user: authUser, logout } = useAuth();
  const user = authUser || suppliedUser;
  return (
    <header className="top-nav">
      <Brand />
      <button
        className="mobile-menu"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="Toggle navigation"
        data-testid="button-toggle-navigation"
      >
        <Menu size={20} />
      </button>
      <nav
        className={menuOpen ? "nav-links mobile-open" : "nav-links"}
        aria-label="Main navigation"
      >
        <Link
          href="/courses"
          className={`nav-link ${location.startsWith("/courses") ? "active" : ""}`}
          data-testid="link-courses"
        >
          Course catalogue
        </Link>
        <Link
          href="/trainee/dashboard"
          className={`nav-link ${location === "/trainee/dashboard" ? "active" : ""}`}
          data-testid="link-dashboard"
        >
          My workspace
        </Link>
        <Link
          href="/trainee/my-learning"
          className={`nav-link ${location.startsWith("/trainee/my-learning") ? "active" : ""}`}
          data-testid="link-my-learning"
        >
          My learning
        </Link>
        <Link
          href="/trainee/assessments"
          className={`nav-link ${location.startsWith("/trainee/assessments") ? "active" : ""}`}
          data-testid="link-assessments"
        >
          Assessments
        </Link>
        <Link
          href="/trainee/competencies"
          className={`nav-link ${location === "/trainee/competencies" ? "active" : ""}`}
          data-testid="link-competencies"
        >
          Competencies
        </Link>
        <Link
          href="/trainee/notifications"
          className={`nav-link ${location === "/trainee/notifications" ? "active" : ""}`}
          data-testid="link-notifications"
        >
          <Bell size={14} /> Updates
        </Link>
        {authUser?.role === "ADMIN" && (
          <Link
            href="/admin/users"
            className={`nav-link ${location.startsWith("/admin") ? "active" : ""}`}
            data-testid="link-admin-users"
          >
            <ShieldCheck size={14} /> Admin
          </Link>
        )}
        {authUser?.role === "TRAINER" && (
          <Link href="/trainer/dashboard" className={`nav-link ${location.startsWith("/trainer") ? "active" : ""}`} data-testid="link-trainer-workspace">
            <GraduationCap size={14} /> Trainer
          </Link>
        )}
        {authUser?.role === "TRAINEE" && (
          <Link href="/trainee/trainer-library" className={`nav-link ${location === "/trainee/trainer-library" ? "active" : ""}`} data-testid="link-trainer-library">
            <BookOpen size={14} /> Trainer library
          </Link>
        )}
      </nav>
      {user ? (
        <div className="nav-user" data-testid="user-profile">
          <Link
            href="/account/profile"
            className="avatar"
            aria-label="Open profile"
          >
            {initials(user.name)}
          </Link>
          <div className="nav-user-copy">
            <strong>{user.name}</strong>
            <span>{user.role}</span>
          </div>
          <button
            className="text-button"
            onClick={() => void logout()}
            data-testid="button-sign-out"
          >
            Sign out
          </button>
        </div>
      ) : (
        <Link href="/auth" className="text-button" data-testid="link-sign-in">
          Sign in
        </Link>
      )}
    </header>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return (
    <div className="app-shell">
      <TopNav user={user ?? undefined} />
      <main className="app-main page-canvas">
        <div className="page-wrap">{children}</div>
      </main>
    </div>
  );
}

