import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Search } from "lucide-react";
import { useIntl } from "react-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../shared/ui/card";
import { ImageLightbox } from "../../shared/ui/image-lightbox";
import { JsonLdScript } from "../../shared/seo/JsonLdScript";
import type { AppLocale } from "../../shared/types/models";
import { getDocsPageSchema } from "../../shared/seo/jsonLd";
import { getDocsPageContent } from "./docsContent";

const internalDocLinkClassName =
  "font-medium text-foreground underline-offset-4 hover:underline";

function TutorialImage({
  alt,
  openLabel,
  onClick,
  src,
}: {
  alt: string;
  openLabel: string;
  onClick: () => void;
  src: string;
}) {
  return (
    <button
      type="button"
      className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-muted/20 text-left shadow-sm transition-transform hover:scale-[1.01]"
      onClick={onClick}
      aria-label={openLabel}
    >
      <img
        src={src}
        alt={alt}
        className="h-auto w-full object-cover object-top"
      />
      <span className="pointer-events-none absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground shadow-sm backdrop-blur-sm transition-colors group-hover:bg-background/95">
        <Search className="h-4 w-4" />
      </span>
    </button>
  );
}

function SectionHeading({
  id,
  eyebrow,
  title,
  description,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div id={id} className="scroll-mt-24 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {eyebrow}
      </p>
      <div className="space-y-3">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
    </div>
  );
}

function TutorialStepBody({ body }: { body: ReactNode }) {
  return <p className="text-sm leading-6 text-muted-foreground">{body}</p>;
}

