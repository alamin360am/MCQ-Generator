import { useCallback, useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Check,
  CheckCircle2,
  Clock,
  FileQuestion,
  Play,
  RotateCcw,
  Save,
  Send,
  TriangleAlert,
  UserRound,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import { fetchPublicExam } from "../../features/exams/examApi";

import {
  fetchPublicAttempt,
  fetchPublicAttemptResult,
  savePublicAttemptAnswers,
  startPublicAttempt,
  submitPublicAttempt,
} from "../../features/exams/attemptApi";

import {
  clearAttemptSession,
  readAttemptSession,
  saveAttemptSession,
} from "../../features/exams/attemptStorage";

import ExamResultView from "../../features/exams/ExamResultView";

function PublicExamPage() {
  const { shareId } = useParams();

  const queryClient = useQueryClient();

  const [activeSession, setActiveSession] = useState(() =>
    readAttemptSession(shareId),
  );

  const publicExamQuery = useQuery({
    queryKey: ["public-exam", shareId],

    queryFn: () => fetchPublicExam(shareId),

    enabled: !activeSession,

    retry: false,
  });

  const attemptQuery = useQuery({
    queryKey: ["public-attempt", activeSession?.attemptId || "none"],

    queryFn: () =>
      fetchPublicAttempt({
        attemptId: activeSession.attemptId,

        attemptToken: activeSession.attemptToken,
      }),

    enabled: Boolean(activeSession),

    retry: false,

    refetchOnWindowFocus: true,
  });

  const attempt = attemptQuery.data?.attempt;

  const resultAvailable = attemptQuery.data?.resultAvailable === true;

  const resultQuery = useQuery({
    queryKey: ["attempt-result", activeSession?.attemptId || "none"],

    queryFn: () =>
      fetchPublicAttemptResult({
        attemptId: activeSession.attemptId,

        attemptToken: activeSession.attemptToken,
      }),

    enabled: Boolean(
      activeSession && attempt?.status === "submitted" && resultAvailable,
    ),

    retry: false,
  });

  const startMutation = useMutation({
    mutationFn: (payload) => startPublicAttempt(shareId, payload),

    onSuccess: (data) => {
      const session = {
        attemptId: data.attempt.id,

        attemptToken: data.attemptToken,
      };

      saveAttemptSession(shareId, session);

      queryClient.setQueryData(["public-attempt", session.attemptId], {
        success: true,

        attempt: data.attempt,

        resultAvailable: false,
      });

      setActiveSession(session);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession) {
        throw new Error("No active exam attempt");
      }

      return submitPublicAttempt({
        attemptId: activeSession.attemptId,

        attemptToken: activeSession.attemptToken,
      });
    },

    onSuccess: async (data) => {
      if (data.resultAvailable && data.result && activeSession) {
        queryClient.setQueryData(
          ["attempt-result", activeSession.attemptId],
          data,
        );
      }

      if (activeSession) {
        await queryClient.invalidateQueries({
          queryKey: ["public-attempt", activeSession.attemptId],
        });
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    },
  });

  const forgetAttempt = () => {
    const attemptId = activeSession?.attemptId;

    clearAttemptSession(shareId);

    setActiveSession(null);

    if (attemptId) {
      queryClient.removeQueries({
        queryKey: ["public-attempt", attemptId],
      });

      queryClient.removeQueries({
        queryKey: ["attempt-result", attemptId],
      });
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (activeSession) {
    if (attemptQuery.isLoading) {
      return <LoadingScreen message="Resuming your exam..." />;
    }

    if (attemptQuery.isError) {
      return (
        <ResumeErrorView
          message={attemptQuery.error.message}
          onRetry={() => attemptQuery.refetch()}
          onForget={forgetAttempt}
        />
      );
    }

    if (!attempt) {
      return null;
    }

    if (attempt.status === "submitted") {
      if (!resultAvailable) {
        return <SubmittedView attempt={attempt} />;
      }

      if (resultQuery.isLoading) {
        return <LoadingScreen message="Loading your result..." />;
      }

      if (resultQuery.isError) {
        return (
          <ResultErrorView
            message={resultQuery.error.message}
            onRetry={() => resultQuery.refetch()}
          />
        );
      }

      if (resultQuery.data?.result) {
        return (
          <ExamResultView
            result={resultQuery.data.result}
            canRetake={attempt.exam?.settings?.allowRetake === true}
            onRetake={forgetAttempt}
          />
        );
      }

      return null;
    }

    return (
      <ActiveExamView
        key={attempt.id}
        attempt={attempt}
        session={activeSession}
        isSubmitting={submitMutation.isPending}
        onSubmit={() => submitMutation.mutateAsync()}
      />
    );
  }

  if (publicExamQuery.isLoading) {
    return <LoadingScreen message="Loading exam..." />;
  }

  if (publicExamQuery.isError) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30">
          <FileQuestion size={38} className="mx-auto text-red-400" />

          <h1 className="mt-4 text-xl font-bold">Exam unavailable</h1>

          <p className="mt-2 text-sm text-slate-500">
            {publicExamQuery.error.message}
          </p>
        </div>
      </main>
    );
  }

  const exam = publicExamQuery.data?.exam;

  if (!exam) {
    return null;
  }

  return (
    <ExamIntroView
      exam={exam}
      isStarting={startMutation.isPending}
      serverError={startMutation.error?.message || ""}
      onStart={(payload) => startMutation.mutateAsync(payload)}
    />
  );
}

function ExamIntroView({ exam, onStart, isStarting, serverError }) {
  const [participantName, setParticipantName] = useState("");

  const [localError, setLocalError] = useState("");

  const handleStart = async () => {
    setLocalError("");

    if (
      exam.settings.collectParticipantName &&
      participantName.trim().length < 2
    ) {
      setLocalError("Please enter your name before starting.");

      return;
    }

    try {
      await onStart({
        participantName: participantName.trim(),
      });
    } catch {
      // Mutation error is
      // displayed below.
    }
  };

  return (
    <main className="min-h-[75vh] bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <FileQuestion size={27} />
          </div>

          <h1 className="mt-5 text-2xl font-bold leading-tight sm:text-3xl">
            {exam.title}
          </h1>

          {exam.description && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-500 sm:text-base dark:text-slate-400">
              {exam.description}
            </p>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <InfoBox label="Questions" value={exam.questionCount} />

            <InfoBox
              label="Duration"
              value={
                exam.settings.durationMinutes
                  ? `${exam.settings.durationMinutes} min`
                  : "No limit"
              }
            />
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:bg-slate-950 dark:text-slate-400">
            <p>All questions will appear on one scrollable page.</p>

            {exam.settings.durationMinutes && (
              <p className="mt-2">
                The timer starts only after you press{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  Start Exam
                </strong>
                .
              </p>
            )}

            {exam.settings.shuffleQuestions && (
              <p className="mt-2">Question order may be randomized.</p>
            )}

            {exam.settings.shuffleOptions && (
              <p className="mt-2">Answer options may be randomized.</p>
            )}
          </div>

          {exam.settings.collectParticipantName && (
            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold">
                Your name
              </label>

              <div className="relative">
                <UserRound
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={participantName}
                  onChange={(event) => {
                    setParticipantName(event.target.value);

                    if (localError) {
                      setLocalError("");
                    }
                  }}
                  maxLength={80}
                  placeholder="Enter your name"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            </div>
          )}

          {(localError || serverError) && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              {localError || serverError}
            </div>
          )}

          <button
            type="button"
            onClick={handleStart}
            disabled={isStarting}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 font-bold text-white transition hover:bg-emerald-500 disabled:opacity-60"
          >
            <Play size={19} fill="currentColor" />

            {isStarting ? "Starting..." : "Start Exam"}
          </button>
        </section>
      </div>
    </main>
  );
}

function ActiveExamView({ attempt, session, onSubmit, isSubmitting }) {
  const [answers, setAnswers] = useState(() => {
    return Object.fromEntries(
      attempt.questions
        .filter(
          (question) =>
            question.selectedOptionIndex !== null &&
            question.selectedOptionIndex !== undefined,
        )
        .map((question) => [question.id, question.selectedOptionIndex]),
    );
  });

  const [saveStatus, setSaveStatus] = useState("saved");

  const [saveError, setSaveError] = useState("");

  const [pageError, setPageError] = useState("");

  const pendingAnswersRef = useRef(new Map());

  const debounceTimerRef = useRef(null);

  const inFlightSaveRef = useRef(null);

  const submitLockRef = useRef(false);

  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    getRemainingSeconds(attempt.expiresAt),
  );

  useEffect(() => {
    if (!attempt.expiresAt) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setRemainingSeconds(getRemainingSeconds(attempt.expiresAt));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [attempt.expiresAt]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const flushPendingAnswers = useCallback(async () => {
    if (inFlightSaveRef.current) {
      await inFlightSaveRef.current;
    }

    if (pendingAnswersRef.current.size === 0) {
      return;
    }

    const saveLoop = async () => {
      while (pendingAnswersRef.current.size > 0) {
        const batch = Array.from(pendingAnswersRef.current.entries()).map(
          ([questionId, selectedOptionIndex]) => ({
            questionId,
            selectedOptionIndex,
          }),
        );

        pendingAnswersRef.current.clear();

        setSaveStatus("saving");

        setSaveError("");

        try {
          await savePublicAttemptAnswers({
            attemptId: session.attemptId,

            attemptToken: session.attemptToken,

            answers: batch,
          });

          setSaveStatus("saved");
        } catch (error) {
          batch.forEach((answer) => {
            if (!pendingAnswersRef.current.has(answer.questionId)) {
              pendingAnswersRef.current.set(
                answer.questionId,
                answer.selectedOptionIndex,
              );
            }
          });

          setSaveStatus("error");

          setSaveError(error.message || "Could not save answers.");

          throw error;
        }
      }
    };

    const promise = saveLoop().finally(() => {
      inFlightSaveRef.current = null;
    });

    inFlightSaveRef.current = promise;

    await promise;
  }, [session.attemptId, session.attemptToken]);

  const queueAnswer = (questionId, selectedOptionIndex) => {
    setPageError("");

    setAnswers((current) => {
      const next = {
        ...current,
      };

      if (selectedOptionIndex === null) {
        delete next[questionId];
      } else {
        next[questionId] = selectedOptionIndex;
      }

      return next;
    });

    pendingAnswersRef.current.set(questionId, selectedOptionIndex);

    setSaveStatus("saving");

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      flushPendingAnswers().catch(() => {
        // Error is shown
        // through saveError.
      });
    }, 500);
  };

  const submitCurrentAttempt = useCallback(
    async ({ expired = false } = {}) => {
      if (submitLockRef.current || isSubmitting) {
        return;
      }

      const answeredCount = Object.keys(answers).length;

      const unanswered = attempt.questions.length - answeredCount;

      if (!expired && unanswered > 0) {
        const confirmed = window.confirm(
          `${unanswered} questions are unanswered. Submit anyway?`,
        );

        if (!confirmed) {
          return;
        }
      }

      submitLockRef.current = true;

      setPageError("");

      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);

        debounceTimerRef.current = null;
      }

      try {
        try {
          await flushPendingAnswers();
        } catch (saveFailure) {
          if (!expired && saveFailure?.status !== 409) {
            throw saveFailure;
          }
        }

        await onSubmit();
      } catch (error) {
        submitLockRef.current = false;

        setPageError(error.message || "Could not submit the exam.");
      }
    },
    [
      answers,
      attempt.questions.length,
      flushPendingAnswers,
      isSubmitting,
      onSubmit,
    ],
  );

  useEffect(() => {
    if (remainingSeconds !== 0) {
      return;
    }

    submitCurrentAttempt({
      expired: true,
    });
  }, [remainingSeconds, submitCurrentAttempt]);

  const answeredCount = Object.keys(answers).length;

  const progress =
    attempt.questionCount > 0
      ? Math.round((answeredCount / attempt.questionCount) * 100)
      : 0;

  return (
    <main className="min-h-screen bg-slate-50 pb-32 dark:bg-slate-950">
      <div className="sticky top-16 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold">
              Answered {answeredCount}/{attempt.questionCount}
            </div>

            <div className="flex items-center gap-3">
              <SaveIndicator status={saveStatus} />

              {remainingSeconds !== null && (
                <span
                  className={[
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold",
                    remainingSeconds <= 60
                      ? "bg-red-50 text-red-600 dark:bg-red-950/30"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                  ].join(" ")}
                >
                  <Clock size={14} />

                  {formatTime(remainingSeconds)}
                </span>
              )}
            </div>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
              {attempt.questionCount} questions
            </span>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
              Version {attempt.version}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">
            {attempt.exam.title}
          </h1>

          {attempt.exam.description && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-500 dark:text-slate-400">
              {attempt.exam.description}
            </p>
          )}

          {attempt.participantName && (
            <p className="mt-4 text-sm text-slate-500">
              Participant:{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {attempt.participantName}
              </strong>
            </p>
          )}
        </section>

        <details className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <summary className="cursor-pointer text-sm font-semibold">
            Question navigator
          </summary>

          <div className="mt-4 grid grid-cols-8 gap-2 sm:grid-cols-12">
            {attempt.questions.map((question, index) => {
              const answered = answers[question.id] !== undefined;

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => {
                    document
                      .getElementById(`question-${question.id}`)
                      ?.scrollIntoView({
                        behavior: "smooth",

                        block: "center",
                      });
                  }}
                  className={[
                    "flex aspect-square items-center justify-center rounded-lg text-xs font-bold",
                    answered
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                  ].join(" ")}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </details>

        {saveError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {saveError}
          </div>
        )}

        <section className="mt-5 space-y-4">
          {attempt.questions.map((question, questionIndex) => {
            const selectedIndex = answers[question.id];

            return (
              <article
                key={question.id}
                id={`question-${question.id}`}
                className="scroll-mt-36 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold dark:bg-slate-800">
                    {questionIndex + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      {question.subjectName && (
                        <span className="text-xs text-slate-400">
                          {question.subjectName}
                        </span>
                      )}

                      {question.topicName && (
                        <span className="text-xs text-slate-400">
                          • {question.topicName}
                        </span>
                      )}
                    </div>

                    <h2 className="mt-1 whitespace-pre-wrap text-base font-semibold leading-7 sm:text-lg">
                      {question.questionText}
                    </h2>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5">
                  {question.options.map((option, optionIndex) => {
                    const selected = selectedIndex === optionIndex;

                    return (
                      <button
                        key={option.index}
                        type="button"
                        onClick={() => queueAnswer(question.id, optionIndex)}
                        className={[
                          "flex w-full items-start gap-3 rounded-xl border px-3 py-3.5 text-left text-sm transition sm:px-4",
                          selected
                            ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                            selected
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900",
                          ].join(" ")}
                        >
                          {selected ? (
                            <Check size={15} />
                          ) : (
                            String.fromCharCode(65 + optionIndex)
                          )}
                        </span>

                        <span className="pt-1 leading-5">{option.text}</span>
                      </button>
                    );
                  })}
                </div>

                {selectedIndex !== undefined && (
                  <button
                    type="button"
                    onClick={() => queueAnswer(question.id, null)}
                    className="mt-3 text-xs font-semibold text-slate-400 hover:text-red-600"
                  >
                    Clear answer
                  </button>
                )}
              </article>
            );
          })}
        </section>

        {pageError && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {pageError}
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {answeredCount}/{attempt.questionCount} answered
            </p>

            <p className="truncate text-xs text-slate-400">
              Answers are automatically saved.
            </p>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => submitCurrentAttempt()}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white disabled:opacity-60"
          >
            <Send size={17} />

            {isSubmitting ? "Submitting..." : "Submit Exam"}
          </button>
        </div>
      </div>
    </main>
  );
}

function SaveIndicator({ status }) {
  if (status === "saving") {
    return (
      <span className="text-xs font-semibold text-amber-600">Saving...</span>
    );
  }

  if (status === "error") {
    return (
      <span className="text-xs font-semibold text-red-600">Save failed</span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
      <Save size={13} />
      Saved
    </span>
  );
}

function LoadingScreen({ message }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 dark:border-slate-800" />

        <p className="mt-4 text-sm font-medium text-slate-500">{message}</p>
      </div>
    </main>
  );
}

function ResumeErrorView({ message, onRetry, onForget }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950/20">
        <TriangleAlert size={38} className="mx-auto text-amber-600" />

        <h1 className="mt-4 text-xl font-bold">Could not resume exam</h1>

        <p className="mt-2 text-sm text-slate-500">{message}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white"
          >
            <RotateCcw size={16} />
            Retry
          </button>

          <button
            type="button"
            onClick={onForget}
            className="h-11 rounded-xl border border-amber-300 px-5 text-sm font-semibold"
          >
            Forget Saved Attempt
          </button>
        </div>
      </div>
    </main>
  );
}

