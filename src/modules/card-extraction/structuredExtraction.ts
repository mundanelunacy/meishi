import { base64FromDataUrl, assertNever } from "../../shared/lib/utils";
import { buildEffectiveExtractionPrompt } from "../../shared/lib/extractionPrompt";
import type {
  AppSettings,
  ExtractionRequest,
  SupportedLlmProvider,
} from "../../shared/types/models";
import {
  businessCardExtractionJsonSchema,
  businessCardExtractionSchema,
  type BusinessCardExtraction,
} from "./extractionSchema";

type ExtractionSettings = Pick<
  AppSettings,
  | "llmProvider"
  | "openAiApiKey"
  | "anthropicApiKey"
  | "preferredOpenAiModel"
  | "preferredAnthropicModel"
  | "extractionPrompt"
>;

interface ExtractionContext {
  request: ExtractionRequest;
  settings: ExtractionSettings;
  fetchImpl?: typeof fetch;
}

type ExtractionRuntimeContext = Omit<ExtractionContext, "fetchImpl"> & {
  fetchImpl: typeof fetch;
};

export async function extractBusinessCardWithProvider({
  request,
  settings,
  fetchImpl = fetch,
}: ExtractionContext): Promise<BusinessCardExtraction> {
  switch (settings.llmProvider) {
    case "openai":
      return extractWithOpenAi({ request, settings, fetchImpl });
    case "anthropic":
      return extractWithAnthropic({ request, settings, fetchImpl });
    case "gemini":
      throw new Error("Gemini extraction is not implemented yet.");
    default:
      return assertNever(settings.llmProvider);
  }
}

async function extractWithOpenAi({
  request,
  settings,
  fetchImpl,
}: ExtractionRuntimeContext): Promise<BusinessCardExtraction> {
  if (!settings.openAiApiKey.trim()) {
    throw new Error("Add an OpenAI API key in settings before extraction.");
  }

  const response = await fetchImpl("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: settings.preferredOpenAiModel,
      input: buildOpenAiInput(request, settings.extractionPrompt),
      text: {
        format: {
          type: "json_schema",
          name: "business_card_extraction",
          strict: true,
          schema: businessCardExtractionJsonSchema,
        },
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(readProviderError(payload, "OpenAI extraction failed."));
  }

  const rawText = readOpenAiOutputText(payload);
  return businessCardExtractionSchema.parse(JSON.parse(rawText));
}

async function extractWithAnthropic({
  request,
  settings,
  fetchImpl,
}: ExtractionRuntimeContext): Promise<BusinessCardExtraction> {
  if (!settings.anthropicApiKey.trim()) {
    throw new Error("Add an Anthropic API key in settings before extraction.");
  }

  const response = await fetchImpl("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": settings.anthropicApiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: settings.preferredAnthropicModel,
      max_tokens: 1400,
      system:
        "Extract business card details with the provided tool only. Do not respond with prose.",
      messages: [
        {
          role: "user",
          content: buildAnthropicContent(request, settings.extractionPrompt),
        },
      ],
      tools: [
        {
          name: "submit_business_card_extraction",
          description: "Return the validated business card extraction payload.",
          input_schema: businessCardExtractionJsonSchema,
        },
      ],
      tool_choice: {
        type: "tool",
        name: "submit_business_card_extraction",
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(readProviderError(payload, "Anthropic extraction failed."));
  }

  const structured = readAnthropicToolInput(payload);
  return businessCardExtractionSchema.parse(structured);
}

function buildOpenAiInput(
  request: ExtractionRequest,
  extractionPrompt: string,
) {
  const effectivePrompt = buildEffectiveExtractionPrompt(extractionPrompt);
  return [
    {
      role: "system",
      content: [
        {
          type: "input_text",
          text: "Return only the required structured extraction. Never invent unsupported fields.",
        },
      ],
    },
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: effectivePrompt,
        },
        ...request.images.map((image) => ({
          type: "input_image" as const,
          image_url: image.dataUrl,
        })),
      ],
    },
  ];
}

function buildAnthropicContent(
  request: ExtractionRequest,
  extractionPrompt: string,
) {
  const effectivePrompt = buildEffectiveExtractionPrompt(extractionPrompt);
  return [
    {
      type: "text",
      text: effectivePrompt,
    },
    ...request.images.map((image) => ({
      type: "image",
      source: {
        type: "base64",
        media_type: image.mimeType,
        data: base64FromDataUrl(image.dataUrl),
      },
    })),
  ];
}

function readOpenAiOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("OpenAI returned an empty response.");
  }

  const output = Reflect.get(payload, "output");
  if (!Array.isArray(output)) {
    throw new Error("OpenAI response did not include output content.");
  }

  const text = output
    .flatMap((item) => {
      const content =
        typeof item === "object" && item
          ? Reflect.get(item, "content")
          : undefined;
      return Array.isArray(content) ? content : [];
    })
    .map((item) => {
      if (typeof item !== "object" || !item) {
        return "";
      }

      const candidate = Reflect.get(item, "text");
      return typeof candidate === "string" ? candidate : "";
    })
    .join("");

  if (!text) {
    throw new Error("OpenAI returned no structured text.");
  }

  return text;
}

function readAnthropicToolInput(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Anthropic returned an empty response.");
  }

  const content = Reflect.get(payload, "content");
  if (!Array.isArray(content)) {
    throw new Error("Anthropic response did not include content blocks.");
  }

  const toolUse = content.find((item) => {
    if (typeof item !== "object" || !item) {
      return false;
    }

    return Reflect.get(item, "type") === "tool_use";
  });

  if (!toolUse || typeof toolUse !== "object") {
    throw new Error("Anthropic returned no structured tool payload.");
  }

  const input = Reflect.get(toolUse, "input");
  if (!input || typeof input !== "object") {
    throw new Error("Anthropic tool payload was empty.");
  }

  return input;
}

function readProviderError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const error = Reflect.get(payload, "error");
  if (typeof error === "object" && error) {
    const message = Reflect.get(error, "message");
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }

  const message = Reflect.get(payload, "message");
  if (typeof message === "string" && message.length > 0) {
    return message;
  }

  return fallback;
}

export function hasConfiguredProviderKey(settings: ExtractionSettings) {
  return getProviderApiKey(settings).trim().length > 0;
}

export function getProviderApiKey(settings: ExtractionSettings) {
  return getSettingsByProvider(settings.llmProvider, settings);
}

function getSettingsByProvider(
  provider: SupportedLlmProvider,
  settings: ExtractionSettings,
) {
  switch (provider) {
    case "openai":
      return settings.openAiApiKey;
    case "anthropic":
      return settings.anthropicApiKey;
    case "gemini":
      return "";
    default:
      return assertNever(provider);
  }
}
