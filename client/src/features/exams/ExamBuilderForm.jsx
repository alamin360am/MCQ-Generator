import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileQuestion,
  Search,
} from "lucide-react";

import {
  fetchQuestions,
  fetchSubjects,
  fetchTopics,
} from "../questions/questionApi";

function ExamBuilderForm({
  initialExam = null,
  onSubmit,
  isSubmitting = false,
}) {
  const [title, setTitle] = useState(initialExam?.title || "");

  const [description, setDescription] = useState(
    initialExam?.description || "",
  );

  const [visibility, setVisibility] = useState(
    initialExam?.visibility || "unlisted",
  );

  const [durationMinutes, setDurationMinutes] = useState(
    initialExam?.settings?.durationMinutes ?? "",
  );

  const [shuffleQuestions, setShuffleQuestions] = useState(
    initialExam?.settings?.shuffleQuestions ?? false,
  );

  const [shuffleOptions, setShuffleOptions] = useState(
    initialExam?.settings?.shuffleOptions ?? false,
  );

  const [allowRetake, setAllowRetake] = useState(
    initialExam?.settings?.allowRetake ?? true,
  );

  const [showResultImmediately, setShowResultImmediately] = useState(
    initialExam?.settings?.showResultImmediately ?? true,
  );

  const [collectParticipantName, setCollectParticipantName] = useState(
    initialExam?.settings?.collectParticipantName ?? false,
  );

  const [selectedQuestionIds, setSelectedQuestionIds] = useState(
    () => new Set(initialExam?.questionIds || []),
  );

  const [search, setSearch] = useState("");

  const [subjectId, setSubjectId] = useState("");

  const [topicId, setTopicId] = useState("");

  const [difficulty, setDifficulty] = useState("");

  const [page, setPage] = useState(1);

  const [formError, setFormError] = useState("");

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],

    queryFn: fetchSubjects,
  });

  const topicsQuery = useQuery({
    queryKey: ["topics"],

    queryFn: () => fetchTopics(),
  });

  const questionsQuery = useQuery({
    queryKey: [
      "exam-question-picker",
      {
        page,
        search,
        subjectId,
        topicId,
        difficulty,
      },
    ],

    queryFn: () =>
      fetchQuestions({
        page,
        limit: 20,
        search,
        subjectId,
        topicId,
        difficulty,
      }),

    placeholderData: (previousData) => previousData,
  });

  const subjects = subjectsQuery.data?.subjects || [];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const topics = topicsQuery.data?.topics || [];

  const questions = questionsQuery.data?.questions || [];

  const pagination = questionsQuery.data?.pagination;

  const filteredTopics = useMemo(() => {
    if (!subjectId) {
      return [];
    }

    return topics.filter((topic) => {
      const topicSubjectId =
        typeof topic.subject === "object" ? topic.subject?._id : topic.subject;

      return topicSubjectId === subjectId;
    });
  }, [subjectId, topics]);

  const selectedCount = selectedQuestionIds.size;

  const toggleQuestion = (questionId) => {
    setSelectedQuestionIds((current) => {
      const next = new Set(current);

      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }

      return next;
    });
  };

  const selectVisibleQuestions = () => {
    setSelectedQuestionIds((current) => {
      const next = new Set(current);

      questions.forEach((question) => {
        next.add(question._id);
      });

      return next;
    });
  };

  const clearVisibleQuestions = () => {
    setSelectedQuestionIds((current) => {
      const next = new Set(current);

      questions.forEach((question) => {
        next.delete(question._id);
      });

      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");

    if (title.trim().length < 2) {
      setFormError("Please enter an exam title.");

      return;
    }

    if (selectedCount < 1) {
      setFormError("Select at least one question.");

      return;
    }

    let normalizedDuration = null;

    if (durationMinutes !== "") {
      normalizedDuration = Number(durationMinutes);

      if (
        !Number.isInteger(normalizedDuration) ||
        normalizedDuration < 1 ||
        normalizedDuration > 600
      ) {
        setFormError("Duration must be between 1 and 600 minutes.");

        return;
      }
    }

    try {
      await onSubmit({
        title: title.trim(),

        description: description.trim(),

        questionIds: Array.from(selectedQuestionIds),

        visibility,

        settings: {
          durationMinutes: normalizedDuration,

          shuffleQuestions,

          shuffleOptions,

          allowRetake,

          showResultImmediately,

          collectParticipantName,
        },
      });
    } catch (error) {
      setFormError(error.message || "Could not save the exam.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-bold text-slate-900 dark:text-white">
          Exam Details
        </h2>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Exam title
            </label>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. BCS Bangladesh Affairs Mock Test 01"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Description
              <span className="ml-1 font-normal text-slate-400">optional</span>
            </label>

            <textarea
              rows="3"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Short instructions or description..."
              className="w-full resize-y rounded-xl border border-slate-200 bg-white p-4 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Visibility
              </label>

              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="unlisted">Unlisted</option>

                <option value="private">Private</option>

                <option value="public">Public</option>
              </select>

              <p className="mt-1.5 text-xs text-slate-400">
                Unlisted exams can be opened by anyone with the link.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Duration
              </label>

              <div className="relative">
                <Clock
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="number"
                  min="1"
                  max="600"
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(event.target.value)}
                  placeholder="No time limit"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-16 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  min
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-bold">Exam Settings</h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <SettingToggle
            label="Shuffle questions"
            description="Randomize question order for attempts."
            checked={shuffleQuestions}
            onChange={setShuffleQuestions}
          />

          <SettingToggle
            label="Shuffle options"
            description="Randomize answer option order."
            checked={shuffleOptions}
            onChange={setShuffleOptions}
          />

          <SettingToggle
            label="Allow retake"
            description="Participants may attempt the exam again."
            checked={allowRetake}
            onChange={setAllowRetake}
          />

          <SettingToggle
            label="Show result immediately"
            description="Show score after submission."
            checked={showResultImmediately}
            onChange={setShowResultImmediately}
          />

          <SettingToggle
            label="Ask participant name"
            description="Guest participant enters a name before the exam."
            checked={collectParticipantName}
            onChange={setCollectParticipantName}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold">Select Questions</h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {selectedCount} questions selected
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectVisibleQuestions}
              className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold dark:bg-slate-800"
            >
              Select page
            </button>

            <button
              type="button"
              onClick={clearVisibleQuestions}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-700"
            >
              Clear page
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);

                setPage(1);
              }}
              placeholder="Search Question Bank..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <select
            value={subjectId}
            onChange={(event) => {
              setSubjectId(event.target.value);

              setTopicId("");
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="">All subjects</option>

            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </select>

          <select
            value={difficulty}
            onChange={(event) => {
              setDifficulty(event.target.value);

              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="">All difficulties</option>

            <option value="easy">Easy</option>

            <option value="medium">Medium</option>

            <option value="hard">Hard</option>
          </select>
        </div>

        {subjectId && (
          <div className="mt-3">
            <select
              value={topicId}
              onChange={(event) => {
                setTopicId(event.target.value);

                setPage(1);
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 sm:max-w-xs dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">All topics</option>

              {filteredTopics.map((topic) => (
                <option key={topic._id} value={topic._id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-5">
          {questionsQuery.isLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 dark:border-slate-800" />
            </div>
          ) : questions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
              <FileQuestion size={30} className="mx-auto text-slate-400" />

              <p className="mt-3 text-sm font-semibold">No questions found.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {questions.map((question) => {
                const selected = selectedQuestionIds.has(question._id);

                return (
                  <button
                    key={question._id}
                    type="button"
                    onClick={() => toggleQuestion(question._id)}
                    className={[
                      "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition",
                      selected
                        ? "border-emerald-400 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                        selected
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-300 dark:border-slate-600",
                      ].join(" ")}
                    >
                      {selected && <Check size={14} />}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block font-medium leading-6 text-slate-900 dark:text-white">
                        {question.questionText}
                      </span>

                      <span className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                        <span className="capitalize">
                          {question.difficulty}
                        </span>

                        {question.subject?.name && (
                          <span>{question.subject.name}</span>
                        )}

                        {question.topic?.name && (
                          <span>{question.topic.name}</span>
                        )}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {pagination && (
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                disabled={!pagination.hasPreviousPage}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-semibold disabled:opacity-30"
              >
                <ChevronLeft size={17} />
                Previous
              </button>

              <span className="text-xs text-slate-500">
                Page {pagination.page} / {pagination.totalPages}
              </span>

              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((current) => current + 1)}
                className="flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-semibold disabled:opacity-30"
              >
                Next
                <ChevronRight size={17} />
              </button>
            </div>
          )}
        </div>
      </section>

      {formError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {formError}
        </div>
      )}

      <div className="sticky bottom-20 z-20 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur lg:bottom-4 dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            <strong className="text-emerald-600">{selectedCount}</strong>{" "}
            questions selected
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 rounded-xl bg-emerald-600 px-6 font-bold text-white disabled:opacity-50"
          >
            {isSubmitting
              ? "Saving..."
              : initialExam
                ? "Save Changes"
                : "Save Draft"}
          </button>
        </div>
      </div>
    </form>
  );
}

function SettingToggle({ label, description, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div>
        <p className="text-sm font-semibold">{label}</p>

        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-5 w-5 shrink-0 accent-emerald-600"
      />
    </label>
  );
}

export default ExamBuilderForm;
