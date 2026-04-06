// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  CapturedCardImage,
  ContactDraft,
  ExtractionRequest,
} from "../../shared/types/models";
import type { BusinessCardExtraction } from "../card-extraction/extractionSchema";
import { onboardingReducer } from "../onboarding-settings/onboardingSlice";
import { reviewDraftReducer } from "../contact-review/reviewDraftSlice";
import { CaptureWorkspace } from "./CaptureWorkspace";

const navigateMock = vi.fn();
const loadCapturedImagesMock = vi.fn(async () => [] as CapturedCardImage[]);
const saveCapturedImagesMock = vi.fn(async (images: CapturedCardImage[]) => {
  void images;
});
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
    loadCapturedImages: () => loadCapturedImagesMock(),
    saveCapturedImages: (
      images: Parameters<typeof actual.saveCapturedImages>[0],
    ) => saveCapturedImagesMock(images),
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

function createStore(images: CapturedCardImage[] = []) {
  return configureStore({
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
        images,
        draft: null,
        verifiedContact: null,
      },
    },
  });
}

function getOpenCameraButton() {
  return screen.getAllByRole("button", { name: /open camera/i })[0];
}

describe("CaptureWorkspace", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    navigateMock.mockReset();
    loadCapturedImagesMock.mockReset();
    loadCapturedImagesMock.mockImplementation(async () => []);
    saveCapturedImagesMock.mockClear();
    saveCapturedImagesMock.mockImplementation(
      async (images: CapturedCardImage[]) => {
        void images;
      },
    );
    saveDraftMock.mockClear();
    extractBusinessCardMock.mockReset();

    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 0,
    });
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        enumerateDevices: vi.fn(async () => []),
      },
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    });
  });

  it("persists the extracted draft and navigates to review", async () => {
    extractBusinessCardMock.mockResolvedValue({
      data: {
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

    const store = createStore([
      {
        id: "img-1",
        dataUrl: "data:image/png;base64,ZmFrZQ==",
        fileName: "card.png",
        mimeType: "image/png",
        capturedAt: "2026-04-05T00:00:00.000Z",
        width: 1200,
        height: 800,
      },
    ]);

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

  it("removes an image from the active capture session", async () => {
    const store = createStore([
      {
        id: "img-1",
        dataUrl: "data:image/png;base64,ZmFrZQ==",
        fileName: "front.png",
        mimeType: "image/png",
        capturedAt: "2026-04-05T00:00:00.000Z",
        width: 1200,
        height: 800,
      },
      {
        id: "img-2",
        dataUrl: "data:image/png;base64,ZmFrZTI=",
        fileName: "back.png",
        mimeType: "image/png",
        capturedAt: "2026-04-05T00:01:00.000Z",
        width: 1200,
        height: 800,
      },
    ]);

    render(
      <Provider store={store}>
        <CaptureWorkspace />
      </Provider>,
    );

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: /delete front\.png/i }));

    await waitFor(() => {
      expect(saveCapturedImagesMock).toHaveBeenCalledWith([
        expect.objectContaining({
          id: "img-2",
          fileName: "back.png",
        }),
      ]);
    });

    expect(screen.queryByText("front.png")).not.toBeInTheDocument();
    expect(screen.getByText("back.png")).toBeInTheDocument();
  });

  it("does not rehydrate a stale last image while the final delete is persisting", async () => {
    const frontImage: CapturedCardImage = {
      id: "img-1",
      dataUrl: "data:image/png;base64,ZmFrZQ==",
      fileName: "front.png",
      mimeType: "image/png",
      capturedAt: "2026-04-05T00:00:00.000Z",
      width: 1200,
      height: 800,
    };
    const backImage: CapturedCardImage = {
      id: "img-2",
      dataUrl: "data:image/png;base64,ZmFrZTI=",
      fileName: "back.png",
      mimeType: "image/png",
      capturedAt: "2026-04-05T00:01:00.000Z",
      width: 1200,
      height: 800,
    };
    const store = createStore([frontImage, backImage]);

    render(
      <Provider store={store}>
        <CaptureWorkspace />
      </Provider>,
    );

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: /delete front\.png/i }));

    await waitFor(() => {
      expect(saveCapturedImagesMock).toHaveBeenCalledWith([backImage]);
    });

    let resolveEmptySave = () => {};
    const emptySavePromise = new Promise<void>((resolve) => {
      resolveEmptySave = resolve;
    });
    let resolveStaleLoad: (value: CapturedCardImage[]) => void = () => {};
    const staleLoadPromise = new Promise<CapturedCardImage[]>((resolve) => {
      resolveStaleLoad = resolve;
    });

    saveCapturedImagesMock.mockImplementation(
      async (images: CapturedCardImage[]) => {
        if (!images.length) {
          await emptySavePromise;
        }
      },
    );
    loadCapturedImagesMock.mockImplementation(async () => staleLoadPromise);

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: /delete back\.png/i }));

    expect(
      await screen.findByText(
        /no images captured yet\. start with the camera or photo library above\./i,
      ),
    ).toBeInTheDocument();

    resolveStaleLoad([backImage]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.queryByText("back.png")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /no images captured yet\. start with the camera or photo library above\./i,
      ),
    ).toBeInTheDocument();

    resolveEmptySave();
  });

  it("opens the native camera input on touch devices even when getUserMedia is available", async () => {
    const stream = {
      getTracks: () => [],
    } as unknown as MediaStream;
    const getUserMedia = vi.fn(async () => stream);

    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 5,
    });
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        enumerateDevices: vi.fn(async () => []),
        getUserMedia,
      },
    });

    const store = createStore();

    const { container } = render(
      <Provider store={store}>
        <CaptureWorkspace />
      </Provider>,
    );

    container.querySelector('input[type="file"][capture="environment"]');
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click");

    await userEvent.setup().click(getOpenCameraButton());

    expect(clickSpy).toHaveBeenCalledOnce();
    expect(getUserMedia).not.toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("keeps multi-image selection enabled for the native camera input", () => {
    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 5,
    });

    const store = createStore();

    const { container } = render(
      <Provider store={store}>
        <CaptureWorkspace />
      </Provider>,
    );

    const nativeCameraInput = container.querySelector(
      'input[type="file"][capture="environment"]',
    ) as HTMLInputElement;

    expect(nativeCameraInput.multiple).toBe(true);
  });

  it("keeps the webcam flow for touch-capable desktop devices", async () => {
    const stream = {
      getTracks: () => [],
    } as unknown as MediaStream;
    const getUserMedia = vi.fn(async () => stream);

    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 10,
    });
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36",
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn((query: string) => ({
        matches:
          query === "(any-pointer: coarse)" || query === "(pointer: coarse)",
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        enumerateDevices: vi.fn(async () => [
          Object.assign(
            {},
            {
              deviceId: "camera-1",
              groupId: "group-1",
              kind: "videoinput",
              label: "Front Camera",
              toJSON: () => ({}),
            },
          ),
        ]),
        getUserMedia,
      },
    });

    const store = createStore();

    render(
      <Provider store={store}>
        <CaptureWorkspace />
      </Provider>,
    );

    await userEvent.setup().click(getOpenCameraButton());

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledOnce();
    });
  });

  it("opens a live camera preview on non-touch devices when webcam APIs are available", async () => {
    const stream = {
      getTracks: () => [],
    } as unknown as MediaStream;
    const getUserMedia = vi.fn(async () => stream);

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        enumerateDevices: vi.fn(async () => [
          Object.assign(
            {},
            {
              deviceId: "camera-1",
              groupId: "group-1",
              kind: "videoinput",
              label: "Front Camera",
              toJSON: () => ({}),
            },
          ),
        ]),
        getUserMedia,
      },
    });

    const store = createStore();

    render(
      <Provider store={store}>
        <CaptureWorkspace />
      </Provider>,
    );

    await userEvent.setup().click(getOpenCameraButton());

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledOnce();
    });

    expect(
      screen.getByRole("dialog", { name: /camera capture/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /capture photo/i }),
    ).toBeInTheDocument();
  });

  it("falls back to the native camera input when getUserMedia is unavailable", async () => {
    const store = createStore();

    const { container } = render(
      <Provider store={store}>
        <CaptureWorkspace />
      </Provider>,
    );

    container.querySelector('input[type="file"][capture="environment"]');
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click");

    await userEvent.setup().click(getOpenCameraButton());

    expect(clickSpy).toHaveBeenCalledOnce();
    clickSpy.mockRestore();
  });
});
