import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  History,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import { fetchPracticeHistory } from "../../features/practice/practiceApi";

import { savePracticeSessionId } from "../../features/practice/practiceStorage";

function PracticeHistoryPage() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);

  const [status, setStatus] = useState("");

  const historyQuery = useQuery({
    queryKey: ["practice-history", page, status],

    queryFn: () =>
      fetchPracticeHistory({
        page,
        limit: 20,
        status,
      }),

    placeholderData: (previousData) => previousData,
  });

  const sessions = historyQuery.data?.sessions || [];

  const pagination = historyQuery.data?.pagination;

  const openSession = (sessionId) => {
    savePracticeSessionId(sessionId);

    navigate("/app/practice");
  };

  return (
    <div>
      <Link
        to="/app/practice"
        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500"
      >
        <ArrowLeft size={17} />
        Back to Practice
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <History size={22} className="text-emerald-600" />

            <h2 className="text-xl font-bold">Practice History</h2>
          </div>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Review previous practice sessions or resume an unfinished session.
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
                setStatus(item.value);

                setPage(1);
              }}
              className={[
                "shrink-0 rounded-xl px-3 py-2 text-sm font-semibold",
                status === item.value
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {historyQuery.isLoading ? (
          <LoadingState />
        ) : historyQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {historyQuery.error.message}
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <History size={34} className="mx-auto text-slate-400" />

            <h3 className="mt-4 font-bold">No practice sessions yet</h3>

            <Link
              to="/app/practice"
              className="mt-5 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Start Practice
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onOpen={() => openSession(session.id)}
              />
            ))}
          </div>
        )}
      </div>

      {pagination && pagination.total > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
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
  );
}

function SessionCard({ session, onOpen }) {
  const completed = session.status === "submitted";

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

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs capitalize text-slate-500 dark:bg-slate-800">
              {formatMode(session.mode)}
            </span>
          </div>

          <p className="mt-3 text-sm text-slate-500">
            {session.answeredCount}/{session.questionCount} answered
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Started {formatDateTime(session.startedAt)}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {completed && session.result && (
            <div className="text-right">
              <p className="text-xl font-bold text-emerald-600">
                {session.result.percentage}%
              </p>

              <p className="text-xs text-slate-400">
                {session.result.correct}/{session.result.total} correct
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={onOpen}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold dark:border-slate-700"
          >
            <Eye size={16} />

            {completed ? "View" : "Resume"}
          </button>
        </div>
      </div>
    </article>
  );
}

function formatMode(mode) {
  const names = {
    random: "Random",

    bookmarked: "Bookmarked",

    wrong: "Wrong Questions",

    filtered: "Custom",
  };

  return names[mode] || mode;
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

export default PracticeHistoryPage;
