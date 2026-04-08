import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { defineMessages, useIntl } from "react-intl";

const messages = defineMessages({
  eyebrow: {
    id: "legal.layout.eyebrow",
    defaultMessage: "Legal",
  },
  effectiveDate: {
    id: "legal.layout.effectiveDate",
    defaultMessage: "Effective {date}",
  },
  footerText: {
    id: "legal.layout.footerText",
    defaultMessage:
      "Questions about these terms can be directed through the project repository.",
  },
  backToLanding: {
    id: "legal.layout.backToLanding",
    defaultMessage: "Back to landing",
  },
});

export function LegalPageLayout({
  title,
  summary,
  effectiveDate,
  children,
}: {
  title: string;
  summary: string;
  effectiveDate: string;
  children: ReactNode;
}) {
  const intl = useIntl();

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-6 md:py-10">
      <header className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-10 text-white shadow-card sm:px-8">
        <div className="mb-4 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-white/75">
          {intl.formatMessage(messages.eyebrow)}
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
          {summary}
        </p>
        <p className="mt-5 text-xs uppercase tracking-[0.18em] text-white/55">
          {intl.formatMessage(messages.effectiveDate, { date: effectiveDate })}
        </p>
      </header>

      <div className="space-y-6 rounded-3xl border border-border bg-card px-6 py-8 shadow-card sm:px-8">
        {children}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
        <span>{intl.formatMessage(messages.footerText)}</span>
        <Link
          to="/landing"
          className="font-medium text-foreground transition-colors hover:text-primary"
        >
          {intl.formatMessage(messages.backToLanding)}
        </Link>
      </div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-6 text-muted-foreground sm:text-[15px]">
        {children}
      </div>
    </section>
  );
}
