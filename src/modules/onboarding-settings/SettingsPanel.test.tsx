// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  onboardingReducer,
  setGoogleAuthState,
  setOpenAiApiKey,
} from "./onboardingSlice";
import { SettingsPanel } from "./SettingsPanel";

const navigateMock = vi.fn();
const requestGoogleAccessTokenMock = vi.fn();
const revokeGoogleAccessTokenMock = vi.fn(() => Promise.resolve());

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("../google-auth/googleIdentity", () => ({
  googleAuthClient: {
    isConfigured: () => true,
    getInitialState: () => ({
      mode: "mock",
      accessToken: null,
      scope: "https://www.googleapis.com/auth/contacts",
      expiresAt: null,
      accountHint: "developer@local.test",
    }),
  },
  requestGoogleAccessToken: (...args: unknown[]) => requestGoogleAccessTokenMock(...args),
  revokeGoogleAccessToken: (...args: unknown[]) => revokeGoogleAccessTokenMock(...args),
}));

function renderPanel() {
  const store = configureStore({
    reducer: {
      onboarding: onboardingReducer,
    },
    preloadedState: {
      onboarding: onboardingReducer(
        onboardingReducer(
          undefined,
          setOpenAiApiKey("sk-test")
        ),
        setGoogleAuthState({
          mode: "mock",
          accessToken: "mock-token",
          scope: "https://www.googleapis.com/auth/contacts",
          expiresAt: Date.now() + 60_000,
          accountHint: "developer@local.test",
        })
      ),
    },
  });

  render(
    <Provider store={store}>
      <SettingsPanel />
    </Provider>
  );

  return { store };
}

describe("SettingsPanel", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    navigateMock.mockReset();
    requestGoogleAccessTokenMock.mockReset();
    revokeGoogleAccessTokenMock.mockClear();
  });

  it("reconnects Google auth through the shared auth client", async () => {
    requestGoogleAccessTokenMock.mockResolvedValue({
      mode: "mock",
      accessToken: "next-token",
      scope: "https://www.googleapis.com/auth/contacts",
      expiresAt: Date.now() + 120_000,
      accountHint: "developer@local.test",
    });

    const { store } = renderPanel();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /reconnect google/i }));

    await waitFor(() => {
      expect(requestGoogleAccessTokenMock).toHaveBeenCalledWith({
        prompt: "",
        hint: "developer@local.test",
      });
    });

    expect(store.getState().onboarding.googleAuth.accessToken).toBe("next-token");
  });

  it("signs out and clears the transient Google token", async () => {
    const { store } = renderPanel();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /sign out google/i }));

    await waitFor(() => {
      expect(revokeGoogleAccessTokenMock).toHaveBeenCalledWith("mock-token");
    });

    expect(store.getState().onboarding.googleAuth.accessToken).toBeNull();
    expect(screen.getByText(/developer mock auth is active/i)).toBeInTheDocument();
  });

  it("persists advanced extraction settings in onboarding state", async () => {
    const { store } = renderPanel();
    const user = userEvent.setup();

    await user.clear(screen.getByLabelText(/advanced extraction prompt/i));
    await user.type(screen.getByLabelText(/advanced extraction prompt/i), "Use company name exactly as printed.");

    expect(store.getState().onboarding.settings.extractionPrompt).toBe(
      "Use company name exactly as printed."
    );
    expect(screen.queryByLabelText(/developer debug mode/i)).not.toBeInTheDocument();
  });
});
