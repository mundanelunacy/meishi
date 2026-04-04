import type { AppSettings, LLMProviderAdapter } from "../../shared/types/models";

function keyConfigured(settings: AppSettings) {
  return settings.llmApiKey.trim().length > 0;
}

export const llmProviders: LLMProviderAdapter[] = [
  {
    provider: "openai",
    displayName: "OpenAI",
    isConfigured: keyConfigured,
  },
  {
    provider: "anthropic",
    displayName: "Anthropic",
    isConfigured: keyConfigured,
  },
  {
    provider: "gemini",
    displayName: "Google Gemini",
    isConfigured: keyConfigured,
  },
];

export function getProviderLabel(provider: AppSettings["llmProvider"]) {
  return llmProviders.find((item) => item.provider === provider)?.displayName ?? provider;
}
