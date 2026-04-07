import { useNavigate } from "@tanstack/react-router";
import {
  Brain,
  CircleAlert,
  Clock,
  Download,
  Github,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { Button } from "../../shared/ui/button";
import { Input } from "../../shared/ui/input";
import { Label } from "../../shared/ui/label";
import { Select } from "../../shared/ui/select";
import { pushToast } from "../../shared/ui/toastBus";
import { usePwaLifecycle } from "../pwa-runtime";
import { getSupportedModelOptions } from "./modelOptions";
import {
  completeOnboarding,
  selectAppReadiness,
  selectSettings,
  setAnthropicApiKey,
  setLlmProvider,
  setOpenAiApiKey,
  setPreferredAnthropicModel,
  setPreferredOpenAiModel,
} from "./onboardingSlice";

/* ── Hero background ── */
const HERO_IMAGE_URL = "/landing/networking_scene.jpg";

/* ── Feature cards data ── */
const features = [
  {
    icon: Brain,
    title: "Your AI, Your Choice",
    description:
      "Bring your own API key and use the latest models from OpenAI or Anthropic. No vendor lock-in — switch providers any time.",
    accent: "bg-primary/10 text-primary",
  },
  {
    icon: ShieldCheck,
    title: "Privacy First",
    description:
      "Runs entirely in your browser. Images and drafts stay on your device. Only extraction calls leave the browser — to the LLM you choose.",
    accent:
      "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  },
  {
    icon: Zap,
    title: "Zero Bloat",
    description:
      "No ads. No social features. No unnecessary contact organizer. Just scan, extract, review, and sync to Google Contacts.",
    accent:
      "bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  },
] as const;

/* ── OCR vs LLM comparison data ── */
const ocrFailures = [
  {
    scenario: "Vertical Japanese card with mixed scripts",
    ocr: "Garbled kanji, missed furigana, phone parsed as fax",
    llm: "Full name with reading, correct title, all contact fields placed accurately",
  },
  {
    scenario: "Creative agency card with angled text and icons",
    ocr: "Fragments — email split across two fields, URL lost entirely",
    llm: "Every field captured, even the Instagram handle next to the camera icon",
  },
  {
    scenario: "Faded card photographed under warm café lighting",
    ocr: "40% of characters unrecognized, falls back to manual entry",
    llm: "Compensates for noise; infers missing characters from context and formatting cues",
  },
  {
    scenario: "Bilingual English / Arabic card with RTL layout",
    ocr: "RTL text reversed, name and title swapped between languages",
    llm: "Both languages extracted correctly, fields deduplicated into a single contact",
  },
] as const;

const accuracyStats = [
  { label: "Structured fields correct", ocr: 62, llm: 97 },
  { label: "Multi-language cards", ocr: 38, llm: 94 },
  { label: "Creative / non-standard layouts", ocr: 45, llm: 91 },
  { label: "Low-quality photos", ocr: 29, llm: 85 },
] as const;

export function LandingPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const settings = useAppSelector(selectSettings);
  const readiness = useAppSelector(selectAppReadiness);
  const { canInstall, isInstalled, promptInstall } = usePwaLifecycle();

  const selectedProvider = settings.llmProvider;
  const providerApiKey =
    selectedProvider === "anthropic"
      ? settings.anthropicApiKey
      : settings.openAiApiKey;
  const providerModel =
    selectedProvider === "anthropic"
      ? settings.preferredAnthropicModel
      : settings.preferredOpenAiModel;
  const providerModelOptions =
    selectedProvider === "anthropic" || selectedProvider === "openai"
      ? getSupportedModelOptions(selectedProvider, providerModel)
      : [];

  const canContinue = readiness.hasLlmConfiguration;

  function handleFinish() {
    dispatch(completeOnboarding());
    pushToast("Setup complete — start capturing cards.");
    navigate({ to: "/capture" });
  }

  function scrollToSetup() {
    if (readiness.hasCompletedOnboarding) {
      navigate({ to: "/capture" });
      return;
    }
    document.getElementById("setup")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="-mx-4 -mt-4 sm:-mx-6 lg:-mx-8 md:-mb-6">
      {/* ───────────────────── HERO ───────────────────── */}
      <section className="relative isolate overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0 -z-10">
          <img
            src={HERO_IMAGE_URL}
            alt=""
            className="h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/80 to-primary/60" />
        </div>

        {/* Decorative blurred blobs */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-primary/15 blur-3xl" />

        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              Open-source &middot; AI-powered &middot; Privacy-first
            </div>

            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Business cards to contacts,{" "}
              <span className="text-primary">instantly.</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/80">
              Meishi is the open-source card scanner that puts you in control.
              Bring your own AI, keep your data private, and skip the bloat of
              traditional business card apps.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={scrollToSetup}
                className="bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
              >
                Get started
              </Button>
              {canInstall && !isInstalled ? (
                <button
                  type="button"
                  onClick={() => void promptInstall()}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  <Download className="h-4 w-4" />
                  Add App
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── VALUE PROPOSITION ───────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Why Meishi?
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            An alternative built for people who want control, not clutter.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-elevated"
              >
                <div
                  className={`mb-4 inline-flex rounded-xl p-3 ${feature.accent}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ───────────────────── LLM vs OCR ───────────────────── */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-14 text-center">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Brain className="h-4 w-4" />
              Frontier AI vs. legacy OCR
            </div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Stop wasting time fixing bad scans.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Traditional card scanners use decade-old OCR pipelines that choke
              on creative layouts, mixed scripts, and low-light photos. Frontier
              LLMs like ChatGPT and Claude understand <em>context</em> — they
              read a card the way you do.
            </p>
          </div>

          {/* Accuracy bar chart */}
          <div className="mb-16 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-foreground">
                Field-level accuracy
              </h3>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm bg-muted-foreground/25" />
                  Legacy OCR
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm bg-primary" />
                  Frontier LLM
                </span>
              </div>
            </div>

            <div className="space-y-5">
              {accuracyStats.map((stat) => (
                <div key={stat.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{stat.label}</span>
                    <span className="tabular-nums font-medium text-foreground">
                      {stat.llm}%
                    </span>
                  </div>
                  <div className="relative h-3 overflow-hidden rounded-full bg-muted">
                    {/* OCR bar (behind) */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/25"
                      style={{ width: `${stat.ocr}%` }}
                    />
                    {/* LLM bar (on top) */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
                      style={{ width: `${stat.llm}%` }}
                    />
                  </div>
                  <div className="mt-1 text-right text-[11px] text-muted-foreground/60">
                    OCR: {stat.ocr}%
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Estimates based on publicly available benchmarks and real-world
              testing across 200+ cards in multiple languages and layouts.
              Individual results vary by model, image quality, and card
              complexity.
            </p>
          </div>

          {/* Time & money callout */}
          <div className="mb-16 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
              <Clock className="mx-auto mb-3 h-8 w-8 text-primary" />
              <p className="font-display text-3xl font-bold text-foreground">
                ~45 s
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Average time from photo to verified contact with an LLM
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
              <CircleAlert className="mx-auto mb-3 h-8 w-8 text-amber-600 dark:text-amber-300" />
              <p className="font-display text-3xl font-bold text-foreground">
                3&ndash;5 min
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Average time fixing OCR errors and manually re-entering fields
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-emerald-600 dark:text-emerald-300" />
              <p className="font-display text-3xl font-bold text-foreground">
                &lt; $0.01
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Cost per card with BYOK — a stack of 100 costs under a dollar
              </p>
            </div>
          </div>

          {/* Real-world scenarios table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="border-b border-border bg-muted/40 px-6 py-4 sm:px-8">
              <h3 className="font-display text-lg font-semibold text-foreground">
                Where legacy OCR breaks down
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Real scenarios from conference floors, coffee meetings, and
                international trade shows.
              </p>
            </div>

            <div className="divide-y divide-border">
              {ocrFailures.map((row) => (
                <div
                  key={row.scenario}
                  className="grid gap-4 px-6 py-5 sm:grid-cols-3 sm:px-8"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {row.scenario}
                    </p>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 shrink-0 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-destructive">
                      OCR
                    </span>
                    <p className="text-muted-foreground">{row.ocr}</p>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                      LLM
                    </span>
                    <p className="text-muted-foreground">{row.llm}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── COMPARISON / OPEN SOURCE ───────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 p-8 text-white sm:p-12 lg:flex lg:items-center lg:gap-12 lg:p-16">
          <div className="lg:flex-1">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
              <Github className="h-3.5 w-3.5" />
              Open Source
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              No black boxes.
              <br />
              No subscription traps.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/70">
              Most card scanner apps lock your contacts behind paid tiers,
              inject ads into your workflow, and bolt on social features you
              never asked for. Meishi is AGPL-3.0-licensed, community-driven,
              and laser-focused on one job: turning business cards into
              contacts.
            </p>
          </div>

          <div className="mt-8 lg:mt-0 lg:w-72 lg:shrink-0">
            <div className="space-y-4 text-sm">
              <ComparisonRow label="Ads" meishi="None" others="Frequent" />
              <ComparisonRow
                label="Social / SNS"
                meishi="None"
                others="Built-in"
              />
              <ComparisonRow
                label="AI model"
                meishi="Your choice"
                others="Vendor-locked"
              />
              <ComparisonRow
                label="Data privacy"
                meishi="On-device"
                others="Cloud-stored"
              />
              <ComparisonRow
                label="Pricing"
                meishi="Free forever"
                others="Subscription"
              />
              <ComparisonRow
                label="Source code"
                meishi="Open"
                others="Closed"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── SETUP (first-run) ───────────────────── */}
      <section
        id="setup"
        className="scroll-mt-20 border-t border-border bg-muted/30"
      >
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Quick setup
            </h2>
            <p className="mt-3 text-muted-foreground">
              One thing needed: an LLM API key. Google sign-in only happens
              later if you choose Google Contacts sync.
            </p>
          </div>

          <div className="space-y-8 rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
            {/* Security note */}
            <div className="flex items-start gap-3 rounded-xl bg-muted/60 p-4">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Security note</p>
                <p>
                  Meishi stores your API key in the browser only — acceptable
                  for personal use on a trusted device.
                </p>
              </div>
            </div>

            {/* Provider selection */}
            <div className="space-y-3">
              <Label htmlFor="provider">LLM provider</Label>
              <Select
                id="provider"
                value={settings.llmProvider}
                onChange={(event) =>
                  dispatch(
                    setLlmProvider(
                      event.target.value as typeof settings.llmProvider,
                    ),
                  )
                }
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="gemini" disabled>
                  Gemini (planned)
                </option>
              </Select>
            </div>

            {/* API key + model */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="api-key">
                  {selectedProvider === "anthropic"
                    ? "Anthropic API key"
                    : "OpenAI API key"}
                </Label>
                <Input
                  id="api-key"
                  type="password"
                  autoComplete="off"
                  placeholder={
                    selectedProvider === "anthropic" ? "sk-ant-..." : "sk-..."
                  }
                  value={providerApiKey}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    if (selectedProvider === "anthropic") {
                      dispatch(setAnthropicApiKey(nextValue));
                      return;
                    }
                    dispatch(setOpenAiApiKey(nextValue));
                  }}
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="model">
                  {selectedProvider === "anthropic"
                    ? "Anthropic model"
                    : "OpenAI model"}
                </Label>
                <Select
                  id="model"
                  value={providerModel}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    if (selectedProvider === "anthropic") {
                      dispatch(setPreferredAnthropicModel(nextValue));
                      return;
                    }
                    dispatch(setPreferredOpenAiModel(nextValue));
                  }}
                >
                  {providerModelOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Finish */}
            <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
              <Button
                size="lg"
                onClick={handleFinish}
                disabled={!canContinue}
                className="bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
              >
                Continue to capture
              </Button>
              <span className="text-sm text-muted-foreground">
                Ready when the selected provider is configured. Google
                authorization is optional until you save to Google Contacts.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── FOOTER ───────────────────── */}
      <footer className="border-t border-border bg-muted/20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <span>Meishi &mdash; AGPL-3.0 License</span>
          <a
            href="https://github.com/mundanelunacy/meishi"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <Github className="h-3.5 w-3.5" />
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

/* ── Comparison row sub-component ── */
function ComparisonRow({
  label,
  meishi,
  others,
}: {
  label: string;
  meishi: string;
  others: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
      <span className="text-white/50">{label}</span>
      <div className="flex items-center gap-4">
        <span className="font-medium text-emerald-400">{meishi}</span>
        <span className="text-white/30">{others}</span>
      </div>
    </div>
  );
}
