import { describe, expect, it } from "vitest";
import {
  onboardingReducer,
  selectAppReadiness,
  setAnthropicApiKey,
  setGoogleAuthState,
  setLlmProvider,
  setOpenAiApiKey,
  setPreferredAnthropicModel,
  setPreferredOpenAiModel,
} from "./onboardingSlice";

describe("onboardingSlice", () => {
  it("updates the provider-specific API keys", () => {
    const withOpenAi = onboardingReducer(undefined, setOpenAiApiKey("sk-test"));
    const withAnthropic = onboardingReducer(withOpenAi, setAnthropicApiKey("sk-ant-test"));

    expect(withAnthropic.settings.openAiApiKey).toBe("sk-test");
    expect(withAnthropic.settings.anthropicApiKey).toBe("sk-ant-test");
  });

  it("updates the provider-specific models", () => {
    const withOpenAiModel = onboardingReducer(undefined, setPreferredOpenAiModel("gpt-4.1"));
    const withAnthropicModel = onboardingReducer(
      withOpenAiModel,
      setPreferredAnthropicModel("claude-sonnet-4-20250514")
    );

    expect(withAnthropicModel.settings.preferredOpenAiModel).toBe("gpt-4.1");
    expect(withAnthropicModel.settings.preferredAnthropicModel).toBe("claude-sonnet-4-20250514");
  });

  it("derives app readiness from auth and settings state", () => {
    const withProvider = onboardingReducer(undefined, setLlmProvider("anthropic"));
    const withApiKey = onboardingReducer(withProvider, setAnthropicApiKey("sk-ant-test"));
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
