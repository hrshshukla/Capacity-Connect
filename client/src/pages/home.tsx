import { ArrowRight, Bell, BookOpen, GraduationCap, Signal, Sparkles, Target, Trophy, Users } from "lucide-react";
import { getHealthCheckQueryKey, useHealthCheck } from "@/lib/api-client-react";
import { getHomepageContent } from "@/lib/capacity-api";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { TopNav } from "@/components/layout";
export function Home() {
  const health = useHealthCheck({
    query: { queryKey: getHealthCheckQueryKey(), staleTime: 60000 },
  });
  const publishedContent = useQuery({ queryKey: ["homepage-content"], queryFn: getHomepageContent, staleTime: 30000 });
  const content = publishedContent.data;
  const contentGroups = content
    ? [
        { label: "Announcements", icon: Bell, items: content.announcements },
        { label: "Notifications", icon: Signal, items: content.notifications },
        { label: "Achievements", icon: Trophy, items: content.achievements },
        { label: "Learning content", icon: BookOpen, items: content.learningContent },
      ].filter((group) => group.items.length)
    : [];
  return (
    <div className="app-shell">
      <TopNav />
      <section className="hero">
        <div className="hero-inner">
          <div className="animate-in">
            <div className="eyebrow" style={{ color: "var(--sun)" }}>
              IMD / MoES capability network
            </div>
            <h1 className="display">Move from a gap to the right signal.</h1>
            <p>
              Capacity Connect turns competency evidence into a clear next step:
              a focused course, a trusted trainer, and a path you can see
              moving.
            </p>
            <div className="hero-actions">
              <Link
                href="/trainee/dashboard"
                className="btn btn-primary"
                data-testid="link-start-workspace"
              >
                Open my workspace <ArrowRight size={16} />
              </Link>
              <Link
                href="/courses"
                className="btn btn-ghost"
                data-testid="link-explore-courses"
              >
                Explore the catalogue
              </Link>
            </div>
          </div>
          <div
            className="hero-orbit animate-in delay-2"
            aria-label="Capability signal illustration"
          >
            <div className="orbit-disc">
              <span className="orbit-core" />
              <span
                className="orbit-satellite satellite-one"
                aria-hidden="true"
              />
              <span
                className="orbit-satellite satellite-two"
                aria-hidden="true"
              />
              <span className="orbit-label one">Capability evidence</span>
              <span className="orbit-label two">Trainer fit 92%</span>
              <span className="orbit-label three">Next best step</span>
            </div>
          </div>
        </div>
      </section>
      {contentGroups.length > 0 && (
        <section className="section homepage-content-section">
          <div className="section-wrap">
            <div className="section-heading">
              <div>
                <div className="eyebrow">From the network</div>
                <h2 className="display">What’s new.</h2>
              </div>
              <p>Published updates, achievements, and learning resources from the Capacity Connect team.</p>
            </div>
            <div className="homepage-content-grid">
              {contentGroups.map((group) => {
                const Icon = group.icon;
                return <section className="surface homepage-content-panel" key={group.label}>
                  <div className="panel-title"><h2>{group.label}</h2><Icon size={19} color="var(--navy)" /></div>
                  <div className="homepage-content-list">{group.items.slice(0, 3).map((item) => <article className="homepage-content-item" key={item.id}><span className="eyebrow">{group.label.slice(0, -1)}</span><h3>{item.title}</h3><p>{item.description}</p>{"personOrTeam" in item && item.personOrTeam && <strong>{item.personOrTeam}</strong>}</article>)}</div>
                </section>;
              })}
            </div>
          </div>
        </section>
      )}
      <div className="trust-strip">
        <div className="trust-inner">
          <span>Designed for work that matters</span>
          <div className="trust-items">
            <span>Indian Meteorological Department</span>
            <span>Ministry of Earth Sciences</span>
            <span>
              {health.isError
                ? "Signal offline"
                : health.isLoading
                  ? "Checking signal"
                  : "System operational"}
            </span>
          </div>
        </div>
      </div>
      <section className="section">
        <div className="section-wrap">
          <div className="section-heading">
            <div>
              <div className="eyebrow">One connected view</div>
              <h2 className="display">Make development feel chosen.</h2>
            </div>
            <p>
              Less guesswork for professionals. More context for the people who
              help them grow.
            </p>
          </div>
          <div className="feature-grid">
            <article className="feature-card large animate-in">
              <div className="feature-icon">
                <Target size={19} />
              </div>
              <h3>Find the capability that changes the work.</h3>
              <p>
                See where your evidence is strong, where it is still forming,
                and which learning move closes the gap with purpose.
              </p>
            </article>
            <article className="feature-card animate-in delay-1">
              <div className="feature-icon">
                <GraduationCap size={19} />
              </div>
              <h3>Learn with context.</h3>
              <p>
                Short, practical programmes mapped to the realities of
                public-service teams.
              </p>
            </article>
            <article className="feature-card animate-in delay-2">
              <div className="feature-icon">
                <Users size={19} />
              </div>
              <h3>Meet the right guide.</h3>
              <p>
                Trainer recommendations grounded in subject fit, experience, and
                your missing signals.
              </p>
            </article>
          </div>
        </div>
      </section>
      <section
        className="section"
        style={{ background: "hsl(var(--secondary))" }}
      >
        <div className="section-wrap">
          <div className="section-heading">
            <div>
              <div className="eyebrow">A calmer operating rhythm</div>
              <h2 className="display">Know what to do next.</h2>
            </div>
            <Link
              href="/trainee/dashboard"
              className="btn btn-dark"
              data-testid="link-see-dashboard"
            >
              See the workspace <ArrowRight size={15} />
            </Link>
          </div>
          <div className="split-grid">
            <div className="surface pad">
              <div className="panel-title">
                <h2>Capability pulse</h2>
                <Signal size={20} color="var(--navy)" />
              </div>
              <div className="competency-list">
                <DemoBar
                  label="Forecast interpretation"
                  value={78}
                  color="#246d82"
                />
                <DemoBar label="Data stewardship" value={62} color="#d2a938" />
                <DemoBar
                  label="Briefing & communication"
                  value={89}
                  color="#3d8b77"
                />
              </div>
            </div>
            <div className="surface pad">
              <div className="panel-title">
                <h2>Next best step</h2>
                <Sparkles size={20} color="#b08318" />
              </div>
              <p
                style={{
                  fontFamily: "var(--app-font-serif)",
                  fontSize: 21,
                  lineHeight: 1.15,
                  margin: "14px 0",
                }}
              >
                Make evidence useful in the room.
              </p>
              <p
                style={{
                  color: "hsl(var(--muted-foreground))",
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                Your workspace brings the signal, the course, and the people
                into one considered decision.
              </p>
              <Link
                href="/courses"
                className="text-button"
                data-testid="link-next-step"
              >
                Browse focused learning{" "}
                <ArrowRight size={14} style={{ verticalAlign: "middle" }} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function DemoBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="competency-item">
      <div>
        <div className="competency-name">
          <span>{label}</span>
          <span className="competency-level">{value}%</span>
        </div>
        <div className="competency-bar">
          <span style={{ width: `${value}%`, background: color }} />
        </div>
      </div>
      <span className={`trend ${value > 70 ? "up" : ""}`}>
        {value > 70 ? "On track" : "Building"}
      </span>
    </div>
  );
}

