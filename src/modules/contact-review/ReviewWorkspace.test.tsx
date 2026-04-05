// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, describe, expect, it, vi } from "vitest";
import { onboardingReducer } from "../onboarding-settings/onboardingSlice";
import { reviewDraftReducer } from "./reviewDraftSlice";
import { ReviewWorkspace } from "./ReviewWorkspace";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("../local-data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../local-data")>();
  return {
    ...actual,
    loadCapturedImages: vi.fn(() => Promise.resolve([])),
    loadLatestDraft: vi.fn(() => Promise.resolve(null)),
    saveDraft: vi.fn(() => Promise.resolve()),
    saveSyncOutcome: vi.fn(() => Promise.resolve()),
  };
});

vi.mock("../google-contacts/googlePeopleApi", () => ({
  useCreateContactMutation: () => [
    vi.fn(),
    {
      isLoading: false,
      isError: false,
      error: null,
    },
  ],
  useUpdateContactPhotoMutation: () => [vi.fn(), {}],
}));

const preloadedState = {
  onboarding: {
    settings: {
      llmProvider: "openai" as const,
      openAiApiKey: "sk-test",
      anthropicApiKey: "",
      preferredOpenAiModel: "gpt-4.1-mini",
      preferredAnthropicModel: "claude-sonnet-4-20250514",
      extractionPrompt: "Use the printed title verbatim.",
      developerDebugMode: true,
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
    draft: {
      id: "draft-1",
      sourceImageIds: ["img-1"],
      fullName: "Ada Lovelace",
      firstName: "Ada",
      lastName: "Lovelace",
      organization: "Analytical Engines",
      title: "Founder",
      email: "ada@example.com",
      phone: "+82 10-1234-5678",
      website: "https://example.com",
      notes: "Met at conference\nX-ASSISTANT: Jane Doe",
      address: "Seoul",
      emails: [
        { value: "ada@example.com", type: "WORK", label: "" },
        { value: "press@example.com", type: "INTERNET", label: "PRESS" },
      ],
      phones: [{ value: "+82 10-1234-5678", type: "WORK", label: "" }],
      websites: [{ value: "https://example.com", type: "WORK", label: "" }],
      addresses: [{ value: "Seoul", type: "WORK", label: "" }],
      relatedPeople: [{ value: "Jane Doe", type: "assistant", label: "EA" }],
      significantDates: [{ value: "2026-04-05", type: "anniversary", label: "Met" }],
      customFields: [{ key: "X-ASSISTANT", value: "Jane Doe" }],
      confidenceNotes: ["Low-confidence title"],
      extractionSnapshot: {
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
        phone: "+82 10-1234-5678",
        phones: [{ value: "+82 10-1234-5678", type: "WORK", label: "" }],
        website: "https://example.com",
        urls: [{ value: "https://example.com", type: "WORK", label: "" }],
        notes: "Met at conference",
        address: "Seoul",
        addresses: [{ value: "Seoul", type: "WORK", label: "" }],
        relations: [{ value: "Jane Doe", type: "assistant", label: "EA" }],
        events: [{ value: "2026-04-05", type: "anniversary", label: "Met" }],
        xFields: [{ name: "X-ASSISTANT", value: "Jane Doe" }],
        ambiguousText: [],
        confidenceNotes: ["Low-confidence title"],
      },
      createdAt: "2026-04-05T00:00:00.000Z",
      updatedAt: "2026-04-05T00:00:00.000Z",
    },
    verifiedContact: null,
  },
};

function renderWorkspace(overrideState?: Partial<typeof preloadedState>) {
  const store = configureStore({
    reducer: {
      onboarding: onboardingReducer,
      reviewDraft: reviewDraftReducer,
    },
    preloadedState: {
      ...preloadedState,
      ...overrideState,
      onboarding: {
        ...preloadedState.onboarding,
        ...overrideState?.onboarding,
      },
      reviewDraft: {
        ...preloadedState.reviewDraft,
        ...overrideState?.reviewDraft,
      },
    },
  });

  render(
    <Provider store={store}>
      <ReviewWorkspace />
    </Provider>
  );

  return { store };
}

describe("ReviewWorkspace", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the developer debug panel when debug mode is enabled", () => {
    renderWorkspace();

    expect(screen.getByText(/developer debug preview/i)).toBeInTheDocument();
    expect(screen.getByText(/raw extraction snapshot/i)).toBeInTheDocument();
    expect(screen.getByText(/derived vcard/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("press@example.com")).toBeInTheDocument();
    expect(screen.getAllByDisplayValue("Jane Doe").length).toBeGreaterThan(0);
  });

  it("hides the developer debug panel when debug mode is disabled", () => {
    renderWorkspace({
      onboarding: {
        ...preloadedState.onboarding,
        settings: {
          ...preloadedState.onboarding.settings,
          developerDebugMode: false,
        },
      },
    });

    expect(screen.queryByText(/developer debug preview/i)).not.toBeInTheDocument();
  });

  it("updates preview output from current form edits", async () => {
    renderWorkspace();
    const user = userEvent.setup();

    await user.clear(screen.getByPlaceholderText("+82 10-1234-5678"));
    await user.type(screen.getByPlaceholderText("+82 10-1234-5678"), "+82 10-2222-3333");

    expect(screen.getByText(/derived google createcontact payload/i).nextElementSibling).toHaveTextContent(
      "+82 10-2222-3333"
    );
    expect(screen.getByText(/derived vcard/i).nextElementSibling).toHaveTextContent("+82 10-2222-3333");
  });

  it("allows adding extra repeatable and custom fields", async () => {
    renderWorkspace();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /add email/i }));
    const emailInputs = screen.getAllByPlaceholderText("name@example.com");
    await user.type(emailInputs[emailInputs.length - 1], "team@example.com");
    await user.click(screen.getByRole("button", { name: /add custom field/i }));

    expect(screen.getByDisplayValue("team@example.com")).toBeInTheDocument();
    expect(screen.getAllByText(/custom field/i).length).toBeGreaterThan(0);
  });
});
