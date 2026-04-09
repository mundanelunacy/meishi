import type { ThemeMode } from "../shared/types/models";
import { getAppChromeThemeColor, type AppChromeTheme } from "./chromeColors";

export const THEME_STORAGE_KEY = "meishi.settings";
export const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";
const THEME_COLOR_META_SELECTOR = 'meta[name="theme-color"]';
const APPLE_STATUS_BAR_META_SELECTOR =
  'meta[name="apple-mobile-web-app-status-bar-style"]';

export function sanitizeThemeMode(value: unknown): ThemeMode {
  return value === "light" || value === "dark" || value === "system"
    ? value
    : "system";
}

export function resolveEffectiveTheme(
  themeMode: ThemeMode,
  prefersDark: boolean,
): AppChromeTheme {
  if (themeMode === "system") {
    return prefersDark ? "dark" : "light";
  }

  return themeMode;
}

function upsertMetaTag(selector: string, name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const existing = document.head.querySelector<HTMLMetaElement>(selector);

  if (existing) {
    return existing;
  }

  const meta = document.createElement("meta");
  meta.setAttribute("name", name);
  document.head.append(meta);

  return meta;
}

export function syncThemeChromeMetadata(effectiveTheme: AppChromeTheme) {
  if (typeof document === "undefined") {
    return;
  }

  const themeColorMeta = upsertMetaTag(
    THEME_COLOR_META_SELECTOR,
    "theme-color",
  );
  const appleStatusBarMeta = upsertMetaTag(
    APPLE_STATUS_BAR_META_SELECTOR,
    "apple-mobile-web-app-status-bar-style",
  );

  themeColorMeta?.setAttribute(
    "content",
    getAppChromeThemeColor(effectiveTheme),
  );
  appleStatusBarMeta?.setAttribute(
    "content",
    effectiveTheme === "dark" ? "black" : "default",
  );
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
  syncThemeChromeMetadata(effectiveTheme);

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
