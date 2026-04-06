// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

const syncContactMock = vi.fn();
const useSyncGoogleContactMock = vi.fn(() => ({
  syncContact: syncContactMock,
  isSyncing: false,
  errorMessage: null,
}));
const pushToastMock = vi.fn();
const saveContactVCardMock = vi.fn();

vi.mock("../google-contacts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../google-contacts")>();
  return {
    ...actual,
    useSyncGoogleContact: () => useSyncGoogleContactMock(),
  };
});

vi.mock("../vcard-export", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../vcard-export")>();
  return {
    ...actual,
    saveContactVCard: (...args: unknown[]) => saveContactVCardMock(...args),
  };
});

vi.mock("../../shared/ui/toastBus", () => ({
  pushToast: (message: string) => pushToastMock(message),
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
  beforeEach(() => {
    syncContactMock.mockReset();
    syncContactMock.mockResolvedValue({
      outcome: {
        contactResourceName: "people/123",
        photoUploaded: true,
        localOnlyImageIds: [],
        syncedAt: "2026-04-06T00:00:00.000Z",
      },
    });
    useSyncGoogleContactMock.mockReset();
    useSyncGoogleContactMock.mockReturnValue({
      syncContact: syncContactMock,
      isSyncing: false,
      errorMessage: null,
    });
    pushToastMock.mockReset();
    saveContactVCardMock.mockReset();
    saveContactVCardMock.mockResolvedValue("downloaded");
  });

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

  it("submits through the google-contacts module sync entrypoint", async () => {
    renderWorkspace();
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: /save to google contacts/i }),
    );

    await waitFor(() => expect(syncContactMock).toHaveBeenCalledTimes(1));
    expect(syncContactMock).toHaveBeenCalledWith({
      contact: expect.objectContaining({
        id: "draft-1",
        fullName: "Ada Lovelace",
        selectedPhotoImageId: "img-1",
        verifiedAt: expect.any(String),
      }),
      images: expect.arrayContaining([
        expect.objectContaining({
          id: "img-1",
        }),
      ]),
    });
    expect(pushToastMock).toHaveBeenCalledWith(
      "Verified contact synced to Google Contacts.",
    );
  });

  it("exports a vCard from the current reviewed form values", async () => {
    renderWorkspace();
    const user = userEvent.setup();

    await user.clear(screen.getByLabelText(/full name/i));
    await user.type(screen.getByLabelText(/full name/i), "Ada Byron");
    await user.click(screen.getByRole("button", { name: /save vcard/i }));

    await waitFor(() =>
      expect(saveContactVCardMock).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "Ada Byron",
          selectedPhotoImageId: "img-1",
          verifiedAt: expect.any(String),
        }),
      ),
    );
    expect(pushToastMock).toHaveBeenCalledWith("vCard downloaded to your device.");
    expect(syncContactMock).not.toHaveBeenCalled();
  });

  it("shows the share-sheet success toast when native sharing is used", async () => {
    saveContactVCardMock.mockResolvedValue("shared");

    renderWorkspace();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /save vcard/i }));

    await waitFor(() =>
      expect(pushToastMock).toHaveBeenCalledWith(
        "vCard opened in the share sheet.",
      ),
    );
  });

  it("disables submit for the full sync operation", () => {
    useSyncGoogleContactMock.mockReturnValue({
      syncContact: syncContactMock,
      isSyncing: true,
      errorMessage: null,
    });

    renderWorkspace();

    expect(
      screen.getByRole("button", { name: /syncing/i }),
    ).toBeDisabled();
  });

  it("shows partial-success warning toast when photo upload exhausts retries", async () => {
    syncContactMock.mockResolvedValue({
      outcome: {
        contactResourceName: "people/123",
        photoUploaded: false,
        localOnlyImageIds: ["img-2"],
        syncedAt: "2026-04-06T00:00:00.000Z",
      },
      warningMessage:
        "Google contact created, but the photo upload failed after 3 attempts.",
    });

    renderWorkspace();
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: /save to google contacts/i }),
    );

    await waitFor(() =>
      expect(pushToastMock).toHaveBeenCalledWith(
        "Google contact created, but the photo upload failed after 3 attempts.",
      ),
    );
  });

  it("renders the module-provided sync error message", () => {
    useSyncGoogleContactMock.mockReturnValue({
      syncContact: syncContactMock,
      isSyncing: false,
      errorMessage: "Google authorization is required before syncing contacts.",
    });

    renderWorkspace();

    expect(
      screen.getByText("Google authorization is required before syncing contacts."),
    ).toBeInTheDocument();
  });
});
