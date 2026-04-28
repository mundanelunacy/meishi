import type {
  AppSettings,
  LlmValidationResult,
  SupportedLlmProvider,
} from "../../shared/types/models";

export interface LlmConfigurationIdentity {
  provider: SupportedLlmProvider;
  apiKey: string;
  model: string;
}

export type LlmValidationPrecheckReason =
  | "missing_api_key"
  | "too_short"
  | "invalid_format"
  | "missing_model";

export interface LlmValidationPrecheck {
  eligible: boolean;
  reason?: LlmValidationPrecheckReason;
}

type ValidationCompatibleSettings = Pick<
  AppSettings,
  | "llmProvider"
  | "openAiApiKey"
  | "anthropicApiKey"
  | "geminiApiKey"
  | "preferredOpenAiModel"
  | "preferredAnthropicModel"
  | "preferredGeminiModel"
>;

interface ValidateLlmConfigurationOptions {
  fetchImpl?: typeof fetch;
}

export function getCurrentLlmConfiguration(
  settings: ValidationCompatibleSettings,
): LlmConfigurationIdentity | null {
  switch (settings.llmProvider) {
    case "openai": {
      const apiKey = settings.openAiApiKey.trim();
      const model = settings.preferredOpenAiModel.trim();
      return apiKey && model
        ? {
            provider: "openai",
            apiKey,
            model,
          }
        : null;
    }
    case "anthropic": {
      const apiKey = settings.anthropicApiKey.trim();
      const model = settings.preferredAnthropicModel.trim();
      return apiKey && model
        ? {
            provider: "anthropic",
            apiKey,
            model,
          }
        : null;
    }
    case "gemini": {
      const apiKey = settings.geminiApiKey.trim();
      const model = settings.preferredGeminiModel.trim();
      return apiKey && model
        ? {
            provider: "gemini",
            apiKey,
            model,
          }
        : null;
    }
  }
}

export function matchesLlmConfiguration(
  candidate: LlmConfigurationIdentity | null | undefined,
  expected: LlmConfigurationIdentity | null | undefined,
) {
  if (!candidate || !expected) {
    return false;
  }

  return (
    candidate.provider === expected.provider &&
    candidate.apiKey === expected.apiKey &&
    candidate.model === expected.model
  );
}

export function getValidationIdentity(
  result: Pick<LlmValidationResult, "provider" | "apiKey" | "model"> | null,
): LlmConfigurationIdentity | null {
  if (!result) {
    return null;
  }

  return {
    provider: result.provider,
    apiKey: result.apiKey,
    model: result.model,
  };
}

export function getLlmValidationPrecheck(
  configuration: LlmConfigurationIdentity | null,
): LlmValidationPrecheck {
  if (!configuration) {
    return {
      eligible: false,
      reason: "missing_api_key",
    };
  }

  if (!configuration.model.trim()) {
    return {
      eligible: false,
      reason: "missing_model",
    };
  }

  if (configuration.apiKey.length < 20) {
    return {
      eligible: false,
      reason: "too_short",
    };
  }

  const pattern = getApiKeyPattern(configuration.provider);

  if (!pattern.test(configuration.apiKey)) {
    return {
      eligible: false,
      reason: "invalid_format",
    };
  }

  return {
    eligible: true,
  };
}

export async function validateLlmConfiguration(
  configuration: LlmConfigurationIdentity,
  { fetchImpl = fetch }: ValidateLlmConfigurationOptions = {},
) {
  switch (configuration.provider) {
    case "openai":
      await validateOpenAiConfiguration(configuration, fetchImpl);
      return;
    case "anthropic":
      await validateAnthropicConfiguration(configuration, fetchImpl);
      return;
    case "gemini":
      await validateGeminiConfiguration(configuration, fetchImpl);
      return;
  }
}

function getApiKeyPattern(provider: SupportedLlmProvider) {
  switch (provider) {
    case "anthropic":
      return /^sk-ant-[A-Za-z0-9._-]+$/;
    case "gemini":
      return /^AIza[A-Za-z0-9_-]+$/;
    case "openai":
      return /^sk-[A-Za-z0-9._-]+$/;
  }
}

async function validateOpenAiConfiguration(
  configuration: LlmConfigurationIdentity,
  fetchImpl: typeof fetch,
) {
  const response = await fetchImpl("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${configuration.apiKey}`,
    },
    body: JSON.stringify({
      model: configuration.model,
      max_output_tokens: 16,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Reply with OK.",
            },
          ],
        },
      ],
    }),
  });

  if (response.ok) {
    return;
  }

  throw new Error(
    readProviderError(
      await readJsonPayload(response),
      "OpenAI rejected this key or model. Check that the key is correct and has access to the selected model.",
    ),
  );
}

async function validateAnthropicConfiguration(
  configuration: LlmConfigurationIdentity,
  fetchImpl: typeof fetch,
) {
  const response = await fetchImpl("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": configuration.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: configuration.model,
      max_tokens: 16,
      messages: [
        {
          role: "user",
          content: "Reply with OK.",
        },
      ],
    }),
  });

  if (response.ok) {
    return;
  }

  throw new Error(
    readProviderError(
      await readJsonPayload(response),
      "Anthropic rejected this key or model. Check that the key is correct and has access to the selected model.",
    ),
  );
}

async function validateGeminiConfiguration(
  configuration: LlmConfigurationIdentity,
  fetchImpl: typeof fetch,
) {
  const response = await fetchImpl(getGeminiGenerateContentUrl(configuration.model), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": configuration.apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Reply with OK.",
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 16,
        ...getGeminiValidationThinkingConfig(configuration.model),
      },
    }),
  });

  if (response.ok) {
    return;
  }

  throw new Error(
    readProviderError(
      await readJsonPayload(response),
      "Gemini rejected this key or model. Check that the key is correct and has access to the selected model.",
    ),
  );
}

function getGeminiGenerateContentUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent`;
}

function getGeminiValidationThinkingConfig(model: string) {
  if (!model.includes("2.5-flash")) {
    return {};
  }

  return {
    thinkingConfig: {
      thinkingBudget: 0,
    },
  };
}

async function readJsonPayload(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function readProviderError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const error = Reflect.get(payload, "error");
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const message = Reflect.get(error, "message");
  return typeof message === "string" && message.trim() ? message : fallback;
}
