// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import {
  applyThemeMode,
  readStoredThemeMode,
  resolveEffectiveTheme,
} from "./theme";

describe("app/theme", () => {
  it("resolves the system theme using the media query result", () => {
    expect(resolveEffectiveTheme("system", true)).toBe("dark");
    expect(resolveEffectiveTheme("system", false)).toBe("light");
  });

  it("applies the dark class and color scheme to the document root", () => {
    applyThemeMode("dark", false);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("reads the stored theme mode from persisted settings", () => {
    window.localStorage.setItem(
      "meishi.settings",
      JSON.stringify({ settings: { themeMode: "light" } }),
    );

    expect(readStoredThemeMode()).toBe("light");
  });
});
