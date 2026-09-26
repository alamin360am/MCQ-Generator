import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Check, RotateCcw, Save, Send, TriangleAlert } from "lucide-react";

import PracticeSetup from "../../features/practice/PracticeSetup";
import PracticeResultView from "../../features/practice/PracticeResultView";

import {
  fetchPracticeSession,
  savePracticeAnswers,
  startPractice,
  submitPractice,
} from "../../features/practice/practiceApi";

import {
  clearPracticeSessionId,
  readPracticeSessionId,
  savePracticeSessionId,
} from "../../features/practice/practiceStorage";

function PracticePage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const requestedMode = searchParams.get("mode");
  const [activeSessionId, setActiveSessionId] = useState(() =>
    readPracticeSessionId(),
  );

  const [preferredMode, setPreferredMode] = useState(() => {
    if (["random", "bookmarked", "wrong", "filtered"].includes(requestedMode)) {
      return requestedMode;
    }

    return "random";
  });

  const [setupVersion, setSetupVersion] = useState(0);

  const startMutation = useMutation({
    mutationFn: startPractice,

    onSuccess: (data) => {
      const session = data.session;

      savePracticeSessionId(session.id);

      queryClient.setQueryData(["practice-session", session.id], data);

      setActiveSessionId(session.id);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    },
  });

  const sessionQuery = useQuery({
    queryKey: ["practice-session", activeSessionId || "none"],

    queryFn: () => fetchPracticeSession(activeSessionId),

    enabled: Boolean(activeSessionId),

    retry: false,

    refetchOnWindowFocus: true,
  });

  const submitMutation = useMutation({
    mutationFn: () => submitPractice(activeSessionId),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["practice-session", activeSessionId],
      });

      queryClient.invalidateQueries({
        queryKey: ["practice-history"],
      });

      queryClient.invalidateQueries({
        queryKey: ["practice-stats"],
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    },
  });

  const leaveSession = (nextMode = "random") => {
    const oldId = activeSessionId;

    clearPracticeSessionId();

    setActiveSessionId(null);

    setPreferredMode(nextMode);

    setSetupVersion((current) => current + 1);

    if (oldId) {
      queryClient.removeQueries({
        queryKey: ["practice-session", oldId],
      });
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!activeSessionId) {
    return (
      <PracticeSetup
        key={`${preferredMode}-${setupVersion}`}
        defaultMode={preferredMode}
        isStarting={startMutation.isPending}
        serverError={startMutation.error?.message || ""}
        onStart={(payload) => startMutation.mutateAsync(payload)}
      />
    );
  }

  if (sessionQuery.isLoading) {
    return <LoadingState message="Loading practice session..." />;
  }

  if (sessionQuery.isError) {
    return (
      <ResumeError
        message={sessionQuery.error.message}
        onRetry={() => sessionQuery.refetch()}
        onForget={() => leaveSession("random")}
      />
    );
  }

  const session = sessionQuery.data?.session;

  if (!session) {
    return null;
  }

  if (session.status === "submitted") {
    return (
      <PracticeResultView
        result={session.result}
        onNewPractice={() => leaveSession("random")}
        onPracticeWrong={() => leaveSession("wrong")}
      />
    );
  }

  return (
    <ActivePractice
      key={session.id}
      session={session}
      isSubmitting={submitMutation.isPending}
      onSubmit={() => submitMutation.mutateAsync()}
    />
  );
}

