// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearPersistedState,
  defaultSettings,
  loadPersistedState,
  persistOnboardingState,
} from "./index";

describe("local-data/storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("falls back to default settings when persisted data is missing or malformed", () => {
    expect(loadPersistedState()).toEqual({ settings: defaultSettings });

    window.localStorage.setItem("meishi.settings", "{invalid");
    expect(loadPersistedState()).toEqual({ settings: defaultSettings });
  });

  it("strips durable Google auth fields when loading persisted onboarding state", () => {
    window.localStorage.setItem(
      "meishi.settings",
      JSON.stringify({
        settings: {
          llmApiKey: "sk-test",
          llmProvider: "gemini",
          geminiApiKey: "AIzaabcdefghijklmnopqrstuvwxyz123456789",
          preferredOpenAiModel: "gpt-5.4-mini",
          preferredGeminiModel: "gemini-2.5-pro",
          extractionPrompt: "custom prompt",
          themeMode: "dark",
        },
        googleAuth: {
          scope: "contacts",
          accountEmail: "developer@example.com",
          connectedAt: "2026-04-06T00:00:00.000Z",
          accessToken: "should-not-load",
          expiresAt: 123,
        },
      }),
    );

    expect(loadPersistedState()).toEqual({
      settings: {
        ...defaultSettings,
        llmProvider: "gemini",
        openAiApiKey: "sk-test",
        geminiApiKey: "AIzaabcdefghijklmnopqrstuvwxyz123456789",
        preferredOpenAiModel: "gpt-5.4-mini",
        preferredGeminiModel: "gemini-2.5-pro",
        extractionPrompt: "custom prompt",
        themeMode: "dark",
      },
      googleAuth: {
        scope: "contacts",
        accountEmail: "developer@example.com",
        connectedAt: "2026-04-06T00:00:00.000Z",
      },
    });
  });

  it("swallows localStorage write errors when persisting or clearing state", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("write blocked");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("remove blocked");
    });

    expect(() =>
      persistOnboardingState({
        settings: defaultSettings,
        googleAuth: {
          scope: "contacts",
          accountEmail: "developer@example.com",
          connectedAt: "2026-04-06T00:00:00.000Z",
        },
      }),
    ).not.toThrow();
    expect(() => clearPersistedState()).not.toThrow();
  });

  it("falls back to the default theme when the persisted theme is invalid", () => {
    window.localStorage.setItem(
      "meishi.settings",
      JSON.stringify({
        settings: {
          themeMode: "sepia",
        },
      }),
    );

    expect(loadPersistedState()).toEqual({
      settings: defaultSettings,
    });
  });

  it("loads and persists sanitized analytics consent fields", () => {
    window.localStorage.setItem(
      "meishi.settings",
      JSON.stringify({
        settings: {
          analyticsConsent: "granted",
          analyticsConsentUpdatedAt: "2026-04-21T10:00:00.000Z",
        },
      }),
    );

    expect(loadPersistedState()).toEqual({
      settings: {
        ...defaultSettings,
        analyticsConsent: "granted",
        analyticsConsentUpdatedAt: "2026-04-21T10:00:00.000Z",
      },
    });

    persistOnboardingState({
      settings: {
        ...defaultSettings,
        analyticsConsent: "unsupported" as "granted",
        analyticsConsentUpdatedAt: "2026-04-21T11:00:00.000Z",
      },
    });

    expect(loadPersistedState()).toEqual({
      settings: {
        ...defaultSettings,
        analyticsConsentUpdatedAt: "2026-04-21T11:00:00.000Z",
      },
    });
  });
});
