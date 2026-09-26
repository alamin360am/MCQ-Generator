import { useState } from "react";

import { X } from "lucide-react";

function TaxonomyModal({
  open,
  mode,
  subjects = [],
  defaultSubjectId = "",
  onClose,
  onSubmit,
  isSubmitting = false,
}) {
  const [name, setName] = useState("");

  const [subjectId, setSubjectId] = useState(defaultSubjectId || "");

  const [error, setError] = useState("");

  if (!open) {
    return null;
  }

  const isTopic = mode === "topic";

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (name.trim().length < 2) {
      setError("Name must contain at least 2 characters");

      return;
    }

    if (isTopic && !subjectId) {
      setError("Please select a subject");

      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        subjectId,
      });
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-3xl dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isTopic ? "Create Topic" : "Create Subject"}
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {isTopic
                ? "Add a topic under one of your subjects."
                : "Add a new subject to organize questions."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isTopic && (
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Subject
              </label>

              <select
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">Select subject</option>

                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold">
              {isTopic ? "Topic name" : "Subject name"}
            </label>

            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              placeholder={
                isTopic ? "e.g. Constitution" : "e.g. Bangladesh Affairs"
              }
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
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
              className="h-12 flex-1 rounded-xl bg-emerald-600 font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaxonomyModal;
