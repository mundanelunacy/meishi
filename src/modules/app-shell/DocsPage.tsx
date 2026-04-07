import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../shared/ui/card";
import { ImageLightbox } from "../../shared/ui/image-lightbox";

const sections = [
  { id: "what-is-meishi", label: "What is Meishi?" },
  { id: "api-keys", label: "How do I obtain an API key?" },
  { id: "how-to-use", label: "How do I use Meishi?" },
  {
    id: "view-contacts",
    label: "How do I view contacts once they are scanned?",
  },
  { id: "support", label: "How do I support Meishi?" },
] as const;

const internalDocLinkClassName =
  "font-medium text-foreground underline-offset-4 hover:underline";

const tutorialSteps = [
  {
    title: "Open Meishi and complete first-run setup",
    body: (
      <>
        Open{" "}
        <Link to="/settings" className={internalDocLinkClassName}>
          Settings
        </Link>
        , choose OpenAI or Anthropic, paste your own API key, confirm the
        selected model, and save your setup. Google Contacts access is optional
        at this stage and can wait until you want to sync.
      </>
    ),
    imageSrc: "/docs/screenshots/setup-settings-llm-provider.png",
    imageAlt:
      "Cropped Meishi settings screen focused on the LLM Provider section with the provider picker, API key field, and model selection.",
  },
  {
    title: "Capture one or more business-card images",
    body: (
      <>
        Open the{" "}
        <Link to="/capture" className={internalDocLinkClassName}>
          Capture page
        </Link>
        , use the camera or image library, and make sure both sides of the card
        are included if the back contains useful details. Meishi keeps the card
        images on your device while you work.
      </>
    ),
    imageSrc: "/docs/screenshots/capture-photoroll.png",
    imageAlt:
      "Meishi capture screen cropped to the Photoroll section with uploaded business-card images.",
  },
  {
    title: "Run extraction",
    body: "Start the scan after your images are loaded. Meishi sends the images to your chosen AI service, checks the response, and fills in the review form with the contact details it found.",
    imageSrc: "/docs/screenshots/capture-extract-button.png",
    imageAlt:
      "Close-up of the Extract contact draft button on the Meishi capture screen.",
  },
  {
    title: "Review and correct the extracted contact",
    body: (
      <>
        Open{" "}
        <Link
          to="/review"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Review
        </Link>{" "}
        to verify the extracted fields in the Verify contact section. The form
        supports richer Google-Contacts-style data, including multiple emails,
        phone numbers, addresses, websites, related people, significant dates,
        notes, and custom fields. Edits autosave locally.
      </>
    ),
    imageSrc: "/docs/screenshots/review-verify-contact.png",
    imageAlt:
      "Cropped Meishi review screen focused on the Verify contact section with extraction notes and editable contact fields.",
  },
  {
    title: "Export or sync",
    body: "From Review, either save a local `.vcf` file or sync the verified contact to Google Contacts. If you are not connected to Google yet, Meishi can prompt for Google authorization at sync time.",
    imageSrc: "/docs/screenshots/review-save-buttons.png",
    imageAlt:
      "Close-up of the Save vCard and Save to Google Contacts buttons on the Meishi review screen.",
  },
] as const;

