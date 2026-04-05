import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { businessCardExtractionSchema } from "./extractionSchema";
import type { AppSettings, ExtractionRequest } from "../../shared/types/models";

interface OpenAiApiState {
  onboarding: {
    settings: Pick<AppSettings, "llmApiKey" | "preferredOpenAiModel" | "llmProvider">;
  };
}

function buildInput(request: ExtractionRequest) {
  return [
    {
      role: "system",
      content: [
        {
          type: "input_text",
          text:
            "Extract business card details into the provided JSON schema. Use empty strings for unknown scalar fields and note uncertainty in confidenceNotes.",
        },
      ],
    },
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text:
            "Read every image, combine duplicate fields, and infer first and last name only when the card clearly supports it.",
        },
        ...request.images.map((image) => ({
          type: "input_image" as const,
          image_url: image.dataUrl,
        })),
      ],
    },
  ];
}

function readOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("OpenAI returned an empty response.");
  }

  const output = Reflect.get(payload, "output");
  if (!Array.isArray(output)) {
    throw new Error("OpenAI response did not include output content.");
  }

  const text = output
    .flatMap((item) => {
      const content = typeof item === "object" && item ? Reflect.get(item, "content") : undefined;
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

export const openAiApi = createApi({
  reducerPath: "openAiApi",
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    extractBusinessCard: builder.mutation<
      ReturnType<typeof businessCardExtractionSchema.parse>,
      ExtractionRequest
    >({
      async queryFn(request, api) {
        const state = api.getState() as OpenAiApiState;
        const { llmApiKey, preferredOpenAiModel, llmProvider } = state.onboarding.settings;

        if (llmProvider !== "openai") {
          return {
            error: {
              status: 400,
              data: "OpenAI is the only implemented provider in this scaffold.",
            },
          };
        }

        if (!llmApiKey) {
          return {
            error: {
              status: 400,
              data: "Add an OpenAI API key in settings before extraction.",
            },
          };
        }

        try {
          const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${llmApiKey}`,
            },
            body: JSON.stringify({
              model: preferredOpenAiModel,
              input: buildInput(request),
              text: {
                format: {
                  type: "json_schema",
                  name: "business_card_extraction",
                  strict: true,
                  schema: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      fullName: { type: "string" },
                      firstName: { type: "string" },
                      lastName: { type: "string" },
                      organization: { type: "string" },
                      title: { type: "string" },
                      email: { type: "string" },
                      phone: { type: "string" },
                      website: { type: "string" },
                      notes: { type: "string" },
                      address: { type: "string" },
                      confidenceNotes: {
                        type: "array",
                        items: { type: "string" },
                      },
                    },
                    required: [
                      "fullName",
                      "firstName",
                      "lastName",
                      "organization",
                      "title",
                      "email",
                      "phone",
                      "website",
                      "notes",
                      "address",
                      "confidenceNotes",
                    ],
                  },
                },
              },
            }),
          });

          const payload = await response.json();
          if (!response.ok) {
            return {
              error: {
                status: response.status,
                data: payload,
              },
            };
          }

          const rawText = readOutputText(payload);
          const parsed = businessCardExtractionSchema.parse(JSON.parse(rawText));
          return { data: parsed };
        } catch (error) {
          return {
            error: {
              status: 500,
              data: error instanceof Error ? error.message : "OpenAI extraction failed.",
            },
          };
        }
      },
    }),
  }),
});

export const { useExtractBusinessCardMutation } = openAiApi;
