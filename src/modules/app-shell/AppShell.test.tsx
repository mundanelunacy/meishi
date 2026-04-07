// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { describe, expect, it, vi } from "vitest";
import {
  completeOnboarding,
  onboardingReducer,
} from "../onboarding-settings/onboardingSlice";
import { AppShell } from "./AppShell";
import { getPrimarySwipeDestination } from "./navigation";

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

  render(
    <Provider store={store}>
      <AppShell />
    </Provider>,
  );
}

describe("AppShell", () => {
  it("renders the minimal shell with primary navigation, header overflow menus, and route outlet", () => {
    mockPathname = "/landing";
    navigateMock.mockReset();
    renderShell();

    expect(screen.getByText("Meishi")).toBeInTheDocument();
    expect(screen.getAllByText("Capture").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Review").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText("Open navigation menu")).toHaveLength(2);
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

    await user.click(screen.getAllByLabelText("Open navigation menu")[0]);

    const menu = screen.getByRole("menu", { name: "More navigation" });
    expect(menu).toBeVisible();

    const items = screen.getAllByRole("menuitem");
    expect(items.map((item) => item.textContent?.trim())).toEqual([
      "Settings",
      "Google Contacts",
      "Docs",
      "Buy Me a Coffee",
      "GitHub",
    ]);
    expect(items[0]).toHaveAttribute("href", "/settings");
    expect(items[1]).toHaveAttribute("href", "https://contacts.google.com/");
    expect(items[2]).toHaveAttribute("href", "/docs");
    expect(items[3]).toHaveAttribute(
      "href",
      "https://buymeacoffee.com/mundanelunacy",
    );
    expect(items[4]).toHaveAttribute(
      "href",
      "https://github.com/mundanelunacy/meishi",
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
