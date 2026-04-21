// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "../../test/renderWithIntl";
import { onboardingReducer, setAnalyticsConsent } from "../onboarding-settings/onboardingSlice";
import { GdprBootstrap, useAnalytics } from "./index";

const { posthogMock } = vi.hoisted(() => ({
  posthogMock: {
    __loaded: false,
    capture: vi.fn(),
    captureException: vi.fn(),
    init: vi.fn(),
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
    startExceptionAutocapture: vi.fn(),
    stopExceptionAutocapture: vi.fn(),
  },
}));

vi.mock("posthog-js", () => ({
  default: posthogMock,
}));

function setPrivacyRegion(region: "gdpr" | "non-gdpr") {
  window.__MEISHI_PRIVACY_BOOTSTRAP__ = { region };
}

function AnalyticsProbe() {
  const analytics = useAnalytics();

  return (
    <button
      type="button"
      onClick={() => {
        analytics.capture("probe_event", { source: "test" });
        analytics.captureException(new Error("probe-error"));
      }}
    >
      {analytics.isEnabled ? "enabled" : "disabled"}
    </button>
  );
}

function renderGate(preloadedState?: ReturnType<typeof onboardingReducer>) {
  const store = configureStore({
    reducer: {
      onboarding: onboardingReducer,
    },
    preloadedState: preloadedState
      ? { onboarding: preloadedState }
      : undefined,
  });

  renderWithIntl(
    <Provider store={store}>
      <GdprBootstrap>
        <div>app-ready</div>
        <AnalyticsProbe />
      </GdprBootstrap>
    </Provider>,
  );

  return { store };
}

describe("GdprBootstrap", () => {
  beforeEach(() => {
    posthogMock.__loaded = false;
    posthogMock.init.mockImplementation(() => {
      posthogMock.__loaded = true;
    });
    posthogMock.capture.mockReset();
    posthogMock.captureException.mockReset();
    posthogMock.init.mockClear();
    posthogMock.opt_in_capturing.mockClear();
    posthogMock.opt_out_capturing.mockClear();
    posthogMock.startExceptionAutocapture.mockClear();
    posthogMock.stopExceptionAutocapture.mockClear();
    delete window.__MEISHI_PRIVACY_BOOTSTRAP__;
  });

  afterEach(() => {
    cleanup();
  });

  it("shows the consent screen for GDPR visitors without a stored choice", () => {
    setPrivacyRegion("gdpr");

    renderGate();

    expect(screen.getByText("app-ready")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /allow optional analytics/i }),
    ).toBeInTheDocument();
  });

  it("does not show the consent screen when GDPR consent is already granted", async () => {
    setPrivacyRegion("gdpr");

    renderGate(onboardingReducer(undefined, setAnalyticsConsent("granted")));

    expect(screen.getByText("app-ready")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "enabled" })).toBeInTheDocument();

    await waitFor(() => {
      expect(posthogMock.init).toHaveBeenCalledTimes(1);
    });
  });

  it("does not show the consent screen when GDPR consent is denied", () => {
    setPrivacyRegion("gdpr");

    renderGate(onboardingReducer(undefined, setAnalyticsConsent("denied")));

    expect(screen.getByText("app-ready")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "disabled" })).toBeInTheDocument();
  });

  it("auto-grants analytics for non-GDPR visitors", async () => {
    setPrivacyRegion("non-gdpr");

    const { store } = renderGate();

    expect(screen.getByText("app-ready")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "enabled" })).toBeInTheDocument();

    await waitFor(() => {
      expect(store.getState().onboarding.settings.analyticsConsent).toBe(
        "granted",
      );
    });
  });

  it("captures through PostHog when analytics are enabled", async () => {
    setPrivacyRegion("gdpr");

    renderGate(onboardingReducer(undefined, setAnalyticsConsent("granted")));

    await waitFor(() => {
      expect(posthogMock.init).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole("button", { name: "enabled" }));

    expect(posthogMock.capture).toHaveBeenCalledWith("probe_event", {
      source: "test",
    });
    expect(posthogMock.captureException).toHaveBeenCalledTimes(1);
  });

  it("uses a no-op analytics client when consent is denied", () => {
    setPrivacyRegion("gdpr");

    renderGate(onboardingReducer(undefined, setAnalyticsConsent("denied")));

    fireEvent.click(screen.getByRole("button", { name: "disabled" }));

    expect(posthogMock.capture).not.toHaveBeenCalled();
    expect(posthogMock.captureException).not.toHaveBeenCalled();
  });
});
