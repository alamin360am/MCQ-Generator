import { ArrowDownRight, ArrowUpRight } from "lucide-react";

function ReportKpiCard({
  title,
  value,
  description,
  icon: Icon,
  accent = "emerald",
  trend,
}) {
  const accentStyles = {
    emerald:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",

    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",

    violet:
      "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400",

    amber:
      "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",

    red: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div
          className={[
            "flex h-10 w-10 items-center justify-center rounded-xl",
            accentStyles[accent] || accentStyles.emerald,
          ].join(" ")}
        >
          <Icon size={19} />
        </div>

        {trend && (
          <span
            className={[
              "inline-flex items-center gap-1 text-xs font-semibold",
              trend.direction === "up" ? "text-emerald-600" : "text-red-600",
            ].join(" ")}
          >
            {trend.direction === "up" ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}

            {trend.label}
          </span>
        )}
      </div>

      <p className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
        {value}
      </p>

      <h3 className="mt-1 text-sm font-semibold">{title}</h3>

      {description && (
        <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
      )}
    </article>
  );
}

export default ReportKpiCard;
