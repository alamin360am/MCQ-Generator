import {
  CheckCircle2,
  Image as ImageIcon,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";

function AiQuestionCard({ question, index, sourceImages, onChange, onDelete }) {
  const updateField = (field, value) => {
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

    updateField("options", options);
  };

  const addOption = () => {
    if (question.options.length >= 6) {
      return;
    }

    updateField("options", [
      ...question.options,

      {
        localId: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,

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

    let nextCorrect = question.correctOptionIndex;

    if (nextCorrect === optionIndex) {
      nextCorrect = null;
    } else if (Number.isInteger(nextCorrect) && nextCorrect > optionIndex) {
      nextCorrect -= 1;
    }

    onChange({
      ...question,

      options,

      correctOptionIndex: nextCorrect,
    });
  };

  const sourceImage = sourceImages[question.sourcePage - 1];

  return (
    <article
      className={[
        "rounded-2xl border bg-white p-4 sm:p-5 dark:bg-slate-900",
        !question.selected
          ? "border-slate-200 opacity-65 dark:border-slate-800"
          : question.isValid
            ? "border-slate-200 dark:border-slate-800"
            : "border-red-300 dark:border-red-900",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <input
            type="checkbox"
            checked={question.selected}
            onChange={(event) => updateField("selected", event.target.checked)}
            className="h-5 w-5 shrink-0 accent-emerald-600"
          />

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold">Question {index + 1}</h3>

              {question.isValid ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                  <CheckCircle2 size={12} />
                  Valid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-400">
                  <TriangleAlert size={12} />
                  Needs Fix
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-slate-400">
              AI-generated — review before saving.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
        >
          <Trash2 size={17} />
        </button>
      </div>

      {question.errors.length > 0 && (
        <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/20 dark:text-red-400">
          {question.errors.map((error) => (
            <p key={error}>• {error}</p>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_180px]">
        <div>
          <label className="mb-2 block text-sm font-semibold">Question</label>

          <textarea
            rows="3"
            value={question.questionText}
            onChange={(event) =>
              updateField("questionText", event.target.value)
            }
            className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Source Page
          </label>

          <select
            value={question.sourcePage}
            onChange={(event) =>
              updateField("sourcePage", Number(event.target.value))
            }
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
          >
            {sourceImages.map((image, imageIndex) => (
              <option key={image.id} value={imageIndex + 1}>
                Page {imageIndex + 1}
              </option>
            ))}
          </select>

          {sourceImage && (
            <a
              href={sourceImage.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center gap-2 text-xs font-semibold text-emerald-600"
            >
              <ImageIcon size={14} />
              View source
            </a>
          )}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold">Answer Options</h4>

            <p className="mt-1 text-xs text-slate-400">
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
            <div
              key={option.localId || optionIndex}
              className="flex items-center gap-2"
            >
              <input
                type="radio"
                name={`ai-answer-${question.localId}`}
                checked={question.correctOptionIndex === optionIndex}
                onChange={() => updateField("correctOptionIndex", optionIndex)}
                className="h-4 w-4 shrink-0 accent-emerald-600"
              />

              <input
                value={option.text}
                onChange={(event) =>
                  updateOption(optionIndex, event.target.value)
                }
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
        <label className="mb-2 block text-sm font-semibold">Explanation</label>

        <textarea
          rows="3"
          value={question.explanation}
          onChange={(event) => updateField("explanation", event.target.value)}
          className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold">Difficulty</label>

          <select
            value={question.difficulty}
            onChange={(event) => updateField("difficulty", event.target.value)}
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
            onChange={(event) => updateField("tagsText", event.target.value)}
            placeholder="bcs, important"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
          />
        </div>
      </div>
    </article>
  );
}

export default AiQuestionCard;
