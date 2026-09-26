import { useQuery } from "@tanstack/react-query";

import {
  ArrowLeft,
  CheckCircle2,
  CircleX,
  Clock3,
  MinusCircle,
  UserRound,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import { fetchExam } from "../../features/exams/examApi";

import { fetchExamAttemptDetail } from "../../features/exams/creatorAttemptApi";

function ExamAttemptDetailPage() {
  const { examId, attemptId } = useParams();

  const examQuery = useQuery({
    queryKey: ["exam", examId],

    queryFn: () => fetchExam(examId),
  });

  const attemptQuery = useQuery({
    queryKey: ["creator-attempt", examId, attemptId],

    queryFn: () =>
      fetchExamAttemptDetail({
        examId,
        attemptId,
      }),
  });

  if (examQuery.isLoading || attemptQuery.isLoading) {
    return <LoadingState />;
  }

  if (examQuery.isError || attemptQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
        {examQuery.error?.message || attemptQuery.error?.message}
      </div>
    );
  }

  const exam = examQuery.data.exam;

  const attempt = attemptQuery.data.attempt;

  const result = attempt.result;

  return (
    <div className="space-y-6">
      <section>
        <Link
          to={`/app/exams/${examId}/attempts`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500"
        >
          <ArrowLeft size={17} />
          Back to analytics
        </Link>

        <h2 className="mt-4 text-xl font-bold">Attempt Review</h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {exam.title}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
              <UserRound size={21} />
            </div>

            <div>
              <p className="font-bold">{attempt.participant.name}</p>

              {attempt.participant.email && (
                <p className="mt-1 text-sm text-slate-400">
                  {attempt.participant.email}
                </p>
              )}

              <p className="mt-1 text-xs text-slate-400">
                Version {attempt.version}
              </p>
            </div>
          </div>

          <span
            className={[
              "self-start rounded-full px-3 py-1.5 text-xs font-semibold",
              attempt.status === "submitted"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
            ].join(" ")}
          >
            {attempt.status === "submitted" ? "Completed" : "In Progress"}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <InfoBox
            label="Answered"
            value={`${attempt.progress.answeredCount}/${attempt.progress.questionCount}`}
          />

          <InfoBox label="Started" value={formatDateTime(attempt.startedAt)} />

          <InfoBox
            label="Submitted"
            value={formatDateTime(attempt.submittedAt)}
          />

          <InfoBox
            label="Reason"
            value={
              attempt.submissionReason
                ? formatReason(attempt.submissionReason)
                : "—"
            }
          />
        </div>
      </section>

      {attempt.status === "in_progress" ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 shrink-0 text-amber-600" />

            <div>
              <h3 className="font-bold text-amber-800 dark:text-amber-300">
                Attempt still in progress
              </h3>

              <p className="mt-1 text-sm leading-6 text-amber-700 dark:text-amber-400">
                Full scoring and answer review become available after submission
                or automatic timeout.
              </p>
            </div>
          </div>
        </section>
      ) : result ? (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <ScoreCard label="Score" value={`${result.score.percentage}%`} />

            <ScoreCard label="Total" value={result.score.total} />

            <ScoreCard
              label="Correct"
              value={result.score.correct}
              type="correct"
            />

            <ScoreCard label="Wrong" value={result.score.wrong} type="wrong" />

            <ScoreCard
              label="Skipped"
              value={result.score.skipped}
              type="skipped"
            />
          </section>

          <section>
            <h3 className="font-bold">Answer Review</h3>

            <div className="mt-4 space-y-4">
              {result.questions.map((question, index) => (
                <ReviewQuestion
                  key={question.id}
                  question={question}
                  index={index}
                />
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function ReviewQuestion({ question, index }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold dark:bg-slate-800">
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          {question.isSkipped ? (
            <StatusBadge type="skipped" />
          ) : question.isCorrect ? (
            <StatusBadge type="correct" />
          ) : (
            <StatusBadge type="wrong" />
          )}

          <h4 className="mt-3 whitespace-pre-wrap font-semibold leading-7">
            {question.questionText}
          </h4>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {question.options.map((option, optionIndex) => {
          const isCorrect = optionIndex === question.correctOptionIndex;

          const isSelected = optionIndex === question.selectedOptionIndex;

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

              <span className="flex-1">{option.text}</span>

              {isCorrect && (
                <span className="text-xs font-bold text-emerald-600">
                  Correct
                </span>
              )}

              {isSelected && !isCorrect && (
                <span className="text-xs font-bold text-red-600">Selected</span>
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
  );
}

function StatusBadge({ type }) {
  if (type === "correct") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
        <CheckCircle2 size={13} />
        Correct
      </span>
    );
  }

  if (type === "wrong") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-400">
        <CircleX size={13} />
        Wrong
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      <MinusCircle size={13} />
      Skipped
    </span>
  );
}

function ScoreCard({ label, value, type = "default" }) {
  const styles = {
    default: "text-slate-900 dark:text-white",

    correct: "text-emerald-600",

    wrong: "text-red-600",

    skipped: "text-amber-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
      <p className={["text-2xl font-bold", styles[type]].join(" ")}>{value}</p>

      <p className="mt-1 text-xs text-slate-400">{label}</p>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
      <p className="text-[11px] text-slate-400">{label}</p>

      <p className="mt-1 wrap-break-word text-sm font-semibold">{value}</p>
    </div>
  );
}

function formatReason(value) {
  if (value === "time_expired") {
    return "Time Expired";
  }

  if (value === "manual") {
    return "Manual";
  }

  return value;
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
    <div className="flex min-h-64 items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 dark:border-slate-800" />
    </div>
  );
}

export default ExamAttemptDetailPage;
