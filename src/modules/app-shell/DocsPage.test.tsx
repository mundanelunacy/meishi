// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { IntlProvider } from "react-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import koMessages from "../../app/locales/ko.json";
import { DocsPage } from "./DocsPage";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={props.to} {...props}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
});

function renderDocsPage(locale: "en-US" | "ko") {
  return render(
    <IntlProvider
      locale={locale}
      defaultLocale="en-US"
      messages={locale === "ko" ? koMessages : {}}
      wrapRichTextChunksInFragment
    >
      <DocsPage />
    </IntlProvider>,
  );
}

describe("DocsPage", () => {
  it("renders Korean copy and localized schema when locale is ko", () => {
    renderDocsPage("ko");

    expect(
      screen.getByRole("heading", { level: 1, name: "Meishi 사용 방법" }),
    ).toBeInTheDocument();
    expect(screen.getByText("목차")).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "API 제공자" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /google gemini/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", {
        name: /스크린샷 열기:/,
      }),
    ).toHaveLength(5);

    const schemaScript = document.querySelector(
      'script[type="application/ld+json"]',
    );

    expect(schemaScript).not.toBeNull();
    expect(schemaScript?.textContent).toContain("Meishi 사용 방법");
    expect(schemaScript?.textContent).toContain('"inLanguage":"ko"');
  });
});
