// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { describe, expect, it, vi } from "vitest";
import type {
  ExtractionRequest,
  ContactDraft,
} from "../../shared/types/models";
import type { BusinessCardExtraction } from "../card-extraction/extractionSchema";
import { onboardingReducer } from "../onboarding-settings/onboardingSlice";
import { reviewDraftReducer } from "../contact-review/reviewDraftSlice";
import { CaptureWorkspace } from "./CaptureWorkspace";

const navigateMock = vi.fn();
const saveDraftMock = vi.fn(async (draft: ContactDraft) => {
  void draft;
});
const extractBusinessCardMock = vi.fn(async (request: ExtractionRequest) => {
  void request;
  return { data: {} as BusinessCardExtraction } as {
    data: BusinessCardExtraction;
  };
});

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("../local-data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../local-data")>();
  return {
    ...actual,
    loadCapturedImages: vi.fn(() => Promise.resolve([])),
    saveCapturedImages: vi.fn(() => Promise.resolve()),
    saveDraft: (draft: ContactDraft) => saveDraftMock(draft),
  };
});

vi.mock("../card-extraction/extractionApi", () => ({
  useExtractBusinessCardMutation: () => [
    (request: ExtractionRequest) => extractBusinessCardMock(request),
    {
      isLoading: false,
    },
  ],
}));

describe("CaptureWorkspace", () => {
  it("persists the extracted draft and navigates to review", async () => {
    extractBusinessCardMock.mockResolvedValue({
      data: {
        fullName: "Ada Lovelace",
        firstName: "Ada",
        lastName: "Lovelace",
        organization: "Analytical Engines",
        title: "Founder",
        email: "ada@example.com",
        emails: [
          { value: "ada@example.com", type: "WORK", label: "" },
          { value: "press@example.com", type: "INTERNET", label: "PRESS" },
        ],
        phone: "",
        phones: [],
        website: "",
        urls: [],
        notes: "",
        address: "",
        addresses: [],
        relations: [],
        events: [],
        xFields: [{ name: "X-ASSISTANT", value: "Jane Doe" }],
        ambiguousText: ["Tower B, Level 7"],
        confidenceNotes: ["Low-confidence title"],
      },
    });

    const store = configureStore({
      reducer: {
        onboarding: onboardingReducer,
        reviewDraft: reviewDraftReducer,
      },
      preloadedState: {
        onboarding: {
          settings: {
            llmProvider: "openai" as const,
            openAiApiKey: "sk-test",
            anthropicApiKey: "",
            preferredOpenAiModel: "gpt-4.1-mini",
            preferredAnthropicModel: "claude-sonnet-4-20250514",
            extractionPrompt: "Use the printed title verbatim.",
            developerDebugMode: false,
            onboardingCompletedAt: "2026-04-05T00:00:00.000Z",
          },
          googleAuth: {
            mode: "mock" as const,
            accessToken: "mock-token",
            scope: "https://www.googleapis.com/auth/contacts",
            expiresAt: Date.now() + 60_000,
            accountHint: "developer@local.test",
          },
        },
        reviewDraft: {
          images: [
            {
              id: "img-1",
              dataUrl: "data:image/png;base64,ZmFrZQ==",
              fileName: "card.png",
              mimeType: "image/png",
              capturedAt: "2026-04-05T00:00:00.000Z",
              width: 1200,
              height: 800,
            },
          ],
          draft: null,
          verifiedContact: null,
        },
      },
    });

    render(
      <Provider store={store}>
        <CaptureWorkspace />
      </Provider>,
    );

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: /extract contact draft/i }));

    await waitFor(() => {
      expect(saveDraftMock).toHaveBeenCalledOnce();
    });

    expect(saveDraftMock.mock.calls[0][0]).toMatchObject({
      fullName: "Ada Lovelace",
      sourceImageIds: ["img-1"],
      extractionSnapshot: {
        fullName: "Ada Lovelace",
      },
    });
    expect(navigateMock).toHaveBeenCalledWith({ to: "/review" });
  });
});
