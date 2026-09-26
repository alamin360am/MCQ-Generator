import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileQuestion,
  Plus,
  Search,
  X,
} from "lucide-react";

import QuestionCard from "../../features/questions/QuestionCard";
import QuestionFormModal from "../../features/questions/QuestionFormModal";
import TaxonomyModal from "../../features/questions/TaxonomyModal";

import {
  createQuestion,
  createSubject,
  createTopic,
  deleteQuestion,
  fetchQuestions,
  fetchSubjects,
  fetchTopics,
  toggleQuestionBookmark,
  updateQuestion,
} from "../../features/questions/questionApi";

import useDebouncedValue from "../../hooks/useDebouncedValue";

function QuestionsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");

  const debouncedSearch = useDebouncedValue(search, 400);

  const [page, setPage] = useState(1);

  const [subjectId, setSubjectId] = useState("");

  const [topicId, setTopicId] = useState("");

  const [difficulty, setDifficulty] = useState("");

  const [bookmarked, setBookmarked] = useState(false);

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [questionModalOpen, setQuestionModalOpen] = useState(false);

  const [editingQuestion, setEditingQuestion] = useState(null);

  const [taxonomyModal, setTaxonomyModal] = useState({
    open: false,
    mode: "subject",
    subjectId: "",
  });

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
      "questions",
      {
        page,
        search: debouncedSearch,
        subjectId,
        topicId,
        difficulty,
        bookmarked,
      },
    ],

    queryFn: () =>
      fetchQuestions({
        page,

        limit: 10,

        search: debouncedSearch,

        subjectId,

        topicId,

        difficulty,

        bookmarked: bookmarked ? "true" : "",
      }),

    placeholderData: (previousData) => previousData,
  });

  const subjects = subjectsQuery.data?.subjects || [];

  const topics = topicsQuery.data?.topics || [];

  const questions = questionsQuery.data?.questions || [];

  const pagination = questionsQuery.data?.pagination;

  const createQuestionMutation = useMutation({
    mutationFn: createQuestion,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["questions"],
      });

      setQuestionModalOpen(false);

      setEditingQuestion(null);
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: updateQuestion,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["questions"],
      });

      setQuestionModalOpen(false);

      setEditingQuestion(null);
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: deleteQuestion,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["questions"],
      });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: toggleQuestionBookmark,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["questions"],
      });
    },
  });

  const subjectMutation = useMutation({
    mutationFn: createSubject,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["subjects"],
      });

      setTaxonomyModal({
        open: false,
        mode: "subject",
        subjectId: "",
      });
    },
  });

  const topicMutation = useMutation({
    mutationFn: createTopic,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["topics"],
      });

      setTaxonomyModal({
        open: false,
        mode: "topic",
        subjectId: "",
      });
    },
  });

  const handleSaveQuestion = async (payload) => {
    if (editingQuestion) {
      await updateQuestionMutation.mutateAsync({
        id: editingQuestion._id,

        payload,
      });

      return;
    }

    await createQuestionMutation.mutateAsync(payload);
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);

    setQuestionModalOpen(true);
  };

  const handleDelete = async (question) => {
    const confirmed = window.confirm("Delete this question permanently?");

    if (!confirmed) {
      return;
    }

    await deleteQuestionMutation.mutateAsync(question._id);
  };

  const openCreateQuestion = () => {
    setEditingQuestion(null);

    setQuestionModalOpen(true);
  };

  const filteredTopics = subjectId
    ? topics.filter((topic) => {
        const topicSubjectId =
          typeof topic.subject === "object"
            ? topic.subject?._id
            : topic.subject;

        return topicSubjectId === subjectId;
      })
    : topics;

  const hasActiveFilters = Boolean(
    subjectId || topicId || difficulty || bookmarked,
  );

  const clearFilters = () => {
    setSubjectId("");
    setTopicId("");
    setDifficulty("");
    setBookmarked(false);
    setPage(1);
  };

  return (
    <>
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Question Bank
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create, organize and reuse all your MCQ questions.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateQuestion}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white"
          >
            <Plus size={18} />
            Add Question
          </button>
        </div>

        <div className="mt-6 flex gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);

                setPage(1);
              }}
              placeholder="Search questions..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900"
            />
          </div>

          <button
            type="button"
            onClick={() => setFiltersOpen((value) => !value)}
            className={[
              "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border",
              hasActiveFilters
                ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30"
                : "border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
            ].join(" ")}
          >
            <Filter size={19} />
          </button>
        </div>

        {filtersOpen && (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-3 md:grid-cols-3">
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
                value={topicId}
                onChange={(event) => {
                  setTopicId(event.target.value);

                  setPage(1);
                }}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">All topics</option>

                {filteredTopics.map((topic) => (
                  <option key={topic._id} value={topic._id}>
                    {topic.name}
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

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setBookmarked((value) => !value);

                  setPage(1);
                }}
                className={[
                  "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold",
                  bookmarked
                    ? "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/30"
                    : "border-slate-200 dark:border-slate-700",
                ].join(" ")}
              >
                <Bookmark size={16} />
                Bookmarked
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500"
                >
                  <X size={15} />
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-6">
          {questionsQuery.isLoading ? (
            <div className="flex min-h-56 items-center justify-center">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 dark:border-slate-800" />
            </div>
          ) : questionsQuery.isError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              {questionsQuery.error.message}
            </div>
          ) : questions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
              <FileQuestion size={36} className="mx-auto text-slate-400" />

              <h3 className="mt-4 font-bold">No questions found</h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                {hasActiveFilters || search
                  ? "Try changing your search or filters."
                  : "Create your first MCQ to start building your question bank."}
              </p>

              {!hasActiveFilters && !search && (
                <button
                  type="button"
                  onClick={openCreateQuestion}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <Plus size={17} />
                  Create Question
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <QuestionCard
                  key={question._id}
                  question={question}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onBookmark={(item) => bookmarkMutation.mutate(item._id)}
                />
              ))}
            </div>
          )}
        </div>

        {pagination && pagination.total > 0 && (
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage}
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              className="flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-semibold disabled:opacity-30"
            >
              <ChevronLeft size={17} />

              <span className="hidden sm:inline">Previous</span>
            </button>

            <p className="text-sm text-slate-500">
              Page{" "}
              <strong className="text-slate-900 dark:text-white">
                {pagination.page}
              </strong>{" "}
              of{" "}
              <strong className="text-slate-900 dark:text-white">
                {pagination.totalPages}
              </strong>
            </p>

            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((current) => current + 1)}
              className="flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-semibold disabled:opacity-30"
            >
              <span className="hidden sm:inline">Next</span>

              <ChevronRight size={17} />
            </button>
          </div>
        )}
      </div>

      {questionModalOpen && (
        <QuestionFormModal
          key={editingQuestion?._id || "new-question"}
          open
          question={editingQuestion}
          subjects={subjects}
          topics={topics}
          isSubmitting={
            createQuestionMutation.isPending || updateQuestionMutation.isPending
          }
          onClose={() => {
            setQuestionModalOpen(false);

            setEditingQuestion(null);
          }}
          onSubmit={handleSaveQuestion}
          onCreateSubject={() =>
            setTaxonomyModal({
              open: true,
              mode: "subject",
              subjectId: "",
            })
          }
          onCreateTopic={(currentSubjectId) =>
            setTaxonomyModal({
              open: true,
              mode: "topic",
              subjectId: currentSubjectId,
            })
          }
        />
      )}

      {taxonomyModal.open && (
        <TaxonomyModal
          key={`${taxonomyModal.mode}-${taxonomyModal.subjectId || "none"}`}
          open
          mode={taxonomyModal.mode}
          subjects={subjects}
          defaultSubjectId={taxonomyModal.subjectId}
          isSubmitting={
            taxonomyModal.mode === "subject"
              ? subjectMutation.isPending
              : topicMutation.isPending
          }
          onClose={() =>
            setTaxonomyModal({
              open: false,
              mode: "subject",
              subjectId: "",
            })
          }
          onSubmit={async ({ name, subjectId: selectedSubjectId }) => {
            if (taxonomyModal.mode === "subject") {
              await subjectMutation.mutateAsync(name);

              return;
            }

            await topicMutation.mutateAsync({
              name,

              subjectId: selectedSubjectId,
            });
          }}
        />
      )}
    </>
  );
}

export default QuestionsPage;
