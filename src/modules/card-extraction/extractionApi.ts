import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import type { AppSettings, ExtractionRequest } from "../../shared/types/models";
import type { BusinessCardExtraction } from "./extractionSchema";
import { extractBusinessCardWithProvider } from "./structuredExtraction";

interface ExtractionApiState {
  onboarding: {
    settings: Pick<
      AppSettings,
      | "llmProvider"
      | "openAiApiKey"
      | "anthropicApiKey"
      | "preferredOpenAiModel"
      | "preferredAnthropicModel"
      | "extractionPrompt"
    >;
  };
}

export const extractionApi = createApi({
  reducerPath: "extractionApi",
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    extractBusinessCard: builder.mutation<BusinessCardExtraction, ExtractionRequest>({
      async queryFn(request, api) {
        const state = api.getState() as ExtractionApiState;

        try {
          const data = await extractBusinessCardWithProvider({
            request,
            settings: state.onboarding.settings,
          });
          return { data };
        } catch (error) {
          return {
            error: {
              status: 500,
              data: error instanceof Error ? error.message : "Business card extraction failed.",
            },
          };
        }
      },
    }),
  }),
});

export const { useExtractBusinessCardMutation } = extractionApi;
