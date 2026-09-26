import { BookOpenCheck } from "lucide-react";

import { Link, Outlet } from "react-router-dom";

import ThemeToggle from "../theme/ThemeToggle";

function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center justify-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <BookOpenCheck size={23} />
            </span>

            <span className="text-xl font-bold text-slate-900 dark:text-white">
              MCQ Generator
            </span>
          </Link>

          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
