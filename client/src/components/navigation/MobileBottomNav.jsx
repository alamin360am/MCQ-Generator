import {
  ClipboardList,
  FileQuestion,
  LayoutDashboard,
  Menu,
  Plus,
} from "lucide-react";

import { NavLink, useLocation } from "react-router-dom";

const navigation = [
  {
    label: "Home",
    to: "/app/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Questions",
    to: "/app/questions",
    icon: FileQuestion,
  },
  {
    label: "Create",
    to: "/app/create",
    icon: Plus,
    primary: true,
  },
  {
    label: "Exams",
    to: "/app/exams",
    icon: ClipboardList,
  },
  {
    label: "More",
    to: "/app/settings",
    icon: Menu,
  },
];

function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {navigation.map(({ label, to, icon: Icon, primary }) => {
          const isActive =
            location.pathname === to ||
            (!primary &&
              to !== "/app/dashboard" &&
              location.pathname.startsWith(to));

          if (primary) {
            return (
              <NavLink
                key={to}
                to={to}
                className="flex flex-col items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                <span className="-mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                  <Icon size={26} />
                </span>

                <span>{label}</span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={to}
              to={to}
              className={[
                "flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium transition",
                isActive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-500 dark:text-slate-400",
              ].join(" ")}
            >
              <Icon size={21} />

              <span>{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNav;
