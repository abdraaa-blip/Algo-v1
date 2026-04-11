"use client";

import { useState, useEffect, useCallback } from "react";

type Theme = "dark" | "light" | "system";

const STORAGE_KEY = "algo_theme";

export function useTheme() {
  const getInitialTheme = (): Theme => {
    if (typeof window === "undefined") return "dark";
    try {
      return (localStorage.getItem(STORAGE_KEY) as Theme | null) || "dark";
    } catch {
      return "dark";
    }
  };

  const getInitialResolvedTheme = (initialTheme: Theme): "dark" | "light" => {
    if (initialTheme === "system") {
      if (typeof window === "undefined") return "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return initialTheme;
  };

  const initialTheme = getInitialTheme();
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">(() =>
    getInitialResolvedTheme(initialTheme),
  );

  // Get system preference
  const getSystemTheme = useCallback((): "dark" | "light" => {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }, []);

  // Apply theme to document
  const applyTheme = useCallback(
    (newTheme: Theme) => {
      if (typeof document === "undefined") return;

      const resolved = newTheme === "system" ? getSystemTheme() : newTheme;

      document.documentElement.classList.remove("dark", "light");
      document.documentElement.classList.add(resolved);
      document.documentElement.style.colorScheme = resolved;

      setResolvedTheme(resolved);
    },
    [getSystemTheme],
  );

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, applyTheme]);

  // Set theme
  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      applyTheme(newTheme);

      try {
        localStorage.setItem(STORAGE_KEY, newTheme);
      } catch {
        // Storage not available
      }
    },
    [applyTheme],
  );

  // Toggle between dark and light
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    mounted: typeof window !== "undefined",
    isDark: resolvedTheme === "dark",
    isLight: resolvedTheme === "light",
  };
}
