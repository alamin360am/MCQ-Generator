import { useSortable } from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import { GripVertical, Trash2 } from "lucide-react";

function SortableSourceImage({
  image,
  pageNumber,
  disabled = false,
  isDeleting = false,
  onDelete,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: image.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),

    transition,

    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={[
        "relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900",
        isDragging
          ? "border-emerald-400 shadow-xl"
          : "border-slate-200 dark:border-slate-800",
      ].join(" ")}
    >
      <div className="relative aspect-3/4 bg-slate-100 dark:bg-slate-950">
        <img
          src={image.url}
          alt={`Source page ${pageNumber}`}
          className="h-full w-full object-cover"
        />

        <span className="absolute left-2 top-2 rounded-lg bg-slate-950/75 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
          Page {pageNumber}
        </span>

        <div className="absolute right-2 top-2 flex gap-2">
          <button
            type="button"
            disabled={disabled}
            {...attributes}
            {...listeners}
            className="flex h-9 w-9 touch-none items-center justify-center rounded-xl bg-white/90 text-slate-600 shadow-sm backdrop-blur disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-900/90 dark:text-slate-300"
            title="Drag to reorder"
          >
            <GripVertical size={18} />
          </button>

          <button
            type="button"
            disabled={disabled || isDeleting}
            onClick={() => onDelete(image.id)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-red-600 shadow-sm backdrop-blur disabled:opacity-40 dark:bg-slate-900/90"
            title="Remove image"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      <div className="p-3">
        <p className="truncate text-sm font-semibold">
          {image.originalName || `Page ${pageNumber}`}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {formatBytes(image.bytes)}
        </p>
      </div>
    </article>
  );
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) {
    return "";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default SortableSourceImage;
