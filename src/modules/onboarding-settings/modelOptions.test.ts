import { describe, expect, it } from "vitest";
import {
  ANTHROPIC_MODEL_OPTIONS,
  OPENAI_MODEL_OPTIONS,
  getSupportedModelOptions,
} from "./modelOptions";

describe("modelOptions", () => {
  it("includes current OpenAI and Anthropic model options", () => {
    expect(OPENAI_MODEL_OPTIONS).toContainEqual({
      id: "gpt-5.5",
      label: "GPT-5.5",
    });
    expect(ANTHROPIC_MODEL_OPTIONS).toContainEqual({
      id: "claude-opus-4-7",
      label: "Claude Opus 4.7",
    });
  });

  it("keeps a saved legacy model selectable ahead of current options", () => {
    expect(getSupportedModelOptions("openai", "gpt-legacy-1")[0]).toEqual({
      id: "gpt-legacy-1",
      label: "gpt-legacy-1 (saved legacy model)",
    });
  });
});
