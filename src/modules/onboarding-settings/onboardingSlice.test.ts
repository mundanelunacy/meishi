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
  setThemeMode,
} from "./onboardingSlice";

describe("onboardingSlice", () => {
  it("updates the provider-specific API keys", () => {
    const withOpenAi = onboardingReducer(undefined, setOpenAiApiKey("sk-test"));
    const withAnthropic = onboardingReducer(
      withOpenAi,
      setAnthropicApiKey("sk-ant-test"),
    );

    expect(withAnthropic.settings.openAiApiKey).toBe("sk-test");
    expect(withAnthropic.settings.anthropicApiKey).toBe("sk-ant-test");
  });

  it("updates the provider-specific models", () => {
    const withOpenAiModel = onboardingReducer(
      undefined,
      setPreferredOpenAiModel("gpt-5.4-mini"),
    );
    const withAnthropicModel = onboardingReducer(
      withOpenAiModel,
      setPreferredAnthropicModel("claude-sonnet-4-20250514"),
    );

    expect(withAnthropicModel.settings.preferredOpenAiModel).toBe(
      "gpt-5.4-mini",
    );
    expect(withAnthropicModel.settings.preferredAnthropicModel).toBe(
      "claude-sonnet-4-20250514",
    );
  });

  it("updates the persisted theme preference", () => {
    const withDarkTheme = onboardingReducer(undefined, setThemeMode("dark"));

    expect(withDarkTheme.settings.themeMode).toBe("dark");
  });

  it("derives app readiness from auth and settings state", () => {
    const withProvider = onboardingReducer(
      undefined,
      setLlmProvider("anthropic"),
    );
    const withApiKey = onboardingReducer(
      withProvider,
      setAnthropicApiKey("sk-ant-test"),
    );
    const withGoogleAuth = onboardingReducer(
      withApiKey,
      setGoogleAuthState({
        status: "connected",
        firebaseUid: "firebase-uid-1",
        scope: "https://www.googleapis.com/auth/contacts",
        accountEmail: "developer@example.com",
        connectedAt: "2026-04-06T00:00:00.000Z",
      }),
    );

    const readiness = selectAppReadiness({
      onboarding: withGoogleAuth,
    } as never);

    expect(readiness.hasLlmConfiguration).toBe(true);
    expect(readiness.hasGoogleAuthorization).toBe(true);
    expect(readiness.googleAuthStatus).toBe("connected");
    expect(readiness.isCaptureReady).toBe(false);
  });

  it("treats capture as ready without Google once onboarding is completed", () => {
    const withProvider = onboardingReducer(undefined, setLlmProvider("openai"));
    const withApiKey = onboardingReducer(
      withProvider,
      setOpenAiApiKey("sk-test"),
    );
    const completed = onboardingReducer(withApiKey, {
      type: "onboarding/completeOnboarding",
    });

    const readiness = selectAppReadiness({
      onboarding: completed,
    } as never);

    expect(readiness.hasLlmConfiguration).toBe(true);
    expect(readiness.hasGoogleAuthorization).toBe(false);
    expect(readiness.isCaptureReady).toBe(true);
  });
});
