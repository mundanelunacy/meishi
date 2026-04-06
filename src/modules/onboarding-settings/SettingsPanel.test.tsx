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
const connectGoogleContactsMock = vi.fn();
const disconnectGoogleContactsMock = vi.fn(() => Promise.resolve());

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("../../app/env", () => ({
  hasFirebaseConfiguration: () => true,
}));

vi.mock("../google-auth/googleIdentity", () => ({
  connectGoogleContacts: (...args: unknown[]) => connectGoogleContactsMock(...args),
  createInitialGoogleAuthState: () => ({
    status: "signed_out",
    firebaseUid: null,
    scope: null,
    accountEmail: undefined,
    connectedAt: null,
  }),
  disconnectGoogleContacts: (...args: unknown[]) => disconnectGoogleContactsMock(...args),
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
          status: "connected",
          firebaseUid: "firebase-uid-1",
          scope: "https://www.googleapis.com/auth/contacts",
          accountEmail: "developer@example.com",
          connectedAt: "2026-04-06T00:00:00.000Z",
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
    connectGoogleContactsMock.mockReset();
    disconnectGoogleContactsMock.mockClear();
  });

  it("reconnects Google auth through the shared auth client", async () => {
    connectGoogleContactsMock.mockResolvedValue({
      status: "connected",
      firebaseUid: "firebase-uid-1",
      scope: "https://www.googleapis.com/auth/contacts",
      accountEmail: "developer@example.com",
      connectedAt: "2026-04-06T00:00:00.000Z",
    });

    const { store } = renderPanel();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /reconnect google/i }));

    await waitFor(() => {
      expect(connectGoogleContactsMock).toHaveBeenCalledTimes(1);
    });

    expect(store.getState().onboarding.googleAuth.status).toBe("connected");
  });

  it("signs out and clears the Google connection metadata", async () => {
    const { store } = renderPanel();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /sign out google/i }));

    await waitFor(() => {
      expect(disconnectGoogleContactsMock).toHaveBeenCalledTimes(1);
    });

    expect(store.getState().onboarding.googleAuth.status).toBe("signed_out");
    expect(screen.getByText(/google contacts is not currently connected/i)).toBeInTheDocument();
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
