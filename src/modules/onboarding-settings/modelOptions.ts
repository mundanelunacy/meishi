export interface ModelOption {
  id: string;
  label: string;
}

export const OPENAI_MODEL_OPTIONS: ModelOption[] = [
  { id: "gpt-5.5", label: "GPT-5.5" },
  { id: "gpt-5.4", label: "GPT-5.4" },
  { id: "gpt-5.4-mini", label: "GPT-5.4 mini" },
  { id: "gpt-5.4-nano", label: "GPT-5.4 nano" },
];

export const ANTHROPIC_MODEL_OPTIONS: ModelOption[] = [
  { id: "claude-opus-4-7", label: "Claude Opus 4.7" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
];

export const GEMINI_MODEL_OPTIONS: ModelOption[] = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
];

export function getSupportedModelOptions(
  provider: "openai" | "anthropic" | "gemini",
  currentValue?: string,
): ModelOption[] {
  const baseOptions = {
    anthropic: ANTHROPIC_MODEL_OPTIONS,
    gemini: GEMINI_MODEL_OPTIONS,
    openai: OPENAI_MODEL_OPTIONS,
  }[provider];

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
