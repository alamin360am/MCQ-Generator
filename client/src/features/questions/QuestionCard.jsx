import {
  Bookmark,
  CheckCircle2,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";

import { useState } from "react";

const difficultyStyles = {
  easy: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",

  medium: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",

  hard: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
};

function QuestionCard({ question, onEdit, onDelete, onBookmark }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <span
            className={[
              "rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
              difficultyStyles[question.difficulty],
            ].join(" ")}
          >
            {question.difficulty}
          </span>

          {question.subject && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {question.subject.name}
            </span>
          )}

          {question.topic && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {question.topic.name}
            </span>
          )}
        </div>

        <div className="relative flex items-center gap-1">
          <button
            type="button"
            onClick={() => onBookmark(question)}
            className={[
              "flex h-9 w-9 items-center justify-center rounded-xl transition",
              question.isBookmarked
                ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30"
                : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
            ].join(" ")}
          >
            <Bookmark
              size={18}
              fill={question.isBookmarked ? "currentColor" : "none"}
            />
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <MoreVertical size={18} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 z-20 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);

                  onEdit(question);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Pencil size={15} />
                Edit
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);

                  onDelete(question);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 size={15} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="mt-4 whitespace-pre-wrap text-base font-semibold leading-7 text-slate-900 sm:text-lg dark:text-white">
        {question.questionText}
      </h3>

      <div className="mt-4 grid gap-2">
        {question.options.map((option, index) => {
          const isCorrect = index === question.correctOptionIndex;

          return (
            <div
              key={index}
              className={[
                "flex items-start gap-3 rounded-xl border px-3 py-3 text-sm",
                isCorrect
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                  : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300",
              ].join(" ")}
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold shadow-sm dark:bg-slate-900">
                {String.fromCharCode(65 + index)}
              </span>

              <span className="flex-1">{option.text}</span>

              {isCorrect && (
                <CheckCircle2
                  size={17}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />
              )}
            </div>
          );
        })}
      </div>

      {question.explanation && (
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:bg-slate-950 dark:text-slate-400">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Explanation:
          </span>{" "}
          {question.explanation}
        </div>
      )}

      {question.tags?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {question.tags.map((tag) => (
            <span key={tag} className="text-xs text-slate-400">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

export default QuestionCard;
