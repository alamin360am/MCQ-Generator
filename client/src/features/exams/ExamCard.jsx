import {
  Archive,
  Clipboard,
  ExternalLink,
  Pencil,
  Send,
  Trash2,
  BarChart3,
} from "lucide-react";

import { Link } from "react-router-dom";

const statusStyles = {
  draft: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",

  published:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",

  archived: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

function ExamCard({ exam, onPublish, onArchive, onDelete, onCopyLink }) {
  const canShare =
    exam.status === "published" &&
    exam.shareId &&
    exam.visibility !== "private";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                statusStyles[exam.status],
              ].join(" ")}
            >
              {exam.status}
            </span>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs capitalize text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {exam.visibility}
            </span>

            {exam.currentVersion > 0 && (
              <span className="text-xs text-slate-400">
                Version {exam.currentVersion}
              </span>
            )}
          </div>

          <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
            {exam.title}
          </h3>

          {exam.description && (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {exam.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
            <span>{exam.questionCount} questions</span>

            {exam.settings?.durationMinutes && (
              <span>{exam.settings.durationMinutes} min</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          to={`/app/exams/${exam.id}/edit`}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold dark:border-slate-700"
        >
          <Pencil size={16} />
          Edit
        </Link>

        <Link
          to={`/app/exams/${exam.id}/attempts`}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold dark:border-slate-700"
        >
          <BarChart3 size={16} />
          Attempts
        </Link>

        <button
          type="button"
          onClick={() => onPublish(exam)}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white"
        >
          <Send size={16} />

          {exam.currentVersion > 0 ? "Publish New Version" : "Publish"}
        </button>

        {canShare && (
          <>
            <button
              type="button"
              onClick={() => onCopyLink(exam)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold dark:border-slate-700"
            >
              <Clipboard size={16} />
              Copy Link
            </button>

            <a
              href={`/exam/${exam.shareId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold dark:border-slate-700"
            >
              <ExternalLink size={16} />
              Open
            </a>
          </>
        )}

        {exam.status !== "archived" && (
          <button
            type="button"
            onClick={() => onArchive(exam)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-500 dark:border-slate-700"
          >
            <Archive size={16} />
            Archive
          </button>
        )}

        {exam.currentVersion === 0 && (
          <button
            type="button"
            onClick={() => onDelete(exam)}
            className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-red-600"
          >
            <Trash2 size={16} />
            Delete
          </button>
        )}
      </div>

      {exam.status === "published" && exam.visibility === "private" && (
        <p className="mt-3 text-xs text-amber-600">
          This exam is private, so its public share link is currently disabled.
        </p>
      )}
    </article>
  );
}

export default ExamCard;
