// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { IntlProvider } from "react-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import jaMessages from "../../app/locales/ja.json";
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

function renderDocsPage(locale: "en-US" | "ja") {
  return render(
    <IntlProvider
      locale={locale}
      defaultLocale="en-US"
      messages={locale === "ja" ? jaMessages : {}}
      wrapRichTextChunksInFragment
    >
      <DocsPage />
    </IntlProvider>,
  );
}

describe("DocsPage", () => {
  it("renders Japanese copy and localized schema when locale is ja", () => {
    renderDocsPage("ja");

    expect(
      screen.getByRole("heading", { name: "Meishi の使い方" }),
    ).toBeInTheDocument();
    expect(screen.getByText("目次")).toBeInTheDocument();
    expect(
      screen.getByRole("tablist", { name: "API プロバイダー" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", {
        name: /スクリーンショットを開く:/,
      }),
    ).toHaveLength(5);

    const schemaScript = document.querySelector(
      'script[type="application/ld+json"]',
    );

    expect(schemaScript).not.toBeNull();
    expect(schemaScript?.textContent).toContain("Meishi の使い方");
    expect(schemaScript?.textContent).toContain('"inLanguage":"ja"');
  });
});
