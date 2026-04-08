// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "../../test/renderWithIntl";
import {
  completeOnboarding,
  onboardingReducer,
  setLocale,
} from "../onboarding-settings/onboardingSlice";
import { AppShell } from "./AppShell";
import { getPrimarySwipeDestination } from "./navigation";
import { getAppShareUrl } from "./siteShare";

const navigateMock = vi.fn();
let mockPathname = "/landing";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={props.to} {...props}>
      {children}
    </a>
  ),
  Outlet: () => <div data-testid="route-outlet" />,
  useRouterState: ({
    select,
  }: {
    select: (state: { location: { pathname: string } }) => string;
  }) => select({ location: { pathname: mockPathname } }),
  useNavigate: () => navigateMock,
}));

vi.mock("../pwa-runtime", () => ({
  usePwaLifecycle: () => ({
    applyUpdate: vi.fn(),
    canInstall: false,
    dismissOfflineReady: vi.fn(),
    isInstalled: false,
    needRefresh: false,
    offlineReady: false,
    promptInstall: vi.fn(),
  }),
}));

function renderShell() {
  const store = configureStore({
    reducer: {
      onboarding: onboardingReducer,
    },
  });
  store.dispatch(completeOnboarding());

  renderWithIntl(
    <Provider store={store}>
      <AppShell />
    </Provider>,
  );

  return { store };
}

async function openOverflowMenu(user: ReturnType<typeof userEvent.setup>) {
  const buttons = screen.getAllByLabelText("Open navigation menu");

  for (const button of buttons) {
    await user.click(button);

    const menu = screen.queryByRole("menu", { name: "More navigation" });
    if (menu) {
      return menu;
    }
  }

  throw new Error("Unable to open the overflow menu.");
}

function setNavigatorShare(share?: Navigator["share"]) {
  Object.defineProperty(window.navigator, "share", {
    configurable: true,
    value: share,
  });
}

function setNavigatorClipboard(writeText?: (value: string) => Promise<void>) {
  Object.defineProperty(window.navigator, "clipboard", {
    configurable: true,
    value: writeText ? { writeText } : undefined,
  });
}

function setWindowMatchMedia(matches = false) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  });
}

describe("AppShell", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    window.history.replaceState({}, "", "/landing");
    setNavigatorShare(undefined);
    setNavigatorClipboard(undefined);
    setWindowMatchMedia(false);
  });

  it("renders the minimal shell with primary navigation, header overflow menus, and route outlet", () => {
    mockPathname = "/landing";
    navigateMock.mockReset();
    renderShell();

    expect(screen.getByText("Meishi")).toBeInTheDocument();
    expect(screen.getAllByText("Capture").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Review").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText("Open navigation menu")).toHaveLength(2);
    expect(screen.getAllByLabelText(/select language/i)).toHaveLength(2);
    expect(screen.getByTestId("route-outlet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Meishi" })).toHaveAttribute(
      "href",
      "/landing",
    );
    expect(
      screen.getByRole("navigation", { name: "Primary navigation" }),
    ).toBeInTheDocument();
  });

  it("opens the overflow menu in the expected order", async () => {
    const user = userEvent.setup();
    mockPathname = "/landing";
    navigateMock.mockReset();

    renderShell();

    await openOverflowMenu(user);

    const menu = screen.getByRole("menu", { name: "More navigation" });
    expect(menu).toBeVisible();

    const items = screen.getAllByRole("menuitem");
    expect(items.map((item) => item.textContent?.trim())).toEqual([
      "Settings",
      "Google Contacts",
      "Docs",
      "Share",
      "Buy Me a Coffee",
      "GitHub",
    ]);
    expect(items[0]).toHaveAttribute("href", "/settings");
    expect(items[1]).toHaveAttribute("href", "https://contacts.google.com/");
    expect(items[2]).toHaveAttribute("href", "/docs");
    expect(items[3].tagName).toBe("BUTTON");
    expect(items[4]).toHaveAttribute(
      "href",
      "https://buymeacoffee.com/mundanelunacy",
    );
    expect(items[5]).toHaveAttribute(
      "href",
      "https://github.com/mundanelunacy/meishi",
    );
  });

  it("updates the stored locale from the header picker", async () => {
    const user = userEvent.setup();
    mockPathname = "/landing";
    navigateMock.mockReset();

    const { store } = renderShell();

    await user.selectOptions(
      screen.getAllByLabelText("Select language (desktop)")[0],
      "ja",
    );

    expect(store.getState().onboarding.settings.locale).toBe("ja");
  });

  it("renders the stored locale in both header pickers", () => {
    const store = configureStore({
      reducer: {
        onboarding: onboardingReducer,
      },
      preloadedState: {
        onboarding: onboardingReducer(undefined, setLocale("ja")),
      },
    });

    renderWithIntl(
      <Provider store={store}>
        <AppShell />
      </Provider>,
    );

    expect(
      screen.getAllByLabelText("Select language (desktop)")[0],
    ).toHaveValue("ja");
    expect(screen.getAllByLabelText("Select language (mobile)")[0]).toHaveValue(
      "ja",
    );
  });

  it("uses the native share sheet when navigator.share is available", async () => {
    const user = userEvent.setup();
    const shareMock = vi.fn().mockResolvedValue(undefined);

    mockPathname = "/review";
    setNavigatorShare(shareMock);
    navigateMock.mockReset();
    renderShell();

    await openOverflowMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Share" }));

    expect(shareMock).toHaveBeenCalledWith({
      text: "Scan business cards and keep contact details organized with Meishi.",
      title: "Meishi",
      url: getAppShareUrl(window.location.href),
    });
    expect(
      screen.queryByRole("dialog", { name: "Share Meishi" }),
    ).not.toBeInTheDocument();
  });

  it("opens the fallback dialog when native share is unavailable", async () => {
    const user = userEvent.setup();

    mockPathname = "/review";
    navigateMock.mockReset();
    renderShell();

    await openOverflowMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Share" }));

    expect(screen.getByRole("dialog", { name: "Share Meishi" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Facebook" })).toHaveAttribute(
      "href",
      expect.stringContaining("facebook.com/sharer/sharer.php"),
    );
    expect(screen.getByRole("link", { name: "X" })).toHaveAttribute(
      "href",
      expect.stringContaining("twitter.com/intent/tweet"),
    );
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      expect.stringContaining("linkedin.com/sharing/share-offsite"),
    );
  });

  it("copies the app link from the fallback dialog", async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);

    mockPathname = "/review";
    setNavigatorClipboard(writeTextMock);
    navigateMock.mockReset();
    renderShell();

    await openOverflowMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Share" }));
    await user.click(screen.getByRole("button", { name: "Copy link" }));

    expect(writeTextMock).toHaveBeenCalledWith(
      getAppShareUrl(window.location.href),
    );
  });

  it("derives swipe destinations between capture and review", () => {
    expect(
      getPrimarySwipeDestination({
        currentPath: "/capture",
        deltaX: -100,
        deltaY: 4,
      }),
    ).toBe("/review");
    expect(
      getPrimarySwipeDestination({
        currentPath: "/review",
        deltaX: 100,
        deltaY: 4,
      }),
    ).toBe("/capture");
    expect(
      getPrimarySwipeDestination({
        currentPath: "/capture",
        deltaX: -20,
        deltaY: 2,
      }),
    ).toBeNull();
  });
});
