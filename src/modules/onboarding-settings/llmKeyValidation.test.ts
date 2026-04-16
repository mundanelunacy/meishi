import { describe, expect, it } from "vitest";
import { getLlmValidationPrecheck } from "./llmKeyValidation";

describe("getLlmValidationPrecheck", () => {
  it("accepts a valid OpenAI configuration", () => {
    expect(
      getLlmValidationPrecheck({
        provider: "openai",
        apiKey: "sk-abcdefghijklmnopqrstuvwxyz",
        model: "gpt-5.4",
      }),
    ).toEqual({ eligible: true });
  });

  it("rejects short OpenAI keys", () => {
    expect(
      getLlmValidationPrecheck({
        provider: "openai",
        apiKey: "sk-short",
        model: "gpt-5.4",
      }),
    ).toEqual({
      eligible: false,
      reason: "too_short",
    });
  });

  it("accepts a valid Anthropic configuration", () => {
    expect(
      getLlmValidationPrecheck({
        provider: "anthropic",
        apiKey: "sk-ant-abcdefghijklmnopqrstuvwxyz",
        model: "claude-sonnet-4-5",
      }),
    ).toEqual({ eligible: true });
  });

  it("rejects Anthropic keys with the wrong prefix", () => {
    expect(
      getLlmValidationPrecheck({
        provider: "anthropic",
        apiKey: "sk-abcdefghijklmnopqrstuvwxyz",
        model: "claude-sonnet-4-5",
      }),
    ).toEqual({
      eligible: false,
      reason: "invalid_format",
    });
  });

  it("rejects an empty model", () => {
    expect(
      getLlmValidationPrecheck({
        provider: "openai",
        apiKey: "sk-abcdefghijklmnopqrstuvwxyz",
        model: "",
      }),
    ).toEqual({
      eligible: false,
      reason: "missing_model",
    });
  });
});
