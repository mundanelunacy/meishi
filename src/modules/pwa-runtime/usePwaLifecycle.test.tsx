// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "../../test/renderWithIntl";
import { usePwaLifecycle } from "./usePwaLifecycle";

let setNeedRefreshState: ((value: boolean) => void) | null = null;
let setOfflineReadyState: ((value: boolean) => void) | null = null;
let updateServiceWorkerMock = vi
  .fn<() => Promise<void>>()
  .mockResolvedValue(undefined);

vi.mock("virtual:pwa-register/react", async () => {
  const React = await import("react");

  return {
    useRegisterSW: () => {
      const [needRefresh, setNeedRefresh] = React.useState(false);
      const [offlineReady, setOfflineReady] = React.useState(false);

      React.useEffect(() => {
        setNeedRefreshState = setNeedRefresh;
        setOfflineReadyState = setOfflineReady;
      }, [setNeedRefresh, setOfflineReady]);

      return {
        needRefresh: [needRefresh, setNeedRefresh] as const,
        offlineReady: [offlineReady, setOfflineReady] as const,
        updateServiceWorker: updateServiceWorkerMock,
      };
    },
  };
});

function mockMatchMedia(initialMatches = false) {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches,
    media: "(display-mode: standalone)",
    onchange: null,
    addEventListener: (
      _type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => {
      listeners.add(listener);
    },
    removeEventListener: (
      _type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => {
      listeners.delete(listener);
    },
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  return {
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      const event = { matches: nextMatches } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}

function HookHarness() {
  const lifecycle = usePwaLifecycle();

  return (
    <div>
      <div data-testid="need-refresh">{String(lifecycle.needRefresh)}</div>
      <div data-testid="offline-ready">{String(lifecycle.offlineReady)}</div>
      <div data-testid="can-install">{String(lifecycle.canInstall)}</div>
      <div data-testid="is-installed">{String(lifecycle.isInstalled)}</div>
      <button onClick={() => void lifecycle.applyUpdate()}>apply-update</button>
      <button onClick={() => void lifecycle.promptInstall()}>
        prompt-install
      </button>
      <button onClick={lifecycle.dismissOfflineReady}>
        dismiss-offline-ready
      </button>
    </div>
  );
}

describe("usePwaLifecycle", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    updateServiceWorkerMock = vi
      .fn<() => Promise<void>>()
      .mockResolvedValue(undefined);
    setNeedRefreshState = null;
    setOfflineReadyState = null;
    mockMatchMedia(false);
  });

  it("maps refresh and offline-ready state from useRegisterSW", async () => {
    renderWithIntl(<HookHarness />);

    expect(screen.getByTestId("need-refresh")).toHaveTextContent("false");
    expect(screen.getByTestId("offline-ready")).toHaveTextContent("false");

    await act(async () => {
      setNeedRefreshState?.(true);
      setOfflineReadyState?.(true);
    });

    expect(screen.getByTestId("need-refresh")).toHaveTextContent("true");
    expect(screen.getByTestId("offline-ready")).toHaveTextContent("true");

    fireEvent.click(screen.getByText("dismiss-offline-ready"));
    expect(screen.getByTestId("offline-ready")).toHaveTextContent("false");
  });

  it("captures beforeinstallprompt and forwards install prompting", async () => {
    renderWithIntl(<HookHarness />);

    const prompt = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const installEvent = new Event("beforeinstallprompt", {
      cancelable: true,
    }) as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "accepted"; platform: string }>;
    };
    installEvent.prompt = prompt;
    installEvent.userChoice = Promise.resolve({
      outcome: "accepted",
      platform: "web",
    });

    fireEvent(window, installEvent);
    expect(screen.getByTestId("can-install")).toHaveTextContent("true");

    await act(async () => {
      fireEvent.click(screen.getByText("prompt-install"));
    });

    expect(prompt).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("is-installed")).toHaveTextContent("true");
  });

  it("marks the app installed after the browser install event and applies updates", async () => {
    const mediaQuery = mockMatchMedia(true);
    renderWithIntl(<HookHarness />);

    expect(screen.getByTestId("is-installed")).toHaveTextContent("true");

    mediaQuery.setMatches(false);
    fireEvent(window, new Event("appinstalled"));

    expect(screen.getByTestId("is-installed")).toHaveTextContent("true");

    await act(async () => {
      fireEvent.click(screen.getByText("apply-update"));
    });

    expect(updateServiceWorkerMock).toHaveBeenCalledWith(true);
  });
});
