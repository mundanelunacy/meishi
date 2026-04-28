import { describe, expect, it, vi } from "vitest";
import {
  getLlmValidationPrecheck,
  validateLlmConfiguration,
} from "./llmKeyValidation";

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

  it("accepts a valid Gemini configuration", () => {
    expect(
      getLlmValidationPrecheck({
        provider: "gemini",
        apiKey: "AIzaabcdefghijklmnopqrstuvwxyz123456789",
        model: "gemini-2.5-flash-lite",
      }),
    ).toEqual({ eligible: true });
  });

  it("rejects Gemini keys with the wrong prefix", () => {
    expect(
      getLlmValidationPrecheck({
        provider: "gemini",
        apiKey: "sk-abcdefghijklmnopqrstuvwxyz",
        model: "gemini-2.5-flash-lite",
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

  it("validates Gemini configuration with the generateContent endpoint", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ candidates: [] })),
    );

    await validateLlmConfiguration(
      {
        provider: "gemini",
        apiKey: "AIzaabcdefghijklmnopqrstuvwxyz123456789",
        model: "gemini-2.5-flash-lite",
      },
      { fetchImpl },
    );

    expect(fetchImpl).toHaveBeenCalledOnce();
    const request = fetchImpl.mock.calls[0];
    expect(request[0]).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
    );
    expect(request[1]?.headers).toMatchObject({
      "x-goog-api-key": "AIzaabcdefghijklmnopqrstuvwxyz123456789",
    });

    const body = JSON.parse(request[1]?.body as string) as {
      contents: Array<{ parts: Array<{ text: string }> }>;
      generationConfig: {
        maxOutputTokens: number;
        thinkingConfig: { thinkingBudget: number };
      };
    };
    expect(body.contents[0]?.parts[0]?.text).toBe("Reply with OK.");
    expect(body.generationConfig.maxOutputTokens).toBe(16);
    expect(body.generationConfig.thinkingConfig.thinkingBudget).toBe(0);
  });
});
