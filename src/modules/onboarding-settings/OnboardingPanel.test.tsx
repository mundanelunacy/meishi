// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onboardingReducer } from "./onboardingSlice";
import { OnboardingPanel } from "./OnboardingPanel";

const navigateMock = vi.fn();
const connectGoogleContactsMock = vi.fn();

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
  getGoogleScope: () => "https://www.googleapis.com/auth/contacts",
}));

function renderPanel() {
  const store = configureStore({
    reducer: {
      onboarding: onboardingReducer,
    },
  });

  render(
    <Provider store={store}>
      <OnboardingPanel />
    </Provider>
  );

  return { store };
}

describe("OnboardingPanel", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    navigateMock.mockReset();
    connectGoogleContactsMock.mockReset();
  });

  it("connects Google auth and enables finishing onboarding", async () => {
    connectGoogleContactsMock.mockResolvedValue({
      status: "connected",
      firebaseUid: "firebase-uid-1",
      scope: "https://www.googleapis.com/auth/contacts",
      accountEmail: "developer@example.com",
      connectedAt: "2026-04-06T00:00:00.000Z",
    });

    renderPanel();

    const user = userEvent.setup();
    const continueButton = screen.getByRole("button", { name: /continue to capture/i });

    expect(continueButton).toBeDisabled();

    await user.type(screen.getByLabelText(/api key/i), "sk-test");
    await user.click(screen.getByRole("button", { name: /connect google account/i }));

    await waitFor(() => {
      expect(connectGoogleContactsMock).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(continueButton).toBeEnabled();
    });

    await user.click(continueButton);

    expect(navigateMock).toHaveBeenCalledWith({ to: "/capture" });
  });

  it("switches provider-specific fields when Anthropic is selected", async () => {
    renderPanel();

    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText(/llm provider/i), "anthropic");

    expect(screen.getByLabelText(/anthropic api key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/anthropic model/i)).toBeInTheDocument();
  });
});
