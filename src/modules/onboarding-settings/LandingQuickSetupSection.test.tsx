// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "../../test/renderWithIntl";
import { LandingQuickSetupSection } from "./LandingQuickSetupSection";
import { onboardingReducer } from "./onboardingSlice";

const navigateMock = vi.fn();
const fetchMock = vi.fn();
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

function renderSection() {
  const store = configureStore({
    reducer: {
      onboarding: onboardingReducer,
    },
  });

  renderWithIntl(
    <Provider store={store}>
      <LandingQuickSetupSection withTopBorder={false} />
    </Provider>,
  );

  return { store };
}

async function flushDebounce(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("LandingQuickSetupSection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    navigateMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    consoleErrorSpy.mockRestore();
    vi.useRealTimers();
  });

  it("shows API key resource buttons and the docs help link", () => {
    renderSection();

    expect(screen.getByRole("link", { name: "OpenAI" })).toHaveAttribute(
      "href",
      "https://platform.openai.com/api-keys",
    );
    expect(screen.getByRole("link", { name: "Anthropic" })).toHaveAttribute(
      "href",
      "https://console.anthropic.com/settings/keys",
    );
    expect(
      screen.getByRole("link", { name: "How do I obtain an API key?" }),
    ).toHaveAttribute("href", "/docs#api-keys");
  });

  it("does not validate an obviously invalid key", async () => {
    renderSection();
    fireEvent.change(screen.getByLabelText(/openai api key/i), {
      target: { value: "sk-short" },
    });

    await flushDebounce(700);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(/looks too short to validate yet/i),
    ).toBeInTheDocument();
  });

  it("debounces eligible validation requests down to one call", async () => {
    renderSection();
    fetchMock.mockResolvedValue({ ok: true });

    fireEvent.change(screen.getByLabelText(/openai api key/i), {
      target: { value: "sk-abcdefghijklmnopqrstuvwxyz" },
    });

    expect(
      screen.getByText(/checking this provider key shortly/i),
    ).toBeInTheDocument();

    await flushDebounce(300);

    expect(fetchMock).not.toHaveBeenCalled();

    await flushDebounce(400);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("resets the debounce when the model changes and validates the new tuple only", async () => {
    renderSection();
    fetchMock.mockResolvedValue({ ok: true });

    fireEvent.change(screen.getByLabelText(/openai api key/i), {
      target: { value: "sk-abcdefghijklmnopqrstuvwxyz" },
    });

    await flushDebounce(350);

    fireEvent.change(screen.getByLabelText(/openai model/i), {
      target: { value: "gpt-5.4-mini" },
    });

    expect(fetchMock).not.toHaveBeenCalled();

    await flushDebounce(300);

    expect(fetchMock).not.toHaveBeenCalled();

    await flushDebounce(400);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const request = fetchMock.mock.calls[0];
    const body = JSON.parse(request[1].body as string) as { model: string };
    expect(body.model).toBe("gpt-5.4-mini");
  });

  it("enables continue after successful automatic validation", async () => {
    renderSection();
    fetchMock.mockResolvedValue({ ok: true });

    const continueButton = screen.getByRole("button", {
      name: /continue to capture/i,
    });
    expect(continueButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/openai api key/i), {
      target: { value: "sk-abcdefghijklmnopqrstuvwxyz" },
    });

    await flushDebounce(700);

    expect(continueButton).toBeEnabled();

    expect(
      screen.getByText(/this provider key and model are valid/i),
    ).toBeInTheDocument();
  });

  it("renders provider errors from failed automatic validation", async () => {
    renderSection();
    fetchMock.mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({
        error: {
          message: "Incorrect API key provided.",
        },
      }),
    });

    fireEvent.change(screen.getByLabelText(/openai api key/i), {
      target: { value: "sk-abcdefghijklmnopqrstuvwxyz" },
    });

    await flushDebounce(700);

    expect(
      screen.getByText(/incorrect api key provided/i),
    ).toBeInTheDocument();
  });
});
