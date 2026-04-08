import { Link, useNavigate } from "@tanstack/react-router";
import { useIntl } from "react-intl";
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
import { JsonLdScript } from "../../shared/seo/JsonLdScript";
import { getLandingPageSchema } from "../../shared/seo/jsonLd";
import { Button } from "../../shared/ui/button";
import { Input } from "../../shared/ui/input";
import { Label } from "../../shared/ui/label";
import { Select } from "../../shared/ui/select";
import { pushToast } from "../../shared/ui/toastBus";
import { usePwaLifecycle } from "../pwa-runtime";
import { getSupportedModelOptions } from "./modelOptions";
import {
  getCommonToastMessages,
  getLandingContent,
  getLandingSchemaContent,
  getProviderFieldLabels,
  getProviderOptionLabels,
} from "./onboardingContent";
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

const featureIcons = [Brain, ShieldCheck, Zap] as const;
const featureAccents = [
  "bg-primary/10 text-primary",
  "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  "bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
] as const;

export function LandingPage() {
  const intl = useIntl();
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
  const providerLabels = getProviderFieldLabels(
    intl,
    selectedProvider === "anthropic" ? "anthropic" : "openai",
  );
  const providerOptionLabels = getProviderOptionLabels(intl);
  const content = getLandingContent(intl);
  const schemaContent = getLandingSchemaContent(intl, settings.locale);
  const commonToasts = getCommonToastMessages(intl);

  const canContinue = readiness.hasLlmConfiguration;

  function handleFinish() {
    dispatch(completeOnboarding());
    pushToast(commonToasts.landingSetupComplete);
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
    <>
      <JsonLdScript graph={getLandingPageSchema(schemaContent)} />
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
                {content.hero.eyebrow}
              </div>

              <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {content.hero.title}
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/80">
                {content.hero.description}
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Button
                  size="lg"
                  onClick={scrollToSetup}
                  className="bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
                >
                  {content.hero.getStarted}
                </Button>
                {canInstall && !isInstalled ? (
                  <button
                    type="button"
                    onClick={() => void promptInstall()}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                  >
                    <Download className="h-4 w-4" />
                    {content.hero.addApp}
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
              {content.why.title}
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              {content.why.description}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {content.why.features.map((feature, index) => {
              const Icon = featureIcons[index];
              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-elevated"
                >
                  <div
                    className={`mb-4 inline-flex rounded-xl p-3 ${featureAccents[index]}`}
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
                {content.ai.eyebrow}
              </div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {content.ai.title}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {content.ai.description}
              </p>
            </div>

            {/* Accuracy bar chart */}
            <div className="mb-16 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {content.ai.accuracyTitle}
                </h3>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm bg-muted-foreground/25" />
                    {content.ai.accuracyOcr}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm bg-primary" />
                    {content.ai.accuracyLlm}
                  </span>
                </div>
              </div>

              <div className="space-y-5">
                {content.ai.stats.map((stat) => (
                  <div key={stat.label}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {stat.label}
                      </span>
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
                {content.ai.accuracyNote}
              </p>
            </div>

            {/* Time & money callout */}
            <div className="mb-16 grid gap-6 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
                <Clock className="mx-auto mb-3 h-8 w-8 text-primary" />
                <p className="font-display text-3xl font-bold text-foreground">
                  {content.ai.callouts[0]?.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {content.ai.callouts[0]?.label}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
                <CircleAlert className="mx-auto mb-3 h-8 w-8 text-amber-600 dark:text-amber-300" />
                <p className="font-display text-3xl font-bold text-foreground">
                  {content.ai.callouts[1]?.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {content.ai.callouts[1]?.label}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
                <Sparkles className="mx-auto mb-3 h-8 w-8 text-emerald-600 dark:text-emerald-300" />
                <p className="font-display text-3xl font-bold text-foreground">
                  {content.ai.callouts[2]?.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {content.ai.callouts[2]?.label}
                </p>
              </div>
            </div>

            {/* Real-world scenarios table */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div className="border-b border-border bg-muted/40 px-6 py-4 sm:px-8">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {content.ai.breakdownTitle}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {content.ai.breakdownDescription}
                </p>
              </div>

              <div className="divide-y divide-border">
                {content.ai.failures.map((row) => (
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
                        {content.ai.badges.ocr}
                      </span>
                      <p className="text-muted-foreground">{row.ocr}</p>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                        {content.ai.badges.llm}
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
                {content.openSource.eyebrow}
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {content.openSource.title}
              </h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-white/70">
                {content.openSource.description}
              </p>
            </div>

            <div className="mt-8 lg:mt-0 lg:w-72 lg:shrink-0">
              <div className="space-y-4 text-sm">
                {content.openSource.rows.map((row) => (
                  <ComparisonRow
                    key={row.label}
                    label={row.label}
                    meishi={row.meishi}
                    others={row.others}
                  />
                ))}
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
                {content.setup.title}
              </h2>
              <p className="mt-3 text-muted-foreground">
                {content.setup.description}
              </p>
            </div>

            <div className="space-y-8 rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
              {/* Security note */}
              <div className="flex items-start gap-3 rounded-xl bg-muted/60 p-4">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    {content.setup.securityTitle}
                  </p>
                  <p>{content.setup.securityBody}</p>
                </div>
              </div>

              {/* Provider selection */}
              <div className="space-y-3">
                <Label htmlFor="provider">{providerLabels.provider}</Label>
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
                  <option value="openai">{providerOptionLabels.openai}</option>
                  <option value="anthropic">
                    {providerOptionLabels.anthropic}
                  </option>
                  <option value="gemini" disabled>
                    {providerOptionLabels.gemini}
                  </option>
                </Select>
              </div>

              {/* API key + model */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="api-key">{providerLabels.apiKey}</Label>
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
                  <Label htmlFor="model">{providerLabels.model}</Label>
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
                  {content.setup.continueLabel}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {content.setup.continueHelp}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────────── FOOTER ───────────────────── */}
        <footer className="border-t border-border bg-muted/20">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <span>{content.footer.license}</span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link
                to="/privacy"
                className="transition-colors hover:text-foreground"
              >
                {content.footer.privacy}
              </Link>
              <Link
                to="/terms"
                className="transition-colors hover:text-foreground"
              >
                {content.footer.terms}
              </Link>
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
          </div>
        </footer>
      </div>
    </>
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
