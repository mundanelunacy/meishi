// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
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
      namePrefix: "Countess",
      firstName: "Ada",
      phoneticFirstName: "A-da",
      phoneticMiddleName: "By-ron",
      phoneticLastName: "Love-lace",
      lastName: "Lovelace",
      nickname: "Ada",
      fileAs: "Lovelace, Ada",
      organization: "Analytical Engines",
      department: "Research",
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
        namePrefix: "Countess",
        firstName: "Ada",
        phoneticFirstName: "A-da",
        phoneticMiddleName: "By-ron",
        phoneticLastName: "Love-lace",
        lastName: "Lovelace",
        nickname: "Ada",
        fileAs: "Lovelace, Ada",
        organization: "Analytical Engines",
        department: "Research",
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
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("https://example.test/review"),
    });
  });

  it("shows the developer debug panel when the debug URL flag is enabled", () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("https://example.test/review?debug=1"),
    });

    renderWorkspace();

    expect(screen.getByText(/developer debug preview/i)).toBeInTheDocument();
    expect(screen.getByText(/raw extraction snapshot/i)).toBeInTheDocument();
    expect(screen.getByText(/derived vcard/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("press@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Lovelace, Ada")).toBeInTheDocument();
    expect(screen.getAllByDisplayValue("Jane Doe").length).toBeGreaterThan(0);
  });

  it("hides the developer debug panel when the debug URL flag is absent", () => {
    renderWorkspace();

    expect(screen.queryByText(/developer debug preview/i)).not.toBeInTheDocument();
  });

  it("updates preview output from current form edits", async () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("https://example.test/review?debug=1"),
    });

    renderWorkspace();
    const user = userEvent.setup();
    const phoneSection = screen
      .getByText(/phone numbers/i)
      .closest("section");

    if (!phoneSection) {
      throw new Error("Phone numbers section not found.");
    }

    await user.clear(within(phoneSection).getByDisplayValue("+82 10-1234-5678"));
    await user.type(
      within(phoneSection).getByLabelText("Value"),
      "+82 10-2222-3333",
    );
    await user.clear(screen.getByLabelText(/file as/i));
    await user.type(screen.getByLabelText(/file as/i), "Ada Lovelace");

    expect(screen.getByText(/derived google createcontact payload/i).nextElementSibling).toHaveTextContent(
      "+82 10-2222-3333"
    );
    expect(screen.getByText(/derived google createcontact payload/i).nextElementSibling).toHaveTextContent(
      "Ada Lovelace"
    );
    expect(screen.getByText(/derived vcard/i).nextElementSibling).toHaveTextContent("+82 10-2222-3333");
  });

  it("allows adding extra repeatable and custom fields", async () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("https://example.test/review?debug=1"),
    });

    renderWorkspace();
    const user = userEvent.setup();
    const emailSection = screen
      .getByText(/^Email addresses$/)
      .closest("section");

    if (!emailSection) {
      throw new Error("Email addresses section not found.");
    }

    await user.click(screen.getByRole("button", { name: /add email/i }));
    const emailInputs = within(emailSection).getAllByLabelText("Value");
    await user.type(emailInputs[emailInputs.length - 1], "team@example.com");
    await user.click(screen.getByRole("button", { name: /add custom field/i }));

    expect(screen.getByDisplayValue("team@example.com")).toBeInTheDocument();
    expect(screen.getAllByText(/custom field/i).length).toBeGreaterThan(0);
  });

  it("renders the new Google Contacts-aligned name and company fields", () => {
    renderWorkspace();

    expect(screen.getByLabelText(/name prefix/i)).toHaveValue("Countess");
    expect(screen.getByLabelText(/phonetic first/i)).toHaveValue("A-da");
    expect(screen.getByLabelText(/phonetic middle/i)).toHaveValue("By-ron");
    expect(screen.getByLabelText(/phonetic last/i)).toHaveValue("Love-lace");
    expect(screen.getByLabelText(/nickname/i)).toHaveValue("Ada");
    expect(screen.getByLabelText(/file as/i)).toHaveValue("Lovelace, Ada");
    expect(screen.getByLabelText(/department/i)).toHaveValue("Research");
  });
});
