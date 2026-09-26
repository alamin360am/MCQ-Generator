import { Bell, UserRound } from "lucide-react";

import { useLocation } from "react-router-dom";

import ThemeToggle from "../theme/ThemeToggle";

const titles = {
  "/app/dashboard": "Dashboard",
  "/app/create": "Create",
  "/app/import": "Bulk MCQ Import",
  "/app/questions": "Question Bank",
  "/app/exams": "Exams",
  "/app/history": "History",
  "/app/settings": "Settings",
};

function Topbar() {
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname === "/app/reports") {
      return "Reports & Analytics";
    }

    if (location.pathname === "/app/practice/history") {
      return "Practice History";
    }

    if (location.pathname === "/app/practice") {
      return "Practice";
    }

    if (location.pathname === "/app/create/ai-image") {
      return "AI Image MCQ";
    }
    if (location.pathname.match(/^\/app\/exams\/[^/]+\/attempts\/[^/]+$/)) {
      return "Attempt Review";
    }

    if (location.pathname.match(/^\/app\/exams\/[^/]+\/attempts$/)) {
      return "Exam Analytics";
    }

    if (location.pathname === "/app/exams/new") {
      return "Create Exam";
    }

    if (
      location.pathname.startsWith("/app/exams/") &&
      location.pathname.endsWith("/edit")
    ) {
      return "Edit Exam";
    }

    return titles[location.pathname] || "MCQ Generator";
  };

  const title = getPageTitle();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
        <div>
          <h1 className="text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
            {title}
          </h1>

          <p className="hidden text-sm text-slate-500 sm:block dark:text-slate-400">
            Create, practice and track your progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            aria-label="Notifications"
          >
            <Bell size={19} />
          </button>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            aria-label="Account"
          >
            <UserRound size={19} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
