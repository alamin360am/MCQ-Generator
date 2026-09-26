import { Laptop, Moon, Sun } from "lucide-react";

import { useThemeStore } from "../../stores/themeStore";

function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);

  const setTheme = useThemeStore((state) => state.setTheme);

  const themeConfig = {
    system: {
      icon: Laptop,
      next: "light",
      label: "System theme",
    },

    light: {
      icon: Sun,
      next: "dark",
      label: "Light theme",
    },

    dark: {
      icon: Moon,
      next: "system",
      label: "Dark theme",
    },
  };

  const current = themeConfig[theme];

  const Icon = current.icon;

  return (
    <button
      type="button"
      onClick={() => setTheme(current.next)}
      title={current.label}
      aria-label={current.label}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
    >
      <Icon size={19} />
    </button>
  );
}

export default ThemeToggle;
