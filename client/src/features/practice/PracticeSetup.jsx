import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import {
  Bookmark,
  Brain,
  History,
  ListFilter,
  Play,
  RotateCcw,
  Shuffle,
} from "lucide-react";

import { Link } from "react-router-dom";

import { fetchSubjects, fetchTopics } from "../questions/questionApi";

const modes = [
  {
    value: "random",
    title: "Random Practice",
    description: "Practice random questions from your Question Bank.",
    icon: Shuffle,
  },

  {
    value: "bookmarked",
    title: "Bookmarked",
    description: "Practice only the questions you bookmarked.",
    icon: Bookmark,
  },

  {
    value: "wrong",
    title: "Wrong Questions",
    description: "Retry questions that are still waiting for review.",
    icon: RotateCcw,
  },

  {
    value: "filtered",
    title: "Custom Practice",
    description: "Build a practice set using subject, topic and difficulty.",
    icon: ListFilter,
  },
];

function PracticeSetup({
  defaultMode = "random",
  onStart,
  isStarting = false,
  serverError = "",
}) {
  const [mode, setMode] = useState(defaultMode);

  const [count, setCount] = useState(10);

  const [subjectId, setSubjectId] = useState("");

  const [topicId, setTopicId] = useState("");

  const [difficulty, setDifficulty] = useState("");

  const [localError, setLocalError] = useState("");

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],

    queryFn: fetchSubjects,
  });

  const topicsQuery = useQuery({
    queryKey: ["topics"],

    queryFn: () => fetchTopics(),
  });

  const subjects = subjectsQuery.data?.subjects || [];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const topics = topicsQuery.data?.topics || [];

  const filteredTopics = useMemo(() => {
    if (!subjectId) {
      return [];
    }

    return topics.filter((topic) => {
      const currentSubjectId =
        typeof topic.subject === "object" ? topic.subject?._id : topic.subject;

      return currentSubjectId === subjectId;
    });
  }, [subjectId, topics]);

  const handleStart = async () => {
    setLocalError("");

    const normalizedCount = Number(count);

    if (
      !Number.isInteger(normalizedCount) ||
      normalizedCount < 1 ||
      normalizedCount > 100
    ) {
      setLocalError("Question count must be between 1 and 100.");

      return;
    }

    try {
      await onStart({
        mode,

        count: normalizedCount,

        subjectId: subjectId || null,

        topicId: topicId || null,

        difficulty: difficulty || null,
      });
    } catch {
      // Mutation error is
      // rendered below.
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Brain size={24} className="text-emerald-600" />

            <h2 className="text-xl font-bold">Practice</h2>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Practice from your Question Bank and build a personal learning
            history.
          </p>
        </div>

        <Link
          to="/app/practice/history"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold dark:border-slate-700"
        >
          <History size={17} />
          History
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {modes.map(({ value, title, description, icon: Icon }) => {
          const selected = mode === value;

          return (
            <button
              key={value}
              type="button"
              onClick={() => {
                setMode(value);
                setLocalError("");
              }}
              className={[
                "rounded-2xl border p-4 text-left transition",
                selected
                  ? "border-emerald-500 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/20"
                  : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900",
              ].join(" ")}
            >
              <div
                className={[
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  selected
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800",
                ].join(" ")}
              >
                <Icon size={19} />
              </div>

              <h3 className="mt-4 font-bold">{title}</h3>

              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {description}
              </p>
            </button>
          );
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-bold">Practice Settings</h3>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Questions
            </label>

            <input
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(event) => setCount(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Difficulty
            </label>

            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">All difficulties</option>

              <option value="easy">Easy</option>

              <option value="medium">Medium</option>

              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Subject</label>

            <select
              value={subjectId}
              onChange={(event) => {
                setSubjectId(event.target.value);

                setTopicId("");
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">All subjects</option>

              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Topic</label>

            <select
              value={topicId}
              disabled={!subjectId}
              onChange={(event) => setTopicId(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">All topics</option>

              {filteredTopics.map((topic) => (
                <option key={topic._id} value={topic._id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {mode === "wrong" && (
          <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
            Wrong Practice contains questions you previously answered
            incorrectly and have not corrected yet.
          </div>
        )}

        {mode === "bookmarked" && (
          <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            Only bookmarked questions matching the selected filters will be
            used.
          </div>
        )}

        {(localError || serverError) && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {localError || serverError}
          </div>
        )}

        <button
          type="button"
          disabled={isStarting}
          onClick={handleStart}
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 font-bold text-white disabled:opacity-60"
        >
          <Play size={18} fill="currentColor" />

          {isStarting ? "Starting..." : "Start Practice"}
        </button>
      </section>
    </div>
  );
}

export default PracticeSetup;
