"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

type Theme = "light" | "dark";

const STORAGE_KEY = "mustadama-theme";
const THEME_CHANGE_EVENT = "mustadama-theme-change";

function getClientTheme(): Theme {
  if (typeof document === "undefined") {
    return "light";
  }
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function subscribeTheme(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const nextDark =
        event.newValue === "dark" || (event.newValue !== "light" && prefersDark);
      document.documentElement.classList.toggle("dark", nextDark);
      callback();
    }
  };

  window.addEventListener(THEME_CHANGE_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

export function ThemeToggle() {
  const t = useTranslations("Theme");
  const theme = useSyncExternalStore<Theme | null>(
    subscribeTheme,
    getClientTheme,
    () => null,
  );

  const isDark = theme === "dark";
  const label =
    theme === null
      ? t("label")
      : isDark
        ? t("toggleToLight")
        : t("toggleToDark");

  function handleToggle() {
    const nextTheme: Theme = isDark ? "light" : "dark";
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Ignore storage errors in restricted browsing contexts.
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      data-testid="theme-toggle"
      aria-label={label}
      title={label}
      className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-transparent px-2.5 py-1 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
    >
      {theme === null ? (
        <span className="h-4 w-4" aria-hidden="true" />
      ) : isDark ? (
        <svg
          className="h-4 w-4 text-amber-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      ) : (
        <svg
          className="h-4 w-4 text-neutral-700"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
      <span className="hidden sm:inline">
        {theme === null ? t("label") : isDark ? t("light") : t("dark")}
      </span>
    </button>
  );
}