function ActivePractice({ session, onSubmit, isSubmitting }) {
  const [answers, setAnswers] = useState(() =>
    Object.fromEntries(
      session.questions
        .filter(
          (question) =>
            question.selectedOptionIndex !== null &&
            question.selectedOptionIndex !== undefined,
        )
        .map((question) => [question.id, question.selectedOptionIndex]),
    ),
  );

  const [saveStatus, setSaveStatus] = useState("saved");

  const [saveError, setSaveError] = useState("");

  const [submitError, setSubmitError] = useState("");

  const pendingRef = useRef(new Map());

  const debounceRef = useRef(null);

  const inFlightRef = useRef(null);

  const submitLockRef = useRef(false);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const flushAnswers = useCallback(async () => {
    if (inFlightRef.current) {
      await inFlightRef.current;
    }

    if (pendingRef.current.size === 0) {
      return;
    }

    const saveLoop = async () => {
      while (pendingRef.current.size > 0) {
        const batch = Array.from(pendingRef.current.entries()).map(
          ([questionId, selectedOptionIndex]) => ({
            questionId,
            selectedOptionIndex,
          }),
        );

        pendingRef.current.clear();

        setSaveStatus("saving");

        setSaveError("");

        try {
          await savePracticeAnswers({
            sessionId: session.id,

            answers: batch,
          });

          setSaveStatus("saved");
        } catch (error) {
          batch.forEach((answer) => {
            if (!pendingRef.current.has(answer.questionId)) {
              pendingRef.current.set(
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
      inFlightRef.current = null;
    });

    inFlightRef.current = promise;

    await promise;
  }, [session.id]);

  const queueAnswer = (questionId, selectedOptionIndex) => {
    setSubmitError("");

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

    pendingRef.current.set(questionId, selectedOptionIndex);

    setSaveStatus("saving");

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      flushAnswers().catch(() => {});
    }, 500);
  };

  const handleSubmit = async () => {
    if (submitLockRef.current || isSubmitting) {
      return;
    }

    const answeredCount = Object.keys(answers).length;

    const unanswered = session.questionCount - answeredCount;

    if (unanswered > 0) {
      const confirmed = window.confirm(
        `${unanswered} questions are unanswered. Submit practice anyway?`,
      );

      if (!confirmed) {
        return;
      }
    }

    submitLockRef.current = true;

    setSubmitError("");

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);

      debounceRef.current = null;
    }

    try {
      await flushAnswers();

      await onSubmit();
    } catch (error) {
      submitLockRef.current = false;

      setSubmitError(error.message || "Could not submit practice.");
    }
  };

  const answeredCount = Object.keys(answers).length;

  const progress =
    session.questionCount > 0
      ? Math.round((answeredCount / session.questionCount) * 100)
      : 0;

  return (
    <div className="pb-28">
      <div className="sticky top-16 z-30 -mx-4 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold">Practice Session</p>

            <p className="mt-0.5 text-xs text-slate-400 capitalize">
              {session.mode}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold">
              {answeredCount}/{session.questionCount}
            </p>

            <SaveIndicator status={saveStatus} />
          </div>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      <details className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <summary className="cursor-pointer text-sm font-semibold">
          Question Navigator
        </summary>

        <div className="mt-4 grid grid-cols-8 gap-2 sm:grid-cols-12">
          {session.questions.map((question, index) => {
            const answered = answers[question.id] !== undefined;

            return (
              <button
                key={question.id}
                type="button"
                onClick={() =>
                  document
                    .getElementById(`practice-question-${question.id}`)
                    ?.scrollIntoView({
                      behavior: "smooth",

                      block: "center",
                    })
                }
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
        {session.questions.map((question, index) => {
          const selected = answers[question.id];

          return (
            <article
              key={question.id}
              id={`practice-question-${question.id}`}
              className="scroll-mt-36 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold dark:bg-slate-800">
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <span className="text-xs capitalize text-slate-400">
                    {question.difficulty}
                  </span>

                  <h3 className="mt-1 whitespace-pre-wrap text-base font-semibold leading-7 sm:text-lg">
                    {question.questionText}
                  </h3>
                </div>
              </div>

              <div className="mt-5 space-y-2.5">
                {question.options.map((option, optionIndex) => {
                  const isSelected = selected === optionIndex;

                  return (
                    <button
                      key={option.index}
                      type="button"
                      onClick={() => queueAnswer(question.id, optionIndex)}
                      className={[
                        "flex w-full items-start gap-3 rounded-xl border px-3 py-3.5 text-left text-sm transition sm:px-4",
                        isSelected
                          ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                          isSelected
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900",
                        ].join(" ")}
                      >
                        {isSelected ? (
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

              {selected !== undefined && (
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

      {submitError && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {submitError}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:left-(--sidebar-width,0px) dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {answeredCount}/{session.questionCount} answered
            </p>

            <p className="truncate text-xs text-slate-400">
              Answers are automatically saved.
            </p>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white disabled:opacity-60"
          >
            <Send size={17} />

            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
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
      <Save size={12} />
      Saved
    </span>
  );
}

function LoadingState({ message }) {
  return (
    <div className="flex min-h-64 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 dark:border-slate-800" />

        <p className="mt-4 text-sm text-slate-500">{message}</p>
      </div>
    </div>
  );
}

function ResumeError({ message, onRetry, onForget }) {
  return (
    <div className="mx-auto max-w-xl py-12">
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950/20">
        <TriangleAlert size={38} className="mx-auto text-amber-600" />

        <h2 className="mt-4 text-xl font-bold">Could not resume practice</h2>

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
            Forget Session
          </button>
        </div>
      </div>
    </div>
  );
}

export default PracticePage;
