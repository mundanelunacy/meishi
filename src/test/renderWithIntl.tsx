import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { IntlProvider } from "react-intl";

export function renderWithIntl(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <IntlProvider locale="en-US" messages={{}}>
        {children}
      </IntlProvider>
    ),
    ...options,
  });
}
