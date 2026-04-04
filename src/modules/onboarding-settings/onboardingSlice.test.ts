import { describe, expect, it } from "vitest";
import { onboardingReducer, setLlmApiKey, setPreferredOpenAiModel } from "./onboardingSlice";

describe("onboardingSlice", () => {
  it("updates the stored API key", () => {
    const state = onboardingReducer(undefined, setLlmApiKey("sk-test"));
    expect(state.settings.llmApiKey).toBe("sk-test");
  });

  it("updates the preferred OpenAI model", () => {
    const state = onboardingReducer(undefined, setPreferredOpenAiModel("gpt-4.1"));
    expect(state.settings.preferredOpenAiModel).toBe("gpt-4.1");
  });
});
