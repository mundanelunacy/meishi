// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "../../test/renderWithIntl";
import {
  onboardingReducer,
  setGoogleAuthState,
  setOpenAiApiKey,
  setThemeMode,
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
  connectGoogleContacts: (...args: unknown[]) =>
    connectGoogleContactsMock(...args),
  createInitialGoogleAuthState: () => ({
    status: "signed_out",
    firebaseUid: null,
    scope: null,
    accountEmail: undefined,
    connectedAt: null,
  }),
  disconnectGoogleContacts: (...args: unknown[]) =>
    disconnectGoogleContactsMock(...args),
}));

vi.mock("../google-auth/useGoogleAuthStateSync", () => ({
  useGoogleAuthStateSync: () => {},
}));

function renderPanel(
  googleAuthOverride?: Partial<
    ReturnType<typeof onboardingReducer>["googleAuth"]
  >,
) {
  const store = configureStore({
    reducer: {
      onboarding: onboardingReducer,
    },
    preloadedState: {
      onboarding: onboardingReducer(
        onboardingReducer(undefined, setOpenAiApiKey("sk-test")),
        setGoogleAuthState({
          status: "connected",
          firebaseUid: "firebase-uid-1",
          scope: "https://www.googleapis.com/auth/contacts",
          accountEmail: "developer@example.com",
          connectedAt: "2026-04-06T00:00:00.000Z",
          ...googleAuthOverride,
        }),
      ),
    },
  });

  renderWithIntl(
    <Provider store={store}>
      <SettingsPanel />
    </Provider>,
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

  it("connects Google when the status toggle is switched to connected", async () => {
    connectGoogleContactsMock.mockResolvedValue({
      status: "connected",
      firebaseUid: "firebase-uid-1",
      scope: "https://www.googleapis.com/auth/contacts",
      accountEmail: "developer@example.com",
      connectedAt: "2026-04-06T00:00:00.000Z",
    });

    const { store } = renderPanel({
      status: "signed_out",
      scope: null,
      accountEmail: undefined,
      connectedAt: null,
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("radio", { name: /^connected$/i }));

    await waitFor(() => {
      expect(connectGoogleContactsMock).toHaveBeenCalledTimes(1);
    });

    expect(store.getState().onboarding.googleAuth.status).toBe("connected");
  });

  it("signs out and clears the Google connection metadata", async () => {
    const { store } = renderPanel();
    const user = userEvent.setup();

    expect(
      screen.getByText(/signed in as developer@example.com/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /^disconnected$/i }));

    await waitFor(() => {
      expect(disconnectGoogleContactsMock).toHaveBeenCalledTimes(1);
    });

    expect(store.getState().onboarding.googleAuth.status).toBe("signed_out");
    expect(
      screen.queryByText(/signed in as developer@example.com/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/no google account connected/i),
    ).not.toBeInTheDocument();
  });

  it("shows the signed-in email when Google is connected", () => {
    renderPanel();

    expect(
      screen.getByText(/signed in as developer@example.com/i),
    ).toBeInTheDocument();
  });

  it("persists advanced extraction settings in onboarding state", async () => {
    const { store } = renderPanel();
    const user = userEvent.setup();

    await user.clear(screen.getByLabelText(/advanced extraction prompt/i));
    await user.type(
      screen.getByLabelText(/advanced extraction prompt/i),
      "Use company name exactly as printed.",
    );

    expect(store.getState().onboarding.settings.extractionPrompt).toBe(
      "Use company name exactly as printed.",
    );
    expect(
      screen.queryByLabelText(/developer debug mode/i),
    ).not.toBeInTheDocument();
  });

  it("updates the color theme preference", async () => {
    const { store } = renderPanel();
    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText(/color theme/i), "dark");

    expect(store.getState().onboarding.settings.themeMode).toBe("dark");
  });

  it("updates the app locale preference", async () => {
    const { store } = renderPanel();
    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText(/app language/i), "ja");

    expect(store.getState().onboarding.settings.locale).toBe("ja");
  });

  it("uses the landing-style provider form", async () => {
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

  it("renders the stored color theme preference", () => {
    const store = configureStore({
      reducer: {
        onboarding: onboardingReducer,
      },
      preloadedState: {
        onboarding: onboardingReducer(undefined, setThemeMode("dark")),
      },
    });

    renderWithIntl(
      <Provider store={store}>
        <SettingsPanel />
      </Provider>,
    );

    expect(screen.getByLabelText(/color theme/i)).toHaveValue("dark");
    expect(screen.getByLabelText(/app language/i)).toHaveValue("en-US");
  });
});
