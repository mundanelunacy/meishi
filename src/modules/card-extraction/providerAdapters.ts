import type { AppSettings, LLMProviderAdapter } from "../../shared/types/models";

export const llmProviders: LLMProviderAdapter[] = [
  {
    provider: "openai",
    displayName: "OpenAI",
    isConfigured: (settings) => settings.openAiApiKey.trim().length > 0,
  },
  {
    provider: "anthropic",
    displayName: "Anthropic",
    isConfigured: (settings) => settings.anthropicApiKey.trim().length > 0,
  },
  {
    provider: "gemini",
    displayName: "Google Gemini",
    isConfigured: () => false,
  },
];

export function getProviderLabel(provider: AppSettings["llmProvider"]) {
  return llmProviders.find((item) => item.provider === provider)?.displayName ?? provider;
}
