// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "../../test/renderWithIntl";
import { LandingQuickSetupSection } from "./LandingQuickSetupSection";
import { onboardingReducer } from "./onboardingSlice";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
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
}

describe("LandingQuickSetupSection", () => {
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
});
