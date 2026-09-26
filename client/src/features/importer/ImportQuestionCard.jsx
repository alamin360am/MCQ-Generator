import { CheckCircle2, Plus, Trash2, TriangleAlert } from "lucide-react";

function ImportQuestionCard({ question, index, onChange, onDelete }) {
  const updateQuestion = (field, value) => {
    onChange({
      ...question,
      [field]: value,
    });
  };

  const updateOption = (optionIndex, value) => {
    const options = question.options.map((option, currentIndex) =>
      currentIndex === optionIndex
        ? {
            ...option,
            text: value,
          }
        : option,
    );

    updateQuestion("options", options);
  };

  const addOption = () => {
    if (question.options.length >= 6) {
      return;
    }

    updateQuestion("options", [
      ...question.options,
      {
        text: "",
      },
    ]);
  };

  const removeOption = (optionIndex) => {
    if (question.options.length <= 2) {
      return;
    }

    const options = question.options.filter(
      (_, currentIndex) => currentIndex !== optionIndex,
    );

    let correctOptionIndex = question.correctOptionIndex;

    if (correctOptionIndex === optionIndex) {
      correctOptionIndex = null;
    } else if (
      Number.isInteger(correctOptionIndex) &&
      correctOptionIndex > optionIndex
    ) {
      correctOptionIndex -= 1;
    }

    onChange({
      ...question,
      options,
      correctOptionIndex,
    });
  };

  return (
    <article
      className={[
        "rounded-2xl border bg-white p-4 sm:p-5 dark:bg-slate-900",
        question.isValid
          ? "border-slate-200 dark:border-slate-800"
          : "border-red-300 dark:border-red-900",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-white">
            Question {index + 1}
          </span>

          {question.isValid ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 size={13} />
              Valid
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-400">
              <TriangleAlert size={13} />
              Needs fix
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
          title="Remove question"
        >
          <Trash2 size={17} />
        </button>
      </div>

      {!question.isValid && (
        <div className="mt-3 rounded-xl bg-red-50 p-3 dark:bg-red-950/20">
          <ul className="space-y-1 text-xs text-red-700 dark:text-red-400">
            {question.errors.map((error) => (
              <li key={error}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {question.warnings?.length > 0 && (
        <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
          {question.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      )}

      <div className="mt-4">
        <label className="mb-2 block text-sm font-semibold">Question</label>

        <textarea
          rows="3"
          value={question.questionText}
          onChange={(event) =>
            updateQuestion("questionText", event.target.value)
          }
          className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
        />
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold">Options</h4>

            <p className="mt-1 text-xs text-slate-500">
              Select the correct answer.
            </p>
          </div>

          <button
            type="button"
            disabled={question.options.length >= 6}
            onClick={addOption}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold disabled:opacity-40 dark:bg-slate-800"
          >
            <Plus size={14} />
            Add
          </button>
        </div>

        <div className="space-y-2">
          {question.options.map((option, optionIndex) => (
            <div key={optionIndex} className="flex items-center gap-2">
              <input
                type="radio"
                name={`answer-${question.localId}`}
                checked={question.correctOptionIndex === optionIndex}
                onChange={() =>
                  updateQuestion("correctOptionIndex", optionIndex)
                }
                className="h-4 w-4 shrink-0 accent-emerald-600"
              />

              <input
                value={option.text}
                onChange={(event) =>
                  updateOption(optionIndex, event.target.value)
                }
                placeholder={`Option ${optionIndex + 1}`}
                className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
              />

              <button
                type="button"
                disabled={question.options.length <= 2}
                onClick={() => removeOption(optionIndex)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:text-red-600 disabled:opacity-30"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm font-semibold">
          Explanation
          <span className="ml-1 font-normal text-slate-400">optional</span>
        </label>

        <textarea
          rows="2"
          value={question.explanation}
          onChange={(event) =>
            updateQuestion("explanation", event.target.value)
          }
          placeholder="Explanation..."
          className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold">Difficulty</label>

          <select
            value={question.difficulty}
            onChange={(event) =>
              updateQuestion("difficulty", event.target.value)
            }
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="easy">Easy</option>

            <option value="medium">Medium</option>

            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Tags</label>

          <input
            value={question.tagsText}
            onChange={(event) => updateQuestion("tagsText", event.target.value)}
            placeholder="bcs, important"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
          />
        </div>
      </div>
    </article>
  );
}

export default ImportQuestionCard;
