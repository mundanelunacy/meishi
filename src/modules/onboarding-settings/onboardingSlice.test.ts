import { describe, expect, it } from "vitest";
import {
  onboardingReducer,
  selectAppReadiness,
  setGoogleAuthState,
  setLlmApiKey,
  setPreferredOpenAiModel,
} from "./onboardingSlice";

describe("onboardingSlice", () => {
  it("updates the stored API key", () => {
    const state = onboardingReducer(undefined, setLlmApiKey("sk-test"));
    expect(state.settings.llmApiKey).toBe("sk-test");
  });

  it("updates the preferred OpenAI model", () => {
    const state = onboardingReducer(undefined, setPreferredOpenAiModel("gpt-4.1"));
    expect(state.settings.preferredOpenAiModel).toBe("gpt-4.1");
  });

  it("derives app readiness from auth and settings state", () => {
    const withApiKey = onboardingReducer(undefined, setLlmApiKey("sk-test"));
    const withGoogleAuth = onboardingReducer(
      withApiKey,
      setGoogleAuthState({
        mode: "mock",
        accessToken: "mock-token",
        scope: "https://www.googleapis.com/auth/contacts",
        expiresAt: Date.now() + 60_000,
        accountHint: "developer@local.test",
      })
    );

    const readiness = selectAppReadiness({
      onboarding: withGoogleAuth,
    } as never);

    expect(readiness.hasLlmConfiguration).toBe(true);
    expect(readiness.hasGoogleAuthorization).toBe(true);
    expect(readiness.googleAuthMode).toBe("mock");
    expect(readiness.isCaptureReady).toBe(false);
  });
});
