import { useNavigate } from "@tanstack/react-router";
import { ExternalLink, ShieldAlert } from "lucide-react";
import { useIntl } from "react-intl";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { getApiKeyLinkContent } from "../app-shell/docsContent";
import { cn } from "../../shared/lib/utils";
import { Button } from "../../shared/ui/button";
import { Input } from "../../shared/ui/input";
import { Label } from "../../shared/ui/label";
import { Select } from "../../shared/ui/select";
import { pushToast } from "../../shared/ui/toastBus";
import { getSupportedModelOptions } from "./modelOptions";
import {
  getCommonToastMessages,
  getLandingContent,
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

type LandingQuickSetupSectionProps = {
  sectionId?: string;
  className?: string;
  withTopBorder?: boolean;
};

export function LandingQuickSetupSection({
  sectionId = "setup",
  className,
  withTopBorder = true,
}: LandingQuickSetupSectionProps) {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const settings = useAppSelector(selectSettings);
  const readiness = useAppSelector(selectAppReadiness);

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
  const commonToasts = getCommonToastMessages(intl);
  const apiKeyLinks = getApiKeyLinkContent(intl);

  const canContinue = readiness.hasLlmConfiguration;

  function handleFinish() {
    dispatch(completeOnboarding());
    pushToast(commonToasts.landingSetupComplete);
    navigate({ to: "/capture" });
  }

  return (
    <section
      id={sectionId}
      className={cn(
        "scroll-mt-20 bg-muted/30",
        withTopBorder && "border-t border-border",
        className,
      )}
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
          <div className="flex items-start gap-3 rounded-xl bg-muted/60 p-4">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                {content.setup.securityTitle}
              </p>
              <p>{content.setup.securityBody}</p>
            </div>
          </div>

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

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex">
              <div>
                <a
                  href={apiKeyLinks.sectionHref}
                  className="text-sm font-medium text-foreground underline-offset-4 hover:underline inline-flex"
                >
                  {apiKeyLinks.sectionLabel}
                </a>
              </div>
              <div className="flex-grow text-right">
                <div className="mr-1 inline-block">
                  <a
                    href={apiKeyLinks.providers.openai.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {providerOptionLabels.openai}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <div className="mr-1 inline-block">
                  <a
                    href={apiKeyLinks.providers.anthropic.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {providerOptionLabels.anthropic}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
