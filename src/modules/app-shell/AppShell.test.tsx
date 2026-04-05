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
  useRouterState: ({ select }: { select: (state: { location: { pathname: string } }) => string }) =>
    select({ location: { pathname: "/onboarding" } }),
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
    </Provider>
  );
}

describe("AppShell", () => {
  it("shows setup-first navigation and mock auth messaging before onboarding completes", () => {
    renderShell();

    expect(screen.getByText(/finish setup to unlock the working capture flow/i)).toBeInTheDocument();
    expect(screen.getAllByText(/setup first/i)).not.toHaveLength(0);
    expect(screen.getByText(/developer mock auth is active/i)).toBeInTheDocument();
    expect(screen.getByTestId("route-outlet")).toBeInTheDocument();
  });
});
