// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "../../test/renderWithIntl";
import { onboardingReducer } from "../onboarding-settings/onboardingSlice";
import { reviewDraftReducer } from "./reviewDraftSlice";
import { ReviewWorkspace } from "./ReviewWorkspace";

const saveCapturedImagesMock = vi.fn(() => Promise.resolve());

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("../local-data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../local-data")>();
  return {
    ...actual,
    loadCapturedImages: vi.fn(() => Promise.resolve([])),
    loadLatestDraft: vi.fn(() => Promise.resolve(null)),
    saveCapturedImages: (...args: unknown[]) => saveCapturedImagesMock(...args),
    saveDraft: vi.fn(() => Promise.resolve()),
    saveSyncOutcome: vi.fn(() => Promise.resolve()),
  };
});

const syncContactMock = vi.fn();
const connectGoogleContactsMock = vi.fn();
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

vi.mock("../google-auth/googleIdentity", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../google-auth/googleIdentity")>();
  return {
    ...actual,
    connectGoogleContacts: (...args: unknown[]) =>
      connectGoogleContactsMock(...args),
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
      preferredOpenAiModel: "gpt-5.4-mini",
      preferredAnthropicModel: "claude-sonnet-4-20250514",
      extractionPrompt: "Use the printed title verbatim.",
      onboardingCompletedAt: "2026-04-05T00:00:00.000Z",
    },
    googleAuth: {
      status: "connected" as const,
      firebaseUid: "firebase-uid-1",
      scope: "https://www.googleapis.com/auth/contacts",
      accountEmail: "developer@example.com",
      connectedAt: "2026-04-06T00:00:00.000Z",
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
      significantDates: [
        { value: "2026-04-05", type: "anniversary", label: "Met" },
      ],
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

  renderWithIntl(
    <Provider store={store}>
      <ReviewWorkspace />
    </Provider>,
  );

  return { store };
}

describe("ReviewWorkspace", () => {
  beforeEach(() => {
    syncContactMock.mockReset();
    connectGoogleContactsMock.mockReset();
    connectGoogleContactsMock.mockResolvedValue({
      status: "connected",
      firebaseUid: "firebase-uid-1",
      scope: "https://www.googleapis.com/auth/contacts",
      accountEmail: "developer@example.com",
      connectedAt: "2026-04-06T00:00:00.000Z",
    });
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
    saveCapturedImagesMock.mockReset();
    saveCapturedImagesMock.mockResolvedValue(undefined);
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

    expect(
      screen.queryByText(/developer debug preview/i),
    ).not.toBeInTheDocument();
  });

  it("connects Google on demand before syncing when signed out", async () => {
    const { store } = renderWorkspace({
      onboarding: {
        ...preloadedState.onboarding,
        googleAuth: {
          status: "signed_out",
          firebaseUid: "firebase-uid-1",
          scope: null,
          accountEmail: undefined,
          connectedAt: null,
        },
      },
    });

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: /save to google contacts/i }),
    );

    await waitFor(() => {
      expect(connectGoogleContactsMock).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(syncContactMock).toHaveBeenCalledTimes(1);
    });

    expect(store.getState().onboarding.googleAuth.status).toBe("connected");
    expect(pushToastMock).toHaveBeenCalledWith(
      "Verified contact synced to Google Contacts.",
    );
  });

  it("updates preview output from current form edits", async () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("https://example.test/review?debug=1"),
    });

    renderWorkspace();
    const user = userEvent.setup();
    const phoneSection = screen.getByLabelText("Phone numbers");

    await user.clear(
      within(phoneSection).getByDisplayValue("+82 10-1234-5678"),
    );
    await user.type(
      within(phoneSection).getByLabelText("Phone"),
      "+82 10-2222-3333",
    );
    await user.clear(screen.getByLabelText(/file as/i));
    await user.type(screen.getByLabelText(/file as/i), "Ada Lovelace");

    expect(
      screen.getByText(/derived google createcontact payload/i)
        .nextElementSibling,
    ).toHaveTextContent("+82 10-2222-3333");
    expect(
      screen.getByText(/derived google createcontact payload/i)
        .nextElementSibling,
    ).toHaveTextContent("Ada Lovelace");
    expect(
      screen.getByText(/derived vcard/i).nextElementSibling,
    ).toHaveTextContent("+82 10-2222-3333");
  });

  it("allows adding extra repeatable and custom fields", async () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("https://example.test/review?debug=1"),
    });

    renderWorkspace();
    const user = userEvent.setup();
    const emailSection = screen.getByLabelText("Email addresses");

    await user.click(screen.getByRole("button", { name: /add email/i }));
    const emailInputs = within(emailSection).getAllByLabelText("Email");
    await user.type(emailInputs[emailInputs.length - 1], "team@example.com");
    await user.click(screen.getByRole("button", { name: /add custom field/i }));

    expect(screen.getByDisplayValue("team@example.com")).toBeInTheDocument();
    expect(screen.getAllByText(/custom field/i).length).toBeGreaterThan(0);
  });

  it("auto-expands optional sections when extracted hidden fields have data", async () => {
    renderWorkspace();

    expect(screen.getByText("Photoroll")).toBeInTheDocument();
    await screen.findByRole("button", { name: /^show less$/i });
    expect(screen.getByLabelText(/phonetic first/i)).toHaveValue("A-da");
    expect(screen.getByLabelText(/phonetic last/i)).toHaveValue("Love-lace");
    expect(screen.getByLabelText(/file as/i)).toHaveValue("Lovelace, Ada");
    expect(screen.getByLabelText(/department/i)).toHaveValue("Research");
    expect(screen.getByLabelText("Related people")).toBeInTheDocument();
    expect(document.getElementById("review-name-prefix")).toHaveValue(
      "Countess",
    );
    expect(document.getElementById("review-phonetic-middle-name")).toHaveValue(
      "By-ron",
    );
    expect(document.getElementById("review-nickname")).toHaveValue("Ada");
  });

  it("starts with optional sections collapsed when extracted hidden fields are empty", async () => {
    renderWorkspace({
      reviewDraft: {
        ...preloadedState.reviewDraft,
        draft: {
          ...preloadedState.reviewDraft.draft,
          namePrefix: "",
          phoneticMiddleName: "",
          nickname: "",
          relatedPeople: [],
          significantDates: [],
        },
      },
    });

    expect(
      screen.getByRole("button", { name: /^show more$/i }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/name prefix/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/phonetic middle/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Related people")).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^show more$/i }));

    expect(
      screen.getByRole("button", { name: /show fewer name fields/i }),
    ).toBeInTheDocument();
    expect(document.getElementById("review-name-prefix")).toBeInTheDocument();
    expect(
      document.getElementById("review-phonetic-middle-name"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Related people")).toBeInTheDocument();
  });

  it("toggles which photoroll image will be uploaded to Google", async () => {
    renderWorkspace({
      reviewDraft: {
        ...preloadedState.reviewDraft,
        images: [
          ...preloadedState.reviewDraft.images,
          {
            id: "img-2",
            dataUrl: "data:image/png;base64,YmFjaw==",
            fileName: "back.png",
            mimeType: "image/png",
            capturedAt: "2026-04-05T00:05:00.000Z",
            width: 1200,
            height: 800,
          },
        ],
        draft: {
          ...preloadedState.reviewDraft.draft,
          sourceImageIds: ["img-1", "img-2"],
        },
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /upload back\.png/i }));
    await user.click(
      screen.getByRole("button", { name: /save to google contacts/i }),
    );

    await waitFor(() =>
      expect(syncContactMock).toHaveBeenCalledWith({
        contact: expect.objectContaining({
          selectedPhotoImageId: "img-2",
        }),
        images: expect.any(Array),
      }),
    );

    syncContactMock.mockClear();

    await user.click(screen.getByRole("button", { name: /upload back\.png/i }));
    await user.click(
      screen.getByRole("button", { name: /save to google contacts/i }),
    );

    await waitFor(() =>
      expect(syncContactMock).toHaveBeenCalledWith({
        contact: expect.objectContaining({
          selectedPhotoImageId: undefined,
        }),
        images: expect.any(Array),
      }),
    );
  });

  it("clears the photoroll without resetting reviewed contact data", async () => {
    renderWorkspace({
      reviewDraft: {
        ...preloadedState.reviewDraft,
        images: [
          ...preloadedState.reviewDraft.images,
          {
            id: "img-2",
            dataUrl: "data:image/png;base64,YmFjaw==",
            fileName: "back.png",
            mimeType: "image/png",
            capturedAt: "2026-04-05T00:05:00.000Z",
            width: 1200,
            height: 800,
          },
        ],
        draft: {
          ...preloadedState.reviewDraft.draft,
          sourceImageIds: ["img-1", "img-2"],
        },
      },
    });

    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /upload back\.png/i }));
    await user.click(screen.getByRole("button", { name: /clear photoroll/i }));

    await waitFor(() => {
      expect(saveCapturedImagesMock).toHaveBeenCalledWith([]);
    });

    expect(screen.getByText(/no images captured yet\./i)).toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toHaveValue("Ada Lovelace");
    expect(screen.getByText("Low-confidence title")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /save to google contacts/i }),
    );

    await waitFor(() =>
      expect(syncContactMock).toHaveBeenCalledWith({
        contact: expect.objectContaining({
          selectedPhotoImageId: undefined,
        }),
        images: [],
      }),
    );
  });

  it("hides the clear photoroll action when there are no review images", () => {
    renderWorkspace({
      reviewDraft: {
        ...preloadedState.reviewDraft,
        images: [],
      },
    });

    expect(
      screen.queryByRole("button", { name: /clear photoroll/i }),
    ).not.toBeInTheDocument();
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

    await user.clear(screen.getByLabelText(/display name/i));
    await user.type(screen.getByLabelText(/display name/i), "Ada Byron");
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
    expect(pushToastMock).toHaveBeenCalledWith(
      "vCard downloaded to your device.",
    );
    expect(syncContactMock).not.toHaveBeenCalled();
  });

  it("disables both save actions when the review form is clean", async () => {
    renderWorkspace({
      reviewDraft: {
        ...preloadedState.reviewDraft,
        draft: {
          ...preloadedState.reviewDraft.draft,
          fullName: "",
          namePrefix: "",
          firstName: "",
          phoneticFirstName: "",
          phoneticMiddleName: "",
          phoneticLastName: "",
          lastName: "",
          nickname: "",
          fileAs: "",
          organization: "",
          department: "",
          title: "",
          email: "",
          phone: "",
          website: "",
          notes: "",
          address: "",
          emails: [],
          phones: [],
          websites: [],
          addresses: [],
          relatedPeople: [],
          significantDates: [],
          customFields: [],
          confidenceNotes: [],
        },
      },
    });

    const saveVCardButton = screen.getByRole("button", { name: /save vcard/i });
    const saveToGoogleButton = screen.getByRole("button", {
      name: /save to google contacts/i,
    });

    expect(saveVCardButton).toBeDisabled();
    expect(saveToGoogleButton).toBeDisabled();

    const user = userEvent.setup();
    await user.click(saveVCardButton);
    await user.click(saveToGoogleButton);

    expect(saveContactVCardMock).not.toHaveBeenCalled();
    expect(syncContactMock).not.toHaveBeenCalled();
  });

  it("re-enables both save actions after the user enters review data", async () => {
    renderWorkspace({
      reviewDraft: {
        ...preloadedState.reviewDraft,
        draft: {
          ...preloadedState.reviewDraft.draft,
          fullName: "",
          namePrefix: "",
          firstName: "",
          phoneticFirstName: "",
          phoneticMiddleName: "",
          phoneticLastName: "",
          lastName: "",
          nickname: "",
          fileAs: "",
          organization: "",
          department: "",
          title: "",
          email: "",
          phone: "",
          website: "",
          notes: "",
          address: "",
          emails: [],
          phones: [],
          websites: [],
          addresses: [],
          relatedPeople: [],
          significantDates: [],
          customFields: [],
          confidenceNotes: [],
        },
      },
    });

    const user = userEvent.setup();
    const saveVCardButton = screen.getByRole("button", { name: /save vcard/i });
    const saveToGoogleButton = screen.getByRole("button", {
      name: /save to google contacts/i,
    });

    expect(saveVCardButton).toBeDisabled();
    expect(saveToGoogleButton).toBeDisabled();

    await user.type(screen.getByLabelText(/display name/i), "Ada Byron");

    await waitFor(() => {
      expect(saveVCardButton).toBeEnabled();
      expect(saveToGoogleButton).toBeEnabled();
    });
  });

  it("clears the reviewed form and finalized contact state from the broom action", async () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("https://example.test/review?debug=1"),
    });

    const { store } = renderWorkspace();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /save vcard/i }));

    await waitFor(() =>
      expect(saveContactVCardMock).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "Ada Lovelace",
        }),
      ),
    );
    expect(store.getState().reviewDraft.verifiedContact).not.toBeNull();

    await user.click(
      screen.getByRole("button", { name: /clear reviewed contact data/i }),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /clear reviewed contact data/i }),
      ).not.toBeInTheDocument();
    });

    expect(screen.queryByText("Low-confidence title")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toHaveValue("");
    expect(store.getState().reviewDraft.draft?.fullName).toBe("");
    expect(store.getState().reviewDraft.draft?.confidenceNotes).toEqual([]);
    expect(store.getState().reviewDraft.verifiedContact).toBeNull();
    expect(
      screen.getByText(/derived google createcontact payload/i)
        .nextElementSibling,
    ).not.toHaveTextContent("Ada Lovelace");
    expect(
      screen.getByText(/derived vcard/i).nextElementSibling,
    ).not.toHaveTextContent("Ada Lovelace");
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

    expect(screen.getByRole("button", { name: /syncing/i })).toBeDisabled();
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
      screen.getByText(
        "Google authorization is required before syncing contacts.",
      ),
    ).toBeInTheDocument();
  });
});
