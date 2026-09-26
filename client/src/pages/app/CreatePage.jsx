import { FilePenLine, ImagePlus, ListPlus, Upload } from "lucide-react";
import { Link } from "react-router-dom";

const methods = [
  {
    title: "AI from Book Images",
    description: "Upload book pages and generate reviewable MCQs with AI.",
    icon: ImagePlus,
    badge: "AI",
    to: "/app/create/ai-image",
  },
  {
    title: "Bulk MCQ Import",
    description: "Paste many formatted MCQs and automatically import them.",
    icon: Upload,
    badge: "Fast",
    to: "/app/import",
  },
  {
    title: "Manual Question",
    description:
      "Create a single question manually with options and explanation.",
    icon: FilePenLine,
  },
  {
    title: "Create Exam",
    description:
      "Select questions, configure the exam and generate a shareable link.",
    icon: ListPlus,
    to: "/app/exams/new",
  },
];

function CreatePage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          What do you want to create?
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Choose a workflow to get started.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {methods.map(({ title, description, icon: Icon, badge, to }) => {
          const content = (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <Icon size={23} />
                </div>

                {badge && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {badge}
                  </span>
                )}
              </div>

              <h3 className="mt-5 font-bold text-slate-900 dark:text-white">
                {title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {description}
              </p>
            </>
          );

          if (to) {
            return (
              <Link
                key={title}
                to={to}
                className="group rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-emerald-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-800"
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={title}
              type="button"
              className="group rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-emerald-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-800"
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CreatePage;
