import { useEffect } from "react";

import { applyCurrentTheme, useThemeStore } from "../../stores/themeStore";

function ThemeSync() {
  const initializeTheme = useThemeStore((state) => state.initializeTheme);

  useEffect(() => {
    initializeTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = () => {
      const currentTheme = useThemeStore.getState().theme;

      if (currentTheme === "system") {
        applyCurrentTheme();
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [initializeTheme]);

  return null;
}

export default ThemeSync;
