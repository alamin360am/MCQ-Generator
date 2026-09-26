import { BookOpenCheck } from "lucide-react";

import { Link, Outlet } from "react-router-dom";

import ThemeToggle from "../theme/ThemeToggle";

function PublicLayout() {
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <BookOpenCheck size={20} />
            </span>

            <span className="font-bold">MCQ Generator</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <Link
              to="/login"
              className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 sm:inline-flex dark:text-slate-300"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <Outlet />
    </div>
  );
}

export default PublicLayout;
