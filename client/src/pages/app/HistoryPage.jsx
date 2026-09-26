import { History } from "lucide-react";

function HistoryPage() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
      <History size={34} className="mx-auto text-slate-400" />

      <h2 className="mt-4 font-bold">No attempt history yet</h2>

      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Exam attempts and performance records will appear here.
      </p>
    </div>
  );
}

export default HistoryPage;
