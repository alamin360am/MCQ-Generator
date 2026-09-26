import { create } from "zustand";

const THEME_KEY = "mcq-generator-theme";

const getStoredTheme = () => {
  const storedTheme = localStorage.getItem(THEME_KEY);

  if (
    storedTheme === "light" ||
    storedTheme === "dark" ||
    storedTheme === "system"
  ) {
    return storedTheme;
  }

  return "system";
};

const resolveTheme = (theme) => {
  if (theme !== "system") {
    return theme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const applyTheme = (theme) => {
  const resolvedTheme = resolveTheme(theme);

  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");

  document.documentElement.style.colorScheme = resolvedTheme;

  return resolvedTheme;
};

export const useThemeStore = create((set) => ({
  theme: getStoredTheme(),

  resolvedTheme: "light",

  setTheme: (theme) => {
    localStorage.setItem(THEME_KEY, theme);

    const resolvedTheme = applyTheme(theme);

    set({
      theme,
      resolvedTheme,
    });
  },

  initializeTheme: () => {
    const theme = getStoredTheme();

    const resolvedTheme = applyTheme(theme);

    set({
      theme,
      resolvedTheme,
    });
  },
}));

export const applyCurrentTheme = () => {
  const { theme } = useThemeStore.getState();

  const resolvedTheme = applyTheme(theme);

  useThemeStore.setState({
    resolvedTheme,
  });
};