function TutorialImage({
  alt,
  onClick,
  src,
}: {
  alt: string;
  onClick: () => void;
  src: string;
}) {
  return (
    <button
      type="button"
      className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-muted/20 text-left shadow-sm transition-transform hover:scale-[1.01]"
      onClick={onClick}
      aria-label={`Open screenshot: ${alt}`}
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeApiProvider, setActiveApiProvider] = useState<
    "openai" | "anthropic"
  >("openai");
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
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 pb-8">
        <section className="rounded-[2rem] border border-border bg-gradient-to-br from-card via-card to-muted/50 px-6 py-8 shadow-card sm:px-8 sm:py-10">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Documentation
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              How to use Meishi
            </h1>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              Meishi is a browser-based app for scanning business cards, turning
              them into organized contact details with AI, reviewing the results
              on your device, exporting a vCard, and optionally sending the
              finished contact to Google Contacts.
            </p>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Table of contents</CardTitle>
            <CardDescription>
              Jump directly to the section you need.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-3 text-sm sm:grid-cols-2">
              {sections.map((section, index) => (
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
            id="what-is-meishi"
            eyebrow="Overview"
            title="What is Meishi?"
            description="Meishi helps you turn a photo of a business card into a digital contact you can actually use. Your images and in-progress edits stay in your browser, the app uses your own OpenAI or Anthropic key to read the card, and you can export the final result as a vCard or send it to Google Contacts after checking it."
          />
          <Card>
            <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="font-display text-lg font-semibold">
                  What the app does
                </h3>
                <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                  <li>
                    Captures card images from your camera or image library.
                  </li>
                  <li>
                    Pulls contact details from the card with OpenAI or
                    Anthropic.
                  </li>
                  <li>
                    Lets you verify and edit the extracted data before saving.
                  </li>
                  <li>
                    Exports a `.vcf` file or syncs the verified contact to
                    Google Contacts.
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-display text-lg font-semibold">
                  Good to know
                </h3>
                <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                  <li>
                    Meishi runs in your browser and keeps your AI key on this
                    device.
                  </li>
                  <li>
                    Google sign-in access is refreshed when needed instead of
                    being permanently saved in the browser.
                  </li>
                  <li>
                    Extra business-card images remain local even if one photo is
                    uploaded to Google Contacts.
                  </li>
                  <li>
                    Extraction and Google sync both require a network
                    connection.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-5">
          <SectionHeading
            id="api-keys"
            eyebrow="Setup"
            title="How do I obtain an API key?"
            description="Meishi asks you to use your own API key. During setup, or later on the settings page, choose either OpenAI or Anthropic and paste your key into the app."
          />
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div
                className="inline-flex w-full max-w-md rounded-2xl border border-border bg-muted/40 p-1"
                role="tablist"
                aria-label="API provider"
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
                  OpenAI
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
                  Anthropic
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
                        OpenAI
                      </h3>
                      <p className="text-sm leading-6 text-muted-foreground">
                        Choose this if you want Meishi to read cards using
                        OpenAI.
                      </p>
                    </div>
                    <ol className="space-y-2 text-sm leading-6 text-muted-foreground">
                      <li>Go to the OpenAI platform API keys page.</li>
                      <li>Sign in or create an OpenAI account.</li>
                      <li>
                        Create a new secret key in your API key dashboard.
                      </li>
                      <li>
                        Copy the key immediately and paste it into Meishi on the{" "}
                        <Link
                          to="/settings"
                          className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          Settings
                        </Link>{" "}
                        page.
                      </li>
                      <li>
                        Meishi keeps this key in your browser on this device so
                        it can use it again later.
                      </li>
                    </ol>
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      OpenAI API keys
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
                        Anthropic
                      </h3>
                      <p className="text-sm leading-6 text-muted-foreground">
                        Choose this if you want Meishi to read cards using
                        Claude.
                      </p>
                    </div>
                    <ol className="space-y-2 text-sm leading-6 text-muted-foreground">
                      <li>Go to the Anthropic Console.</li>
                      <li>Sign in or create an Anthropic account.</li>
                      <li>Create a new API key from the console.</li>
                      <li>
                        Copy the key and paste it into Meishi during setup or
                        later on the{" "}
                        <Link
                          to="/settings"
                          className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          Settings
                        </Link>{" "}
                        page.
                      </li>
                      <li>
                        Confirm that your Anthropic account has billing or usage
                        access if your plan requires it.
                      </li>
                    </ol>
                    <a
                      href="https://console.anthropic.com/settings/keys"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      Anthropic API keys
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
            id="how-to-use"
            eyebrow="Tutorial"
            title="How do I use Meishi?"
            description="Follow this step-by-step flow from first setup through export or Google sync."
          />
          <div className="space-y-4">
            {tutorialSteps.map((step, index) => (
              <Card key={step.title}>
                <CardHeader>
                  <CardTitle>
                    Step {index + 1}: {step.title}
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
            id="view-contacts"
            eyebrow="After scanning"
            title="How do I view contacts once they are scanned?"
            description="Meishi lets you check and edit the contact before you save it anywhere else."
          />
          <Card>
            <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
              <div className="space-y-2">
                <h3 className="font-display text-lg font-semibold">
                  Inside Meishi
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Open{" "}
                  <Link
                    to="/review"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Review
                  </Link>{" "}
                  to inspect the current draft, see the captured images, and
                  edit the structured contact fields before saving anything
                  externally.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-lg font-semibold">
                  As a vCard
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Use the Save vCard action to download a `.vcf` file to your
                  device. You can then open that file in your preferred contacts
                  app.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-lg font-semibold">
                  In Google Contacts
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Use Sync to Google from{" "}
                  <Link
                    to="/review"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Review
                  </Link>
                  . After a successful sync, open Google Contacts to see the
                  created contact and the uploaded primary photo.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-5">
          <SectionHeading
            id="support"
            eyebrow="GIVE BACK"
            title="How do I support Meishi?"
            description="If you want to help Meishi grow, the easiest options are sharing feedback, sharing the project, and supporting the work directly."
          />
          <Card>
            <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
              <div className="space-y-2">
                <h3 className="font-display text-lg font-semibold">
                  Use it and report gaps
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Real card samples and bug reports help improve scan quality,
                  editing flow, and sync reliability.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-lg font-semibold">
                  Star or share the project
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Follow the repository and share it with people who need an
                  easier way to turn business cards into digital contacts.
                </p>
                <a
                  href="https://github.com/mundanelunacy/meishi"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  GitHub repository
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-lg font-semibold">
                  Buy Me a Coffee
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  If you want to support ongoing work directly, use the Buy Me a
                  Coffee link from the menu or here.
                </p>
                <a
                  href="https://www.buymeacoffee.com/mundanelunacy"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-fit overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-transform hover:scale-[1.01]"
                >
                  <img
                    src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                    alt="Buy Me a Coffee"
                    className="h-12 w-auto sm:h-14"
                  />
                </a>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {activeImage ? (
        <ImageLightbox
          alt={activeImage.imageAlt}
          src={activeImage.imageSrc}
          title={activeImage.title}
          subtitle={`Step ${lightboxIndex! + 1} of ${tutorialSteps.length}`}
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
