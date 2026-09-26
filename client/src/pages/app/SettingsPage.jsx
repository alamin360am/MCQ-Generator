import { LogOut, Monitor, Moon, Sun, UserRound } from "lucide-react";

import { useNavigate } from "react-router-dom";

import { logoutAllDevices, logoutUser } from "../../services/auth.service";

import { useAuthStore } from "../../stores/authStore";

import { useThemeStore } from "../../stores/themeStore";

const themes = [
  {
    value: "system",
    label: "System",
    icon: Monitor,
  },

  {
    value: "light",
    label: "Light",
    icon: Sun,
  },

  {
    value: "dark",
    label: "Dark",
    icon: Moon,
  },
];

function SettingsPage() {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);

  const theme = useThemeStore((state) => state.theme);

  const setTheme = useThemeStore((state) => state.setTheme);

  const handleLogout = async () => {
    await logoutUser();

    navigate("/login", {
      replace: true,
    });
  };

  const handleLogoutAll = async () => {
    await logoutAllDevices();

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <div className="max-w-2xl space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <UserRound size={26} />
          </div>

          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">
              {user?.name}
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {user?.email}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-bold">Appearance</h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Choose how MCQ Generator looks on this device.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {themes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={[
                "flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition",

                theme === value
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300",
              ].join(" ")}
            >
              <Icon size={19} />

              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-bold">Session</h2>

        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <LogOut size={18} />
            Log out
          </button>

          <button
            type="button"
            onClick={handleLogoutAll}
            className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
          >
            Log out from all devices
          </button>
        </div>
      </section>
    </div>
  );
}

export default SettingsPage;
