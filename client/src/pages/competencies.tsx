import { useState } from "react";
import { CheckCircle2, MessageCircle, Signal, Users } from "lucide-react";
import { getListCompetenciesQueryKey, getListCompetencyGapsQueryKey, getListRecommendedTrainersQueryKey, useListCompetencies, useListCompetencyGaps, useListRecommendedTrainers, type Competency, type TrainerRecommendation } from "@/lib/api-client-react";
import { Link } from "wouter";
import { EmptyState, QueryState } from "@/components/common";
import { Shell } from "@/components/layout";
import { CompetencyBar, GapRow } from "@/pages/dashboard";
export function CompetenciesPage() {
  const competencies = useListCompetencies({
    query: { queryKey: getListCompetenciesQueryKey() },
  });
  const gaps = useListCompetencyGaps({
    query: { queryKey: getListCompetencyGapsQueryKey() },
  });
  return (
    <Shell>
      <div className="content-header animate-in">
        <div>
          <div className="eyebrow">Evidence and growth</div>
          <h1>Your competency signal.</h1>
          <p>
            A transparent view of what is strong, what is building, and where a
            focused course can help.
          </p>
        </div>
        <Link
          href="/trainee/recommendations"
          className="btn btn-dark"
          data-testid="link-find-trainer"
        >
          Find a trainer <Users size={15} />
        </Link>
      </div>
      <div className="dashboard-grid">
        <div className="surface pad">
          <div className="panel-title">
            <h2>Capability evidence</h2>
            <span className="pill">Current view</span>
          </div>
          <QueryState
            loading={competencies.isLoading}
            error={competencies.error}
            retry={() => competencies.refetch()}
            label="competencies"
          >
            {competencies.data?.length ? (
              <div className="competency-list">
                {competencies.data.map((item) => (
                  <CompetencyBar item={item} key={item.id} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Signal />}
                title="Evidence is still arriving"
                text="There are no competency signals to display yet."
              />
            )}
          </QueryState>
        </div>
        <div className="surface pad">
          <div className="panel-title">
            <h2>Close the gaps</h2>
            <span className="pill high">
              {gaps.data?.length || 0} priorities
            </span>
          </div>
          <QueryState
            loading={gaps.isLoading}
            error={gaps.error}
            retry={() => gaps.refetch()}
            label="gaps"
          >
            {gaps.data?.length ? (
              gaps.data.map((gap) => <GapRow gap={gap} key={gap.id} />)
            ) : (
              <EmptyState
                icon={<CheckCircle2 />}
                title="You are in a good place"
                text="No competency gaps are currently flagged."
              />
            )}
          </QueryState>
        </div>
      </div>
    </Shell>
  );
}

export function RecommendationsPage() {
  const gaps = useListCompetencyGaps({
    query: { queryKey: getListCompetencyGapsQueryKey() },
  });
  const [subjectId, setSubjectId] = useState("");
  const selectedId = subjectId || gaps.data?.[0]?.id || "";
  const trainers = useListRecommendedTrainers(selectedId, {
    query: {
      enabled: !!selectedId,
      queryKey: getListRecommendedTrainersQueryKey(selectedId),
    },
  });
  const selectedGap = gaps.data?.find((gap) => gap.id === selectedId);
  return (
    <Shell>
      <div className="content-header animate-in">
        <div>
          <div className="eyebrow">People fit</div>
          <h1>Find the right guide.</h1>
          <p>
            Trainer recommendations use subject fit, experience, and the
            specific competencies you are building.
          </p>
        </div>
      </div>
      <div className="surface pad" style={{ marginBottom: 16 }}>
        <div className="catalog-toolbar" style={{ margin: 0 }}>
          <div style={{ flex: 1 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>
              Choose a subject signal
            </div>
            <select
              className="select"
              value={selectedId}
              onChange={(event) => setSubjectId(event.target.value)}
              data-testid="select-recommendation-subject"
            >
              <option value="" disabled>
                Select a competency gap
              </option>
              {gaps.data?.map((gap) => (
                <option key={gap.id} value={gap.id}>
                  {gap.name} · {gap.recommendedCourse}
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              flex: 1,
              padding: "18px 0 0 10px",
              color: "hsl(var(--muted-foreground))",
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            {selectedGap ? (
              <>
                <strong style={{ color: "hsl(var(--foreground))" }}>
                  Why this view:
                </strong>{" "}
                trainers are ranked for your {selectedGap.name.toLowerCase()}{" "}
                development signal.
              </>
            ) : (
              "Competency gaps will appear here when evidence is available."
            )}
          </div>
        </div>
      </div>
      <QueryState
        loading={gaps.isLoading || trainers.isLoading}
        error={gaps.error || trainers.error}
        retry={() => {
          gaps.refetch();
          trainers.refetch();
        }}
        label="trainers"
      >
        {trainers.data?.length ? (
          <div className="recommendation-grid">
            {trainers.data.map((trainer, index) => (
              <TrainerCard
                recommendation={trainer}
                index={index}
                key={trainer.id}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Users />}
            title="No trainer matches yet"
            text="Choose a competency gap to rank relevant trainers."
          />
        )}
      </QueryState>
    </Shell>
  );
}

export function TrainerCard({
  recommendation,
  index,
}: {
  recommendation: TrainerRecommendation;
  index: number;
}) {
  return (
    <article
      className={`surface trainer-rec animate-in delay-${Math.min(index + 1, 4)}`}
      data-testid={`card-trainer-${recommendation.id}`}
    >
      <div className="match-score">{recommendation.matchScore}%</div>
      <div>
        <h3>{recommendation.name}</h3>
        <span className="title">
          {recommendation.title} · {recommendation.experienceYears} years
          experience
        </span>
        <div className="rec-tags">
          {recommendation.strongestCompetencies.slice(0, 3).map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
        <p className="rec-reason">{recommendation.reasoning}</p>
        <span
          className={`eligibility ${recommendation.eligible ? "eligible" : "ineligible"}`}
        >
          {recommendation.eligible
            ? "Eligible for your programme"
            : "Review eligibility with your team"}
        </span>
      </div>
      <button
        className="btn btn-outline"
        disabled
        title="Trainer contact workflow is not available in this workspace"
        data-testid={`button-contact-trainer-${recommendation.id}`}
      >
        <MessageCircle size={14} /> Contact
      </button>
    </article>
  );
}

