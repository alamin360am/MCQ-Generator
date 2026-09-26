const ranges = [
  {
    value: "7d",
    label: "7 Days",
  },

  {
    value: "30d",
    label: "30 Days",
  },

  {
    value: "90d",
    label: "90 Days",
  },

  {
    value: "all",
    label: "All Time",
  },
];

function ReportRangeTabs({ value, onChange }) {
  return (
    <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
      {ranges.map((range) => (
        <button
          key={range.value}
          type="button"
          onClick={() => onChange(range.value)}
          className={[
            "shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm",
            value === range.value
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
          ].join(" ")}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}

export default ReportRangeTabs;
