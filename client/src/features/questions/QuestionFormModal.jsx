import { zodResolver } from "@hookform/resolvers/zod";

import { useFieldArray, useForm, useWatch } from "react-hook-form";

import { Plus, Trash2, X } from "lucide-react";

import { questionFormSchema } from "./questionSchema";
import { useState } from "react";

const createEmptyOptions = () => [
  { text: "" },
  { text: "" },
  { text: "" },
  { text: "" },
];

function QuestionFormModal({
  open,
  question = null,
  subjects = [],
  topics = [],
  onClose,
  onSubmit,
  onCreateSubject,
  onCreateTopic,
  isSubmitting = false,
}) {
  const isEditing = Boolean(question);

  const [submitError, setSubmitError] = useState("");

  const {
    register,
    control,
    handleSubmit,
    setValue,

    formState: { errors },
  } = useForm({
    resolver: zodResolver(questionFormSchema),

    defaultValues: question
      ? {
          questionText: question.questionText,

          options: question.options.map((option) => ({
            text: option.text,
          })),

          correctOptionIndex: question.correctOptionIndex,

          explanation: question.explanation || "",

          subjectId: question.subject?._id || "",

          topicId: question.topic?._id || "",

          difficulty: question.difficulty || "medium",

          tagsText: question.tags?.join(", ") || "",
        }
      : {
          questionText: "",

          options: createEmptyOptions(),

          correctOptionIndex: 0,

          explanation: "",

          subjectId: "",

          topicId: "",

          difficulty: "medium",

          tagsText: "",
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  const selectedSubjectId = useWatch({
    control,
    name: "subjectId",
  });

  const correctOptionIndex = useWatch({
    control,
    name: "correctOptionIndex",
  });

  const filteredTopics = topics.filter((topic) => {
    const topicSubjectId =
      typeof topic.subject === "object" ? topic.subject?._id : topic.subject;

    return !selectedSubjectId || topicSubjectId === selectedSubjectId;
  });

  if (!open) {
    return null;
  }

  const submitForm = async (values) => {
    setSubmitError("");

    const tags = values.tagsText
      ? values.tagsText
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

    try {
      await onSubmit({
        questionText: values.questionText,

        options: values.options,

        correctOptionIndex: values.correctOptionIndex,

        explanation: values.explanation || "",

        subjectId: values.subjectId || null,

        topicId: values.topicId || null,

        difficulty: values.difficulty,

        tags,
      });
    } catch (error) {
      setSubmitError(error.message || "Could not save the question");
    }
  };

  const addOption = () => {
    if (fields.length >= 6) {
      return;
    }

    append({
      text: "",
    });
  };

  const removeOption = (index) => {
    if (fields.length <= 2) {
      return;
    }

    remove(index);

    if (correctOptionIndex === index) {
      setValue("correctOptionIndex", 0);
    } else if (correctOptionIndex > index) {
      setValue("correctOptionIndex", correctOptionIndex - 1);
    }
  };

  const subjectField = register("subjectId");

  return (
    <div className="fixed inset-0 z-90 overflow-y-auto bg-slate-950/50 backdrop-blur-sm">
      <div className="flex min-h-full items-end justify-center sm:items-center sm:p-5">
        <div className="w-full bg-white sm:max-w-3xl sm:rounded-3xl dark:bg-slate-900">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:rounded-t-3xl dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h2 className="text-lg font-bold">
                {isEditing ? "Edit Question" : "Create Question"}
              </h2>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Create a reusable MCQ for your question bank.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800"
            >
              <X size={19} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit(submitForm)}
            className="space-y-6 p-5 sm:p-6"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Question
              </label>

              <textarea
                rows="4"
                placeholder="Write your question..."
                {...register("questionText")}
                className="w-full resize-y rounded-xl border border-slate-200 bg-white p-4 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
              />

              {errors.questionText && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.questionText.message}
                </p>
              )}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Options</h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Select the radio button beside the correct answer.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={fields.length >= 6}
                  onClick={addOption}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold disabled:opacity-40 dark:bg-slate-800"
                >
                  <Plus size={15} />
                  Add option
                </button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <label className="mt-3.5 flex cursor-pointer items-center">
                      <input
                        type="radio"
                        name="correctOptionIndex"
                        checked={correctOptionIndex === index}
                        onChange={() => {
                          setValue("correctOptionIndex", index, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                        className="h-4 w-4 accent-emerald-600"
                      />
                    </label>

                    <div className="flex-1">
                      <input
                        placeholder={`Option ${index + 1}`}
                        {...register(`options.${index}.text`)}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                      />

                      {errors.options?.[index]?.text && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.options[index].text.message}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={fields.length <= 2}
                      onClick={() => removeOption(index)}
                      className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30 dark:hover:bg-red-950/30"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>

              {errors.correctOptionIndex && (
                <p className="mt-2 text-xs text-red-600">
                  {errors.correctOptionIndex.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Explanation
                <span className="ml-1 font-normal text-slate-400">
                  optional
                </span>
              </label>

              <textarea
                rows="3"
                placeholder="Explain why the answer is correct..."
                {...register("explanation")}
                className="w-full resize-y rounded-xl border border-slate-200 bg-white p-4 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold">Subject</label>

                  <button
                    type="button"
                    onClick={onCreateSubject}
                    className="text-xs font-semibold text-emerald-600"
                  >
                    + New
                  </button>
                </div>
                <select
                  {...subjectField}
                  onChange={(event) => {
                    subjectField.onChange(event);

                    setValue("topicId", "", {
                      shouldValidate: true,
                    });
                  }}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
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
                    disabled={!selectedSubjectId}
                    onClick={() => onCreateTopic(selectedSubjectId)}
                    className="text-xs font-semibold text-emerald-600 disabled:text-slate-400"
                  >
                    + New
                  </button>
                </div>

                <select
                  {...register("topicId")}
                  disabled={!selectedSubjectId}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="">No topic</option>

                  {filteredTopics.map((topic) => (
                    <option key={topic._id} value={topic._id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Difficulty
                </label>

                <select
                  {...register("difficulty")}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="easy">Easy</option>

                  <option value="medium">Medium</option>

                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Tags</label>

                <input
                  {...register("tagsText")}
                  placeholder="constitution, bcs, important"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Separate tags with commas.
                </p>
              </div>
            </div>

            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                {submitError}
              </div>
            )}

            <div className="sticky bottom-0 -mx-5 -mb-5 flex gap-3 border-t border-slate-200 bg-white p-5 sm:-mx-6 sm:-mb-6 sm:rounded-b-3xl sm:px-6 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={onClose}
                className="h-12 flex-1 rounded-xl border border-slate-200 font-semibold dark:border-slate-700"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-12 flex-1 rounded-xl bg-emerald-600 font-bold text-white disabled:opacity-60"
              >
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Create Question"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default QuestionFormModal;
