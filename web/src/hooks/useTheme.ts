import { useEffect, useState } from "react";
import { withMotion } from "../lib/motion.ts";
import type { ThemeMode } from "../types.ts";

const STORAGE_KEY = "taskflow-theme";

function paintTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    theme === "dark" ? "#06111c" : "#c5ddf6",
  );
}

function readTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* ignore blocked storage */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(readTheme);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      try {
        if (localStorage.getItem(STORAGE_KEY)) return;
      } catch {
        return;
      }
      const next = media.matches ? "dark" : "light";
      paintTheme(next);
      setTheme(next);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function toggleTheme() {
    withMotion(() => {
      setTheme((current) => {
        const next = current === "light" ? "dark" : "light";
        paintTheme(next);
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch {
          /* the theme still applies for this session */
        }
        return next;
      });
    }, "theme");
  }

  return { theme, toggleTheme };
}