export function DocsPage() {
  const intl = useIntl();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeApiProvider, setActiveApiProvider] = useState<
    "openai" | "anthropic"
  >("openai");
  const content = getDocsPageContent(intl, intl.locale as AppLocale, {
    settingsLink: (chunks: ReactNode) => (
      <Link to="/settings" className={internalDocLinkClassName}>
        {chunks}
      </Link>
    ),
    captureLink: (chunks: ReactNode) => (
      <Link to="/capture" className={internalDocLinkClassName}>
        {chunks}
      </Link>
    ),
    reviewLink: (chunks: ReactNode) => (
      <Link to="/review" className={internalDocLinkClassName}>
        {chunks}
      </Link>
    ),
  });
  const tutorialSteps = content.tutorial.steps;
  const activeImage =
    lightboxIndex === null ? null : (tutorialSteps[lightboxIndex] ?? null);
  const hasMultipleImages = tutorialSteps.length > 1;

  function openLightbox(index: number) {
    setLightboxIndex(index);
  }

  function closeLightbox() {
    setLightboxIndex(null);
  }

  function showPreviousImage() {
    if (lightboxIndex === null) {
      return;
    }

    setLightboxIndex(
      (lightboxIndex - 1 + tutorialSteps.length) % tutorialSteps.length,
    );
  }

  function showNextImage() {
    if (lightboxIndex === null) {
      return;
    }

    setLightboxIndex((lightboxIndex + 1) % tutorialSteps.length);
  }

  return (
    <>
      <JsonLdScript graph={getDocsPageSchema(content.schema)} />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 pb-8">
        <section className="rounded-[2rem] border border-border bg-gradient-to-br from-card via-card to-muted/50 px-6 py-8 shadow-card sm:px-8 sm:py-10">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              {content.hero.eyebrow}
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {content.hero.title}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              {content.hero.description}
            </p>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>{content.tableOfContents.title}</CardTitle>
            <CardDescription>
              {content.tableOfContents.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-3 text-sm sm:grid-cols-2">
              {content.sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex items-start gap-3 rounded-2xl border border-border bg-background px-4 py-3 transition-colors hover:bg-muted"
                  >
                    <span className="font-medium text-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-muted-foreground">
                      {section.label}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <section className="space-y-5">
          <SectionHeading
            id={content.overview.heading.id}
            eyebrow={content.overview.heading.eyebrow}
            title={content.overview.heading.title}
            description={content.overview.heading.description}
          />
          <Card>
            <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="font-display text-lg font-semibold">
                  {content.overview.whatAppDoes.title}
                </h3>
                <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                  {content.overview.whatAppDoes.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-display text-lg font-semibold">
                  {content.overview.goodToKnow.title}
                </h3>
                <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                  {content.overview.goodToKnow.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-5">
          <SectionHeading
            id={content.apiKeys.heading.id}
            eyebrow={content.apiKeys.heading.eyebrow}
            title={content.apiKeys.heading.title}
            description={content.apiKeys.heading.description}
          />
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div
                className="inline-flex w-full max-w-md rounded-2xl border border-border bg-muted/40 p-1"
                role="tablist"
                aria-label={content.apiKeys.providerAriaLabel}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeApiProvider === "openai"}
                  aria-controls="api-provider-openai"
                  id="api-provider-tab-openai"
                  className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    activeApiProvider === "openai"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setActiveApiProvider("openai")}
                >
                  {content.apiKeys.providers.openai.label}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeApiProvider === "anthropic"}
                  aria-controls="api-provider-anthropic"
                  id="api-provider-tab-anthropic"
                  className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    activeApiProvider === "anthropic"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setActiveApiProvider("anthropic")}
                >
                  {content.apiKeys.providers.anthropic.label}
                </button>
              </div>

              {activeApiProvider === "openai" ? (
                <div
                  role="tabpanel"
                  id="api-provider-openai"
                  aria-labelledby="api-provider-tab-openai"
                >
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {content.apiKeys.providers.openai.label}
                      </h3>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {content.apiKeys.providers.openai.description}
                      </p>
                    </div>
                    <ol className="space-y-2 text-sm leading-6 text-muted-foreground">
                      {content.apiKeys.providers.openai.steps.map(
                        (step, index) => (
                          <li key={index}>{step}</li>
                        ),
                      )}
                    </ol>
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {content.apiKeys.providers.openai.linkLabel}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ) : (
                <div
                  role="tabpanel"
                  id="api-provider-anthropic"
                  aria-labelledby="api-provider-tab-anthropic"
                >
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {content.apiKeys.providers.anthropic.label}
                      </h3>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {content.apiKeys.providers.anthropic.description}
                      </p>
                    </div>
                    <ol className="space-y-2 text-sm leading-6 text-muted-foreground">
                      {content.apiKeys.providers.anthropic.steps.map(
                        (step, index) => (
                          <li key={index}>{step}</li>
                        ),
                      )}
                    </ol>
                    <a
                      href="https://console.anthropic.com/settings/keys"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {content.apiKeys.providers.anthropic.linkLabel}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-5">
          <SectionHeading
            id={content.tutorial.heading.id}
            eyebrow={content.tutorial.heading.eyebrow}
            title={content.tutorial.heading.title}
            description={content.tutorial.heading.description}
          />
          <div className="space-y-4">
            {tutorialSteps.map((step, index) => (
              <Card key={step.id}>
                <CardHeader>
                  <CardTitle>
                    {content.tutorial.getStepCardTitle(index + 1, step.title)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-[minmax(0,1fr)_320px] md:items-start">
                  <div className="space-y-4">
                    <TutorialStepBody body={step.body} />
                  </div>
                  <div className="w-full md:justify-self-end">
                    <div className="max-w-sm">
                      <TutorialImage
                        alt={step.imageAlt}
                        src={step.imageSrc}
                        openLabel={content.lightbox.getOpenScreenshotLabel(
                          step.imageAlt,
                        )}
                        onClick={() => openLightbox(index)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <SectionHeading
            id={content.afterScanning.heading.id}
            eyebrow={content.afterScanning.heading.eyebrow}
            title={content.afterScanning.heading.title}
            description={content.afterScanning.heading.description}
          />
          <Card>
            <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
              {content.afterScanning.cards.map((card) => (
                <div key={card.id} className="space-y-2">
                  <h3 className="font-display text-lg font-semibold">
                    {card.title}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {card.body}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-5">
          <SectionHeading
            id={content.support.heading.id}
            eyebrow={content.support.heading.eyebrow}
            title={content.support.heading.title}
            description={content.support.heading.description}
          />
          <Card>
            <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
              {content.support.cards.map((card) => (
                <div key={card.id} className="space-y-2">
                  <h3 className="font-display text-lg font-semibold">
                    {card.title}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {card.body}
                  </p>
                  {card.id === "share" ? (
                    <a
                      href="https://github.com/mundanelunacy/meishi"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {card.linkLabel}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                  {card.id === "coffee" ? (
                    <a
                      href="https://www.buymeacoffee.com/mundanelunacy"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-fit overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-transform hover:scale-[1.01]"
                    >
                      <img
                        src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                        alt={card.imageAlt}
                        className="h-12 w-auto sm:h-14"
                      />
                    </a>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>

      {activeImage ? (
        <ImageLightbox
          alt={activeImage.imageAlt}
          src={activeImage.imageSrc}
          title={activeImage.title}
          subtitle={content.lightbox.getSubtitle(
            lightboxIndex! + 1,
            tutorialSteps.length,
          )}
          index={lightboxIndex ?? undefined}
          total={tutorialSteps.length}
          onClose={closeLightbox}
          onPrevious={hasMultipleImages ? showPreviousImage : undefined}
          onNext={hasMultipleImages ? showNextImage : undefined}
          caption={
            <>
              <p className="text-base font-semibold text-white">
                {activeImage.title}
              </p>
              <div className="mt-2 max-w-3xl text-sm leading-6 text-white/85 [&_a]:!text-white/85 [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-white/40 [&_a:hover]:!text-white">
                {activeImage.body}
              </div>
            </>
          }
        />
      ) : null}
    </>
  );
}
