import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Award, Check, FileText } from "lucide-react";
import { getAssessment, listAssessments, listCertificates, listResults, submitAssessment, type AssessmentResult, type AssessmentSummary } from "@/lib/capacity-api";
import { Link, useParams } from "wouter";
import { EmptyState, QueryState } from "@/components/common";
import { DemoBar } from "@/pages/home";
import { Shell } from "@/components/layout";
import { getUserFriendlyError } from "@/lib/error-message";
export function AssessmentsPage() {
  const query = useQuery({
    queryKey: ["assessments"],
    queryFn: listAssessments,
  });
  const assessments = query.data || [];
  return (
    <Shell>
      <div className="content-header animate-in">
        <div>
          <div className="eyebrow">Knowledge checks</div>
          <h1>Assessments.</h1>
          <p>
            Use the result to update your competency signal, not just to pass a
            test.
          </p>
        </div>
        <Link href="/trainee/results" className="btn btn-outline">
          <Award size={15} /> View results
        </Link>
      </div>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        retry={() => query.refetch()}
        label="assessments"
      >
        {assessments.length ? (
          <div className="assessment-list">
            {assessments.map((assessment, index) => (
              <AssessmentCard
                assessment={assessment}
                index={index}
                key={assessment.id}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FileText />}
            title="No assessments yet"
            text="Published assessments for your enrolled courses will appear here."
          />
        )}
      </QueryState>
    </Shell>
  );
}

export function AssessmentCard({
  assessment,
  index,
}: {
  assessment: AssessmentSummary;
  index: number;
}) {
  return (
    <article
      className={`surface assessment-card animate-in delay-${Math.min(index + 1, 4)}`}
    >
      <div className="assessment-card-icon">
        <FileText size={20} />
      </div>
      <div>
        <div className="eyebrow">{assessment.subject}</div>
        <h2>{assessment.title}</h2>
        <p>
          {assessment.questions} questions · {assessment.durationMinutes}{" "}
          minutes · pass at {assessment.passingScore}%
        </p>
        <span
          className={`pill ${assessment.status === "COMPLETED" ? "low" : ""}`}
        >
          {assessment.status === "COMPLETED"
            ? "Attempted"
            : `Due ${assessment.deadline}`}
        </span>
      </div>
      <Link
        href={`/trainee/assessments/${assessment.id}`}
        className="btn btn-dark"
      >
        {assessment.status === "COMPLETED"
          ? "Review result"
          : "Start assessment"}{" "}
        <ArrowRight size={14} />
      </Link>
    </article>
  );
}

export function AssessmentPage() {
  const { id = "" } = useParams<{ id: string }>();
  const query = useQuery({
    queryKey: ["assessment", id],
    queryFn: () => getAssessment(id),
    enabled: !!id,
  });
  const submitMutation = useMutation({
    mutationFn: ({
      answers,
      seconds,
    }: {
      answers: Record<string, number>;
      seconds: number;
    }) => submitAssessment(id, answers, seconds),
  });
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [startedAt] = useState(() => Date.now());
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const assessment = query.data;
  const question = assessment?.questions[current];
  const submitted = submitMutation.data;
  useEffect(() => {
    if (assessment) setRemainingSeconds(assessment.durationMinutes * 60);
  }, [assessment?.id, assessment?.durationMinutes]);
  useEffect(() => {
    if (!assessment || submitted || remainingSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setRemainingSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [assessment, submitted, remainingSeconds]);
  useEffect(() => {
    if (!assessment || submitted || remainingSeconds !== 0) return;
    submitMutation.mutate({
      answers,
      seconds: assessment.durationMinutes * 60,
    });
  }, [assessment, submitted, remainingSeconds]);
  const answer = (option: number) =>
    question && setAnswers((old) => ({ ...old, [question.id]: option }));
  const formatTime = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const submitNow = () => {
    if (!assessment) return;
    const unanswered = assessment.questions.length - Object.keys(answers).length;
    if (unanswered > 0 && !window.confirm(`You have ${unanswered} unanswered question${unanswered === 1 ? "" : "s"}. Submit anyway?`)) return;
    submitMutation.mutate({
      answers,
      seconds: Math.round((Date.now() - startedAt) / 1000),
    });
  };
  if (submitted)
    return (
      <Shell>
        <div className="result-hero animate-in">
          <div className="eyebrow">Assessment submitted</div>
          <h1>{submitted.percentage}%</h1>
          <p>
            {submitted.status === "PASSED"
              ? "Passed. Your competency evidence has been updated."
              : "Not passed this time. Review the breakdown and try again after more practice."}
          </p>
          <span
            className={`pill ${submitted.status === "PASSED" ? "low" : "high"}`}
          >
            {submitted.status === "PASSED" ? "Passed" : "Needs another attempt"}
          </span>
        </div>
        <ResultBreakdown result={submitted} />
      </Shell>
    );
  return (
    <Shell>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        retry={() => query.refetch()}
        label="assessment"
      >
        {assessment && question && (
          <div className="assessment-shell animate-in">
            <div className="content-header">
              <div>
                <Link href="/trainee/assessments" className="text-button">
                  ← All assessments
                </Link>
                <div className="eyebrow" style={{ marginTop: 14 }}>
                  {assessment.subject} · {assessment.durationMinutes} minutes
                </div>
                <h1>{assessment.title}</h1>
              </div>
              <div className="assessment-counter">
                Question {current + 1} / {assessment.questions.length}
                <span>{Object.keys(answers).length} answered</span>
                <span className={remainingSeconds < 60 ? "pill high" : "pill"}>Time {formatTime(remainingSeconds)}</span>
              </div>
            </div>
            <div className="assessment-progress">
              <span
                style={{
                  width: `${((current + 1) / assessment.questions.length) * 100}%`,
                }}
              />
            </div>
            <div className="assessment-question-nav" aria-label="Question navigation">
              {assessment.questions.map((item, index) => (
                <button
                  key={item.id}
                  className={`btn btn-small ${index === current ? "btn-dark" : "btn-outline"}`}
                  onClick={() => setCurrent(index)}
                  aria-label={`Go to question ${index + 1}`}
                >
                  {index + 1}{answers[item.id] !== undefined ? " ✓" : ""}
                </button>
              ))}
            </div>
            <div className="surface pad question-card">
              <div className="eyebrow">Question {current + 1}</div>
              <h2>{question.prompt}</h2>
              <div className="answer-options">
                {question.options.map((option, index) => (
                  <button
                    className={`answer-option ${answers[question.id] === index ? "selected" : ""}`}
                    key={option}
                    onClick={() => answer(index)}
                  >
                    <span>{String.fromCharCode(65 + index)}</span>
                    {option}
                  </button>
                ))}
              </div>
              <div className="question-actions">
                {current > 0 && (
                  <button
                    className="btn btn-outline"
                    onClick={() => setCurrent((value) => value - 1)}
                  >
                    <ArrowLeft size={14} /> Previous
                  </button>
                )}
                {current < assessment.questions.length - 1 ? (
                  <button
                    className="btn btn-dark"
                    onClick={() => setCurrent((value) => value + 1)}
                  >
                    Next <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    disabled={submitMutation.isPending}
                    onClick={submitNow}
                  >
                    {submitMutation.isPending
                      ? "Submitting…"
                      : "Submit assessment"}{" "}
                    <Check size={14} />
                  </button>
                )}
              </div>
              {submitMutation.error && (
                <p className="inline-error">
                  {getUserFriendlyError(
                    submitMutation.error,
                    "We could not submit this attempt. Please try again.",
                  )}
                </p>
              )}
            </div>
          </div>
        )}
      </QueryState>
    </Shell>
  );
}

export function ResultBreakdown({ result }: { result: AssessmentResult }) {
  return (
    <div className="surface pad result-breakdown">
      <div className="panel-title">
        <h2>Performance breakdown</h2>
        <Link href="/trainee/results" className="text-button">
          All results <ArrowRight size={13} />
        </Link>
      </div>
      <div className="result-stats">
        <div>
          <strong>{result.correct}</strong>
          <span>correct</span>
        </div>
        <div>
          <strong>{result.incorrect}</strong>
          <span>incorrect</span>
        </div>
        <div>
          <strong>{result.skipped}</strong>
          <span>skipped</span>
        </div>
        <div>
          <strong>{result.timeTaken}</strong>
          <span>time taken</span>
        </div>
      </div>
      <div className="competency-list">
        {result.competencyBreakdown.map((item) => (
          <DemoBar
            key={item.name}
            label={item.name}
            value={item.percentage}
            color="#246d82"
          />
        ))}
      </div>
    </div>
  );
}

export function ResultsPage() {
  const query = useQuery({ queryKey: ["results"], queryFn: listResults });
  return (
    <Shell>
      <div className="content-header animate-in">
        <div>
          <div className="eyebrow">Evidence earned</div>
          <h1>Assessment results.</h1>
          <p>Review the capability signals behind each result.</p>
        </div>
      </div>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        retry={() => query.refetch()}
        label="results"
      >
        {query.data?.length ? (
          <div className="results-list">
            {query.data.map((result) => (
              <article className="surface result-row" key={result.id}>
                <div>
                  <div className="eyebrow">{result.assessment}</div>
                  <strong>
                    {new Date(result.submittedAt).toLocaleDateString()}
                  </strong>
                  <div className="result-row-meta">
                    {result.correct} correct · {result.incorrect} incorrect ·{" "}
                    {result.skipped} skipped
                  </div>
                </div>
                <div className="result-score">
                  <strong>{result.percentage}%</strong>
                  <span
                    className={`pill ${result.status === "PASSED" ? "low" : "high"}`}
                  >
                    {result.status === "PASSED" ? "Passed" : "Not passed"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Award />}
            title="No results yet"
            text="Complete an assessment to see competency-wise performance here."
            action={
              <Link href="/trainee/assessments" className="btn btn-dark">
                View assessments
              </Link>
            }
          />
        )}
      </QueryState>
    </Shell>
  );
}

export function CertificatesPage() {
  const query = useQuery({
    queryKey: ["certificates"],
    queryFn: listCertificates,
  });
  return (
    <Shell>
      <div className="content-header animate-in">
        <div>
          <div className="eyebrow">Recognised learning</div>
          <h1>Certificates.</h1>
          <p>
            Completion records issued when the course and its required evidence
            are complete.
          </p>
        </div>
      </div>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        retry={() => query.refetch()}
        label="certificates"
      >
        {query.data?.length ? (
          <div className="certificate-grid">
            {query.data.map((certificate) => (
              <article
                className="surface certificate-card"
                key={certificate.id}
              >
                <div className="certificate-seal">
                  <Award size={24} />
                </div>
                <div>
                  <div className="eyebrow">{certificate.id}</div>
                  <h2>{certificate.title}</h2>
                  <p>{certificate.course}</p>
                  <span>
                    Issued {new Date(certificate.issued).toLocaleDateString()}
                  </span>
                </div>
                <button
                  className="btn btn-outline"
                  onClick={() => window.print()}
                >
                  View / print
                </button>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Award />}
            title="No certificates yet"
            text="Complete every module and finish the assessment to receive a certificate."
            action={
              <Link href="/trainee/my-learning" className="btn btn-dark">
                Continue learning
              </Link>
            }
          />
        )}
      </QueryState>
    </Shell>
  );
}

