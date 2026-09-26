import {
  CheckCircle2,
  CircleX,
  Home,
  MinusCircle,
  RotateCcw,
} from "lucide-react";

import { Link } from "react-router-dom";

function ExamResultView({ result, canRetake = false, onRetake }) {
  const { score, questions } = result;

  return (
    <main className="min-h-screen bg-slate-50 pb-10 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 text-center sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <CheckCircle2 size={42} className="mx-auto text-emerald-600" />

          <p className="mt-4 text-sm font-semibold text-emerald-600">
            Exam Completed
          </p>

          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            {result.exam.title}
          </h1>

          <div className="mx-auto mt-6 flex h-32 w-32 items-center justify-center rounded-full border-8 border-emerald-100 dark:border-emerald-950">
            <div>
              <p className="text-3xl font-bold text-emerald-600">
                {score.percentage}%
              </p>

              <p className="mt-1 text-xs text-slate-400">Score</p>
            </div>
          </div>

          {result.submissionReason === "time_expired" && (
            <p className="mt-4 text-sm font-semibold text-amber-600">
              Time expired. Your saved answers were submitted automatically.
            </p>
          )}

          <div className="mt-7 grid grid-cols-4 gap-2">
            <ScoreBox label="Total" value={score.total} />

            <ScoreBox label="Correct" value={score.correct} type="correct" />

            <ScoreBox label="Wrong" value={score.wrong} type="wrong" />

            <ScoreBox label="Skipped" value={score.skipped} type="skipped" />
          </div>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {canRetake && (
              <button
                type="button"
                onClick={onRetake}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white"
              >
                <RotateCcw size={17} />
                Take Again
              </button>
            )}

            <Link
              to="/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-semibold dark:border-slate-700"
            >
              <Home size={17} />
              Home
            </Link>
          </div>
        </section>

        <section className="mt-8">
          <div>
            <h2 className="text-xl font-bold">Answer Review</h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Review your answers and the correct solutions.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {questions.map((question, questionIndex) => (
              <article
                key={question.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold dark:bg-slate-800">
                    {questionIndex + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {question.isSkipped ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          <MinusCircle size={13} />
                          Skipped
                        </span>
                      ) : question.isCorrect ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                          <CheckCircle2 size={13} />
                          Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-400">
                          <CircleX size={13} />
                          Wrong
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 whitespace-pre-wrap font-semibold leading-7">
                      {question.questionText}
                    </h3>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  {question.options.map((option, optionIndex) => {
                    const isCorrect =
                      optionIndex === question.correctOptionIndex;

                    const isSelected =
                      optionIndex === question.selectedOptionIndex;

                    return (
                      <div
                        key={option.index}
                        className={[
                          "flex items-start gap-3 rounded-xl border px-3 py-3 text-sm",
                          isCorrect
                            ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                            : isSelected
                              ? "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                              : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400",
                        ].join(" ")}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold dark:bg-slate-900">
                          {String.fromCharCode(65 + optionIndex)}
                        </span>

                        <span className="flex-1 pt-0.5">{option.text}</span>

                        {isCorrect && (
                          <span className="text-xs font-bold text-emerald-600">
                            Correct
                          </span>
                        )}

                        {isSelected && !isCorrect && (
                          <span className="text-xs font-bold text-red-600">
                            Your answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {question.explanation && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:bg-slate-950 dark:text-slate-400">
                    <strong className="text-slate-800 dark:text-slate-200">
                      Explanation:
                    </strong>{" "}
                    {question.explanation}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function ScoreBox({ label, value, type = "default" }) {
  const styles = {
    default: "text-slate-900 dark:text-white",

    correct: "text-emerald-600",

    wrong: "text-red-600",

    skipped: "text-amber-600",
  };

  return (
    <div className="rounded-xl bg-slate-50 px-2 py-3 dark:bg-slate-950">
      <p className={["text-xl font-bold", styles[type]].join(" ")}>{value}</p>

      <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">{label}</p>
    </div>
  );
}

export default ExamResultView;
