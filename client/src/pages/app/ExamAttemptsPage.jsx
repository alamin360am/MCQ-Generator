import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import {
  Activity,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Trophy,
  Users,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import { fetchExam } from "../../features/exams/examApi";

import {
  fetchExamAnalytics,
  fetchExamAttempts,
} from "../../features/exams/creatorAttemptApi";

function ExamAttemptsPage() {
  const { examId } = useParams();

  const [page, setPage] = useState(1);

  const [statusFilter, setStatusFilter] = useState("");

  const examQuery = useQuery({
    queryKey: ["exam", examId],

    queryFn: () => fetchExam(examId),
  });

  const analyticsQuery = useQuery({
    queryKey: ["exam-analytics", examId],

    queryFn: () => fetchExamAnalytics(examId),
  });

  const attemptsQuery = useQuery({
    queryKey: ["exam-attempts", examId, page, statusFilter],

    queryFn: () =>
      fetchExamAttempts({
        examId,
        page,
        limit: 20,
        status: statusFilter,
      }),

    placeholderData: (previousData) => previousData,
  });

  if (examQuery.isLoading || analyticsQuery.isLoading) {
    return <LoadingState />;
  }

  if (examQuery.isError || analyticsQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
        {examQuery.error?.message || analyticsQuery.error?.message}
      </div>
    );
  }

  const exam = examQuery.data?.exam;

  const analytics = analyticsQuery.data;

  const summary = analytics.summary;

  const attempts = attemptsQuery.data?.attempts || [];

  const pagination = attemptsQuery.data?.pagination;

  const questionPerformance =
    analytics.currentVersionAnalytics?.questionPerformance || [];

  return (
    <div className="space-y-6">
      <section>
        <Link
          to="/app/exams"
          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500"
        >
          <ArrowLeft size={17} />
          Back to exams
        </Link>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">{exam.title}</h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Attempt history and performance analytics.
            </p>
          </div>

          <span className="self-start rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold dark:bg-slate-800">
            Current Version {exam.currentVersion}
          </span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          icon={Activity}
          label="Total Attempts"
          value={summary.totalAttempts}
        />

        <MetricCard
          icon={CheckCircle2}
          label="Completed"
          value={summary.completedAttempts}
        />

        <MetricCard
          icon={Users}
          label="Participants"
          value={summary.uniqueParticipants}
        />

        <MetricCard
          icon={BarChart3}
          label="Average Score"
          value={
            summary.averageScore === null ? "—" : `${summary.averageScore}%`
          }
        />

        <MetricCard
          icon={Clock3}
          label="In Progress"
          value={summary.inProgressAttempts}
        />

        <MetricCard
          icon={Trophy}
          label="Highest Score"
          value={
            summary.highestScore === null ? "—" : `${summary.highestScore}%`
          }
        />

        <MetricCard
          icon={BarChart3}
          label="Lowest Score"
          value={summary.lowestScore === null ? "—" : `${summary.lowestScore}%`}
        />

        <MetricCard
          icon={CheckCircle2}
          label="Completion Rate"
          value={`${summary.completionRate}%`}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h3 className="font-bold">Performance by Version</h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Attempts remain associated with the version originally taken.
          </p>
        </div>

        {analytics.versionStats.length === 0 ? (
          <p className="mt-5 text-sm text-slate-400">No attempt data yet.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-150 text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-400 dark:border-slate-800">
                  <th className="pb-3 font-semibold">Version</th>

                  <th className="pb-3 font-semibold">Attempts</th>

                  <th className="pb-3 font-semibold">Completed</th>

                  <th className="pb-3 font-semibold">In Progress</th>

                  <th className="pb-3 font-semibold">Avg. Score</th>
                </tr>
              </thead>

              <tbody>
                {analytics.versionStats.map((item) => (
                  <tr
                    key={item.version}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800/70"
                  >
                    <td className="py-3 font-semibold">v{item.version}</td>

                    <td className="py-3">{item.attempts}</td>

                    <td className="py-3">{item.completed}</td>

                    <td className="py-3">{item.inProgress}</td>

                    <td className="py-3">
                      {item.averageScore === null
                        ? "—"
                        : `${item.averageScore}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h3 className="font-bold">Current Version Question Performance</h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Accuracy is based on answered responses from submitted attempts in
            Version {analytics.currentVersionAnalytics.version}.
          </p>
        </div>

        {questionPerformance.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-7 text-center text-sm text-slate-400 dark:border-slate-700">
            No completed attempts for the current version yet.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {questionPerformance.map((question) => (
              <QuestionPerformance key={question.id} question={question} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-bold">Attempt History</h3>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Open any submitted attempt to review its answers.
            </p>
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {[
              {
                value: "",
                label: "All",
              },
              {
                value: "submitted",
                label: "Completed",
              },
              {
                value: "in_progress",
                label: "In Progress",
              },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setStatusFilter(item.value);

                  setPage(1);
                }}
                className={[
                  "shrink-0 rounded-xl px-3 py-2 text-sm font-semibold",
                  statusFilter === item.value
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          {attemptsQuery.isLoading ? (
            <LoadingState />
          ) : attemptsQuery.isError ? (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
              {attemptsQuery.error.message}
            </div>
          ) : attempts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900">
              No attempts found.
            </div>
          ) : (
            <div className="space-y-3">
              {attempts.map((attempt) => (
                <AttemptCard
                  key={attempt.id}
                  examId={examId}
                  attempt={attempt}
                />
              ))}
            </div>
          )}

          {pagination && pagination.total > 0 && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                className="inline-flex items-center gap-1 px-2 py-2 text-sm font-semibold disabled:opacity-30"
              >
                <ChevronLeft size={17} />
                Previous
              </button>

              <span className="text-xs text-slate-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="inline-flex items-center gap-1 px-2 py-2 text-sm font-semibold disabled:opacity-30"
              >
                Next
                <ChevronRight size={17} />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <Icon size={19} className="text-emerald-600" />

      <p className="mt-4 text-2xl font-bold">{value}</p>

      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function QuestionPerformance({ question }) {
  const accuracy = question.accuracyPercentage;

  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold dark:bg-slate-800">
          {question.number}
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-medium leading-6">{question.questionText}</p>

          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
            <span>Correct {question.correct}</span>

            <span>Wrong {question.wrong}</span>

            <span>Skipped {question.skipped}</span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{
                  width: `${accuracy ?? 0}%`,
                }}
              />
            </div>

            <span className="w-14 text-right text-xs font-bold">
              {accuracy === null ? "—" : `${accuracy}%`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttemptCard({ examId, attempt }) {
  const completed = attempt.status === "submitted";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                completed
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
              ].join(" ")}
            >
              {completed ? "Completed" : "In Progress"}
            </span>

            <span className="text-xs text-slate-400">
              Version {attempt.version}
            </span>
          </div>

          <p className="mt-3 font-semibold">{attempt.participant.name}</p>

          {attempt.participant.email && (
            <p className="mt-1 text-xs text-slate-400">
              {attempt.participant.email}
            </p>
          )}

          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
            <span>
              {attempt.answeredCount}/{attempt.questionCount} answered
            </span>

            <span>Started {formatDateTime(attempt.startedAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {completed && attempt.score && (
            <div className="text-right">
              <p className="text-xl font-bold text-emerald-600">
                {attempt.score.percentage}%
              </p>

              <p className="text-xs text-slate-400">
                {attempt.score.correct}/{attempt.score.total} correct
              </p>
            </div>
          )}

          <Link
            to={`/app/exams/${examId}/attempts/${attempt.id}`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold dark:border-slate-700"
          >
            <Eye size={16} />
            View
          </Link>
        </div>
      </div>
    </article>
  );
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",

    timeStyle: "short",
  }).format(new Date(value));
}

function LoadingState() {
  return (
    <div className="flex min-h-48 items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 dark:border-slate-800" />
    </div>
  );
}

export default ExamAttemptsPage;