function ResultErrorView({ message, onRetry }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
        <TriangleAlert size={38} className="mx-auto text-red-500" />

        <h1 className="mt-4 text-xl font-bold">Could not load result</h1>

        <p className="mt-2 text-sm text-slate-500">{message}</p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white"
        >
          <RotateCcw size={16} />
          Retry
        </button>
      </div>
    </main>
  );
}

function SubmittedView({ attempt }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 text-center dark:border-slate-800 dark:bg-slate-900">
        <CheckCircle2 size={44} className="mx-auto text-emerald-600" />

        <h1 className="mt-5 text-2xl font-bold">Exam Submitted</h1>

        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Your answers have been submitted successfully. This exam does not show
          results immediately.
        </p>

        {attempt.submissionReason === "time_expired" && (
          <p className="mt-3 text-sm font-semibold text-amber-600">
            The exam was submitted because the time limit expired.
          </p>
        )}

        <Link
          to="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white"
        >
          Back Home
        </Link>
      </section>
    </main>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
      <p className="text-xs text-slate-400">{label}</p>

      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function getRemainingSeconds(expiresAt) {
  if (!expiresAt) {
    return null;
  }

  return Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000),
  );
}

function formatTime(seconds) {
  if (seconds === null) {
    return "";
  }

  const minutes = Math.floor(seconds / 60);

  const remaining = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(
    2,
    "0",
  )}`;
}

export default PublicExamPage;
