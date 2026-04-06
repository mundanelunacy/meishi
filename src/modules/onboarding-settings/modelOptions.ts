export interface ModelOption {
  id: string;
  label: string;
}

export const OPENAI_MODEL_OPTIONS: ModelOption[] = [
  { id: "gpt-5.4", label: "GPT-5.4" },
  { id: "gpt-5.4-mini", label: "GPT-5.4 mini" },
  { id: "gpt-5.4-nano", label: "GPT-5.4 nano" },
];

export const ANTHROPIC_MODEL_OPTIONS: ModelOption[] = [
  { id: "claude-opus-4-6", label: "Claude Opus 4.6" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
];

export function getSupportedModelOptions(
  provider: "openai" | "anthropic",
  currentValue?: string,
): ModelOption[] {
  const baseOptions =
    provider === "anthropic" ? ANTHROPIC_MODEL_OPTIONS : OPENAI_MODEL_OPTIONS;

  if (!currentValue || baseOptions.some((option) => option.id === currentValue)) {
    return baseOptions;
  }

  return [
    {
      id: currentValue,
      label: `${currentValue} (saved legacy model)`,
    },
    ...baseOptions,
  ];
}
