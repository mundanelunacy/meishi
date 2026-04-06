// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { describe, expect, it, vi } from "vitest";
import { onboardingReducer } from "../onboarding-settings/onboardingSlice";
import { AppShell } from "./AppShell";

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
  }) => select({ location: { pathname: "/landing" } }),
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

  render(
    <Provider store={store}>
      <AppShell />
    </Provider>,
  );
}

describe("AppShell", () => {
  it("renders the minimal shell with header, tab bar, and route outlet", () => {
    renderShell();

    expect(screen.getByText("Meishi")).toBeInTheDocument();
    expect(screen.getAllByText("Home").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Capture").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Review").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Settings").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId("route-outlet")).toBeInTheDocument();
  });
});
