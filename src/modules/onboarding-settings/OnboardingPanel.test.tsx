// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "../../test/renderWithIntl";
import { onboardingReducer } from "./onboardingSlice";
import { OnboardingPanel } from "./OnboardingPanel";

const navigateMock = vi.fn();
const connectGoogleContactsMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("../../app/env", () => ({
  hasFirebaseConfiguration: () => true,
}));

vi.mock("../google-auth/googleIdentity", () => ({
  connectGoogleContacts: () => connectGoogleContactsMock(),
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

  renderWithIntl(
    <Provider store={store}>
      <OnboardingPanel />
    </Provider>,
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
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
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
    const continueButton = screen.getByRole("button", {
      name: /continue to capture/i,
    });

    expect(continueButton).toBeDisabled();

    await user.type(
      screen.getByLabelText(/api key/i),
      "sk-abcdefghijklmnopqrstuvwxyz",
    );
    fetchMock.mockResolvedValue({
      ok: true,
    });
    await user.click(screen.getByRole("button", { name: /validate api key/i }));
    await user.click(
      screen.getByRole("button", { name: /connect google account/i }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(connectGoogleContactsMock).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(continueButton).toBeEnabled();
    });

    await user.click(continueButton);

    expect(navigateMock).toHaveBeenCalledWith({ to: "/capture" });
  });

  it("enables finishing onboarding once an API key is validated", async () => {
    renderPanel();

    const user = userEvent.setup();
    const continueButton = screen.getByRole("button", {
      name: /continue to capture/i,
    });

    expect(continueButton).toBeDisabled();

    await user.type(
      screen.getByLabelText(/api key/i),
      "sk-abcdefghijklmnopqrstuvwxyz",
    );
    fetchMock.mockResolvedValue({
      ok: true,
    });
    await user.click(screen.getByRole("button", { name: /validate api key/i }));

    await waitFor(() => {
      expect(continueButton).toBeEnabled();
    });
  });

  it("shows a validation error and keeps onboarding blocked when the key is rejected", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({
        error: {
          message: "Incorrect API key provided.",
        },
      }),
    });

    renderPanel();

    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText(/api key/i),
      "sk-abcdefghijklmnopqrstuvwxyz",
    );
    await user.click(screen.getByRole("button", { name: /validate api key/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/incorrect api key provided/i),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /continue to capture/i }),
    ).toBeDisabled();
  });

  it("switches provider-specific fields when Anthropic is selected", async () => {
    renderPanel();

    const user = userEvent.setup();
    await user.selectOptions(
      screen.getByLabelText(/llm provider/i),
      "anthropic",
    );

    expect(screen.getByLabelText(/anthropic api key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/anthropic model/i)).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /claude sonnet 4\.6/i }),
    ).toBeInTheDocument();
  });

  it("switches provider-specific fields when Gemini is selected", async () => {
    renderPanel();

    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText(/llm provider/i), "gemini");

    expect(screen.getByLabelText(/gemini api key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gemini model/i)).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /^gemini 2\.5 flash$/i }),
    ).toBeInTheDocument();
  });

  it("explains the Google consent scope more precisely", () => {
    renderPanel();

    expect(
      screen.getByText(
        /meishi creates new google contacts and can upload one contact photo after save/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /consent screen may mention broader contact access than the app uses/i,
      ),
    ).toBeInTheDocument();
  });
});
