import { describe, expect, it } from "vitest";
import {
  completeLlmValidationSuccess,
  onboardingReducer,
  selectAppReadiness,
  setAnthropicApiKey,
  setGeminiApiKey,
  setGoogleAuthState,
  setLlmProvider,
  setOpenAiApiKey,
  setPreferredAnthropicModel,
  setPreferredGeminiModel,
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
    const withGemini = onboardingReducer(
      withAnthropic,
      setGeminiApiKey("AIzaabcdefghijklmnopqrstuvwxyz123456789"),
    );

    expect(withGemini.settings.openAiApiKey).toBe("sk-test");
    expect(withGemini.settings.anthropicApiKey).toBe("sk-ant-test");
    expect(withGemini.settings.geminiApiKey).toBe(
      "AIzaabcdefghijklmnopqrstuvwxyz123456789",
    );
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
    const withGeminiModel = onboardingReducer(
      withAnthropicModel,
      setPreferredGeminiModel("gemini-2.5-pro"),
    );

    expect(withGeminiModel.settings.preferredOpenAiModel).toBe(
      "gpt-5.4-mini",
    );
    expect(withGeminiModel.settings.preferredAnthropicModel).toBe(
      "claude-sonnet-4-20250514",
    );
    expect(withGeminiModel.settings.preferredGeminiModel).toBe(
      "gemini-2.5-pro",
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
    const validated = onboardingReducer(
      withGoogleAuth,
      completeLlmValidationSuccess({
        provider: "anthropic",
        apiKey: "sk-ant-test",
        model: withGoogleAuth.settings.preferredAnthropicModel,
      }),
    );

    const readiness = selectAppReadiness({
      onboarding: validated,
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
    const validated = onboardingReducer(
      withApiKey,
      completeLlmValidationSuccess({
        provider: "openai",
        apiKey: "sk-test",
        model: withApiKey.settings.preferredOpenAiModel,
      }),
    );
    const completed = onboardingReducer(validated, {
      type: "onboarding/completeOnboarding",
    });

    const readiness = selectAppReadiness({
      onboarding: completed,
    } as never);

    expect(readiness.hasLlmConfiguration).toBe(true);
    expect(readiness.hasGoogleAuthorization).toBe(false);
    expect(readiness.isCaptureReady).toBe(true);
  });

  it("requires validation for the active provider configuration", () => {
    const withApiKey = onboardingReducer(undefined, setOpenAiApiKey("sk-test"));

    expect(
      selectAppReadiness({
        onboarding: withApiKey,
      } as never).hasLlmConfiguration,
    ).toBe(false);
  });
});
