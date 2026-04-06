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
import { AppShell, getPrimarySwipeDestination } from "./AppShell";

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
  it("renders the minimal shell with primary navigation, overflow menu, and route outlet", () => {
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

  it("opens the overflow menu with GitHub, Support, and Settings links", async () => {
    const user = userEvent.setup();
    mockPathname = "/landing";
    navigateMock.mockReset();

    renderShell();

    await user.click(screen.getAllByLabelText("Open navigation menu")[0]);

    expect(screen.getByRole("menu", { name: "More navigation" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/mundanelunacy/meishi",
    );
    expect(screen.getByRole("menuitem", { name: "Support" })).toHaveAttribute(
      "href",
      "https://buymeacoffee.com/mundanelunacy",
    );
    expect(screen.getByRole("menuitem", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings",
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
