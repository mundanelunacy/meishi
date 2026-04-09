// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import {
  applyThemeMode,
  readStoredThemeMode,
  resolveEffectiveTheme,
  syncThemeChromeMetadata,
} from "./theme";

describe("app/theme", () => {
  beforeEach(() => {
    document.documentElement.className = "";
    document.documentElement.dataset.theme = "";
    document.documentElement.style.colorScheme = "";
    document.head.innerHTML = "";
    window.localStorage.clear();
  });

  it("resolves the system theme using the media query result", () => {
    expect(resolveEffectiveTheme("system", true)).toBe("dark");
    expect(resolveEffectiveTheme("system", false)).toBe("light");
  });

  it("applies the dark class and chrome metadata to the document root", () => {
    applyThemeMode("dark", false);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(
      document.head
        .querySelector('meta[name="theme-color"]')
        ?.getAttribute("content"),
    ).toBe("#13161B");
    expect(
      document.head
        .querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
        ?.getAttribute("content"),
    ).toBe("black");
  });

  it("updates existing theme metadata instead of creating duplicates", () => {
    syncThemeChromeMetadata("light");
    syncThemeChromeMetadata("dark");

    expect(
      document.head.querySelectorAll('meta[name="theme-color"]'),
    ).toHaveLength(1);
    expect(
      document.head
        .querySelector('meta[name="theme-color"]')
        ?.getAttribute("content"),
    ).toBe("#13161B");
  });

  it("reads the stored theme mode from persisted settings", () => {
    window.localStorage.setItem(
      "meishi.settings",
      JSON.stringify({ settings: { themeMode: "light" } }),
    );

    expect(readStoredThemeMode()).toBe("light");
  });
});
