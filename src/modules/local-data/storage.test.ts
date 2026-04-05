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
          preferredOpenAiModel: "gpt-4.1",
          extractionPrompt: "custom prompt",
        },
        googleAuth: {
          scope: "contacts",
          accountHint: "developer@local.test",
          accessToken: "should-not-load",
          expiresAt: 123,
        },
      })
    );

    expect(loadPersistedState()).toEqual({
      settings: {
        ...defaultSettings,
        openAiApiKey: "sk-test",
        preferredOpenAiModel: "gpt-4.1",
        extractionPrompt: "custom prompt",
      },
      googleAuth: {
        scope: "contacts",
        accountHint: "developer@local.test",
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
          accountHint: "developer@local.test",
        },
      })
    ).not.toThrow();
    expect(() => clearPersistedState()).not.toThrow();
  });
});
