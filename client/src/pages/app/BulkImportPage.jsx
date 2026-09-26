import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  CheckCircle2,
  ClipboardPaste,
  FileQuestion,
  RotateCcw,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";

import { Link } from "react-router-dom";

import ImportQuestionCard from "../../features/importer/ImportQuestionCard";

import {
  parseMcqText,
  validateImportQuestion,
} from "../../features/importer/mcqParser";

import TaxonomyModal from "../../features/questions/TaxonomyModal";

import {
  bulkImportQuestions,
  createSubject,
  createTopic,
  fetchSubjects,
  fetchTopics,
} from "../../features/questions/questionApi";

const exampleText = `1. বাংলাদেশের রাজধানী কোনটি?
A. চট্টগ্রাম
B. ঢাকা
C. খুলনা
D. রাজশাহী
ANSWER: B

2. বাংলাদেশের জাতীয় ফুল কোনটি?
A. গোলাপ
B. শাপলা
C. জবা
D. বেলি
ANSWER: B`;

function BulkImportPage() {
  const queryClient = useQueryClient();

  const [rawText, setRawText] = useState("");

  const [parsedQuestions, setParsedQuestions] = useState([]);

  const [subjectId, setSubjectId] = useState("");

  const [topicId, setTopicId] = useState("");

  const [defaultDifficulty, setDefaultDifficulty] = useState("medium");

  const [parseAttempted, setParseAttempted] = useState(false);

  const [importError, setImportError] = useState("");

  const [importSuccess, setImportSuccess] = useState(null);

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

  const subjects = subjectsQuery.data?.subjects || [];

  const topics = topicsQuery.data?.topics || [];

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

  const validQuestions = parsedQuestions.filter((question) => question.isValid);

  const invalidQuestions = parsedQuestions.filter(
    (question) => !question.isValid,
  );

  const tooManyQuestions = validQuestions.length > 200;

  const importMutation = useMutation({
    mutationFn: bulkImportQuestions,

    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["questions"],
      });

      setImportSuccess({
        count: data.importedCount,
      });

      setImportError("");
      setRawText("");
      setParsedQuestions([]);
      setParseAttempted(false);
    },
  });

  const subjectMutation = useMutation({
    mutationFn: createSubject,

    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["subjects"],
      });

      setSubjectId(data.subject._id);

      setTopicId("");

      setTaxonomyModal({
        open: false,
        mode: "subject",
        subjectId: "",
      });
    },
  });

  const topicMutation = useMutation({
    mutationFn: createTopic,

    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["topics"],
      });

      setTopicId(data.topic._id);

      setTaxonomyModal({
        open: false,
        mode: "topic",
        subjectId: "",
      });
    },
  });

  const handleParse = () => {
    setImportError("");
    setImportSuccess(null);
    setParseAttempted(true);

    if (!rawText.trim()) {
      setParsedQuestions([]);
      return;
    }

    const result = parseMcqText(rawText, defaultDifficulty);

    setParsedQuestions(result);
  };

  const handleQuestionChange = (localId, updatedQuestion) => {
    setParsedQuestions((current) =>
      current.map((question) =>
        question.localId === localId
          ? validateImportQuestion(updatedQuestion)
          : question,
      ),
    );
  };

  const handleQuestionDelete = (localId) => {
    setParsedQuestions((current) =>
      current.filter((question) => question.localId !== localId),
    );
  };

  const handleRemoveInvalid = () => {
    setParsedQuestions((current) =>
      current.filter((question) => question.isValid),
    );
  };

  const handleApplyDifficulty = () => {
    setParsedQuestions((current) =>
      current.map((question) =>
        validateImportQuestion({
          ...question,

          difficulty: defaultDifficulty,
        }),
      ),
    );
  };

  const handleReset = () => {
    setRawText("");
    setParsedQuestions([]);
    setParseAttempted(false);
    setImportError("");
    setImportSuccess(null);
  };

  const handleImport = async () => {
    setImportError("");
    setImportSuccess(null);

    if (validQuestions.length === 0) {
      setImportError("There are no valid questions to import.");

      return;
    }

    if (validQuestions.length > 200) {
      setImportError("You can import a maximum of 200 questions at once.");

      return;
    }

    const payload = {
      subjectId: subjectId || null,

      topicId: topicId || null,

      difficulty: defaultDifficulty,

      questions: validQuestions.map((question) => ({
        questionText: question.questionText.trim(),

        options: question.options.map((option) => ({
          text: option.text.trim(),
        })),

        correctOptionIndex: question.correctOptionIndex,

        explanation: question.explanation?.trim() || "",

        difficulty: question.difficulty,

        tags: question.tagsText
          ? question.tagsText
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
      })),
    };

    try {
      await importMutation.mutateAsync(payload);
    } catch (error) {
      setImportError(error.message || "Could not import questions.");
    }
  };

  return (
    <>
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Bulk MCQ Import
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Paste multiple formatted MCQs, review the detected questions and
            import them into your Question Bank.
          </p>
        </section>

        {importSuccess && (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" />

              <div>
                <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                  {importSuccess.count} questions imported successfully.
                </p>

                <Link
                  to="/app/questions"
                  className="mt-2 inline-block text-sm font-semibold text-emerald-700 underline dark:text-emerald-400"
                >
                  View Question Bank
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <ClipboardPaste size={21} />
            </div>

            <div>
              <h3 className="font-bold">Paste MCQs</h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Use A/B/C/D options and an ANSWER line for best results.
              </p>
            </div>
          </div>

          <textarea
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            rows="15"
            placeholder={exampleText}
            className="mt-5 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-7 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
          />

          <details className="mt-4 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-950">
            <summary className="cursor-pointer font-semibold">
              Supported format examples
            </summary>

            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-slate-500 dark:text-slate-400">
              {`1. Question text
A. Option one
B. Option two
C. Option three
D. Option four
ANSWER: B
EXPLANATION: Optional explanation

বাংলা format:
১। প্রশ্ন
ক. অপশন
খ. অপশন
গ. অপশন
ঘ. অপশন
উত্তর: খ`}
            </pre>
          </details>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleParse}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 font-bold text-white"
            >
              <FileQuestion size={18} />
              Parse Questions
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 font-semibold dark:border-slate-700"
            >
              <RotateCcw size={17} />
              Reset
            </button>
          </div>
        </section>

        {parseAttempted && parsedQuestions.length === 0 && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
            No questions could be detected. Check the formatting and try again.
          </section>
        )}

        {parsedQuestions.length > 0 && (
          <>
            <section className="grid grid-cols-3 gap-3">
              <SummaryCard label="Detected" value={parsedQuestions.length} />

              <SummaryCard label="Valid" value={validQuestions.length} good />

              <SummaryCard
                label="Invalid"
                value={invalidQuestions.length}
                warning
              />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-bold">Import Settings</h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                These settings apply to this import batch.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold">Subject</label>

                    <button
                      type="button"
                      onClick={() =>
                        setTaxonomyModal({
                          open: true,
                          mode: "subject",
                          subjectId: "",
                        })
                      }
                      className="text-xs font-semibold text-emerald-600"
                    >
                      + New
                    </button>
                  </div>

                  <select
                    value={subjectId}
                    onChange={(event) => {
                      setSubjectId(event.target.value);

                      setTopicId("");
                    }}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="">No subject</option>

                    {subjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold">Topic</label>

                    <button
                      type="button"
                      disabled={!subjectId}
                      onClick={() =>
                        setTaxonomyModal({
                          open: true,
                          mode: "topic",
                          subjectId,
                        })
                      }
                      className="text-xs font-semibold text-emerald-600 disabled:text-slate-400"
                    >
                      + New
                    </button>
                  </div>

                  <select
                    value={topicId}
                    disabled={!subjectId}
                    onChange={(event) => setTopicId(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="">No topic</option>

                    {filteredTopics.map((topic) => (
                      <option key={topic._id} value={topic._id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Default Difficulty
                  </label>

                  <div className="flex gap-2">
                    <select
                      value={defaultDifficulty}
                      onChange={(event) =>
                        setDefaultDifficulty(event.target.value)
                      }
                      className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="easy">Easy</option>

                      <option value="medium">Medium</option>

                      <option value="hard">Hard</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleApplyDifficulty}
                      className="shrink-0 rounded-xl border border-slate-200 px-3 text-xs font-semibold dark:border-slate-700"
                    >
                      Apply all
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {invalidQuestions.length > 0 && (
              <section className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-amber-950/20">
                <div className="flex items-start gap-3">
                  <TriangleAlert className="mt-0.5 shrink-0 text-amber-600" />

                  <div>
                    <p className="font-semibold text-amber-800 dark:text-amber-300">
                      {invalidQuestions.length} questions need attention.
                    </p>

                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                      Fix them below or remove them before importing.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveInvalid}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-800 dark:text-amber-300"
                >
                  <Trash2 size={16} />
                  Remove invalid
                </button>
              </section>
            )}

            {tooManyQuestions && (
              <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                Maximum 200 valid questions can be imported in one batch. Split
                this import into smaller batches.
              </section>
            )}

            <section>
              <div className="mb-4">
                <h3 className="font-bold">Review Questions</h3>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Correct any parsing mistakes before importing.
                </p>
              </div>

              <div className="space-y-4">
                {parsedQuestions.map((question, index) => (
                  <ImportQuestionCard
                    key={question.localId}
                    question={question}
                    index={index}
                    onChange={(updated) =>
                      handleQuestionChange(question.localId, updated)
                    }
                    onDelete={() => handleQuestionDelete(question.localId)}
                  />
                ))}
              </div>
            </section>

            {importError && (
              <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                {importError}
              </section>
            )}

            <section className="sticky bottom-20 z-20 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur lg:bottom-4 dark:border-slate-800 dark:bg-slate-900/95">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm">
                  <span className="font-bold text-emerald-600">
                    {validQuestions.length}
                  </span>{" "}
                  valid questions ready to import
                  {invalidQuestions.length > 0 && (
                    <span className="ml-2 text-slate-400">
                      ({invalidQuestions.length} invalid will be skipped)
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleImport}
                  disabled={
                    validQuestions.length === 0 ||
                    tooManyQuestions ||
                    importMutation.isPending
                  }
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload size={18} />

                  {importMutation.isPending
                    ? "Importing..."
                    : `Import ${validQuestions.length} Questions`}
                </button>
              </div>
            </section>
          </>
        )}
      </div>

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

function SummaryCard({ label, value, good = false, warning = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
      <p
        className={[
          "text-2xl font-bold",
          good
            ? "text-emerald-600"
            : warning
              ? "text-red-600"
              : "text-slate-900 dark:text-white",
        ].join(" ")}
      >
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

export default BulkImportPage;
