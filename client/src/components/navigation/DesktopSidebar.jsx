import {
  BarChart3,
  BookOpenCheck,
  Brain,
  ClipboardList,
  FileQuestion,
  History,
  LayoutDashboard,
  Settings,
  Sparkles,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const navigation = [
  {
    label: "Dashboard",
    to: "/app/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Create",
    to: "/app/create",
    icon: Sparkles,
  },
  {
    label: "Question Bank",
    to: "/app/questions",
    icon: FileQuestion,
  },
  {
    label: "Exams",
    to: "/app/exams",
    icon: ClipboardList,
  },
  {
    label: "Reports",
    to: "/app/reports",
    icon: BarChart3,
  },
  {
    label: "Practice",
    to: "/app/practice",
    icon: Brain,
  },
  {
    label: "History",
    to: "/app/history",
    icon: History,
  },
];

function DesktopSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col dark:border-slate-800 dark:bg-slate-950">
      <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-6 dark:border-slate-800">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
          <BookOpenCheck size={23} />
        </div>

        <div>
          <p className="font-bold text-slate-900 dark:text-white">
            MCQ Generator
          </p>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Learn. Practice. Improve.
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {navigation.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                isActive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white",
              ].join(" ")
            }
          >
            <Icon size={19} />

            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <NavLink
          to="/app/settings"
          className={({ isActive }) =>
            [
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
              isActive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900",
            ].join(" ")
          }
        >
          <Settings size={19} />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}

export default DesktopSidebar;
