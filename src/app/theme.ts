import type { ThemeMode } from "../shared/types/models";

export const THEME_STORAGE_KEY = "meishi.settings";
export const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";

export function sanitizeThemeMode(value: unknown): ThemeMode {
  return value === "light" || value === "dark" || value === "system"
    ? value
    : "system";
}

export function resolveEffectiveTheme(
  themeMode: ThemeMode,
  prefersDark: boolean,
) {
  if (themeMode === "system") {
    return prefersDark ? "dark" : "light";
  }

  return themeMode;
}

export function applyThemeMode(themeMode: ThemeMode, prefersDark: boolean) {
  if (typeof document === "undefined") {
    return "light";
  }

  const effectiveTheme = resolveEffectiveTheme(themeMode, prefersDark);
  const root = document.documentElement;

  root.classList.toggle("dark", effectiveTheme === "dark");
  root.dataset.theme = effectiveTheme;
  root.style.colorScheme = effectiveTheme;

  return effectiveTheme;
}

export function readStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }

  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) {
      return "system";
    }

    const parsed = JSON.parse(raw) as {
      settings?: { themeMode?: unknown };
    };

    return sanitizeThemeMode(parsed.settings?.themeMode);
  } catch {
    return "system";
  }
}
