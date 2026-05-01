import { ExternalLink, ShieldAlert } from "lucide-react";
import { useIntl } from "react-intl";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { getApiKeyLinkContent } from "../app-shell/docsContent";
import { Button } from "../../shared/ui/button";
import { Input } from "../../shared/ui/input";
import { Label } from "../../shared/ui/label";
import { Select } from "../../shared/ui/select";
import { getSupportedModelOptions } from "./modelOptions";
import {
  getProviderFieldLabels,
  getProviderOptionLabels,
  getQuickSetupValidationContent,
} from "./onboardingContent";
import {
  selectSettings,
  setAnthropicApiKey,
  setGeminiApiKey,
  setLlmProvider,
  setOpenAiApiKey,
  setPreferredAnthropicModel,
  setPreferredGeminiModel,
  setPreferredOpenAiModel,
} from "./onboardingSlice";
import type { LlmValidationPrecheckReason } from "./llmKeyValidation";
import { useLlmValidation } from "./useLlmValidation";
import type { AppSettings, SupportedLlmProvider } from "../../shared/types/models";

interface LlmConfigurationFormProps {
  apiKeyInputId: string;
  providerInputId: string;
  modelInputId: string;
  securityNote?: {
    title: string;
    body: string;
  };
  showApiKeyLinks?: boolean;
  continueAction?: {
    disabled: boolean;
    help: string;
    label: string;
    onContinue: () => void;
  };
}

export function LlmConfigurationForm({
  apiKeyInputId,
  providerInputId,
  modelInputId,
  securityNote,
  showApiKeyLinks = false,
  continueAction,
}: LlmConfigurationFormProps) {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectSettings);
  const { isDebouncing, precheck, validation } = useLlmValidation({
    autoValidate: true,
  });

  const selectedProvider = settings.llmProvider;
  const providerApiKey = getProviderApiKey(settings, selectedProvider);
  const providerModel = getProviderModel(settings, selectedProvider);
  const providerModelOptions = getSupportedModelOptions(
    selectedProvider,
    providerModel,
  );
  const providerLabels = getProviderFieldLabels(intl, selectedProvider);
  const providerOptionLabels = getProviderOptionLabels(intl);
  const validationContent = getQuickSetupValidationContent(intl);
  const apiKeyLinks = getApiKeyLinkContent(intl);
  const apiKeyHintId = `${apiKeyInputId}-hint`;

  function getPrecheckMessage(reason?: LlmValidationPrecheckReason) {
    switch (reason) {
      case "missing_api_key":
        return validationContent.missingApiKey;
      case "too_short":
        return validationContent.tooShort;
      case "invalid_format":
        return getInvalidFormatMessage(selectedProvider, validationContent);
      case "missing_model":
        return validationContent.missingModel;
      default:
        return validationContent.help;
    }
  }

  return (
    <>
      {securityNote ? (
        <div className="flex items-start gap-3 rounded-xl bg-muted/60 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{securityNote.title}</p>
            <p>{securityNote.body}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <Label htmlFor={providerInputId}>{providerLabels.provider}</Label>
          <Select
            id={providerInputId}
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
            <option value="anthropic">{providerOptionLabels.anthropic}</option>
            <option value="gemini">{providerOptionLabels.gemini}</option>
          </Select>
        </div>
        <div className="space-y-3">
          <Label htmlFor={modelInputId}>{providerLabels.model}</Label>
          <Select
            id={modelInputId}
            value={providerModel}
            onChange={(event) => {
              const nextValue = event.target.value;
              if (selectedProvider === "anthropic") {
                dispatch(setPreferredAnthropicModel(nextValue));
                return;
              }
              if (selectedProvider === "gemini") {
                dispatch(setPreferredGeminiModel(nextValue));
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

      <div className="space-y-3">
        <Label htmlFor={apiKeyInputId}>{providerLabels.apiKey}</Label>
        <Input
          id={apiKeyInputId}
          aria-describedby={apiKeyHintId}
          type="password"
          autoComplete="off"
          placeholder={getApiKeyPlaceholder(selectedProvider)}
          value={providerApiKey}
          onChange={(event) => {
            const nextValue = event.target.value;
            if (selectedProvider === "anthropic") {
              dispatch(setAnthropicApiKey(nextValue));
              return;
            }
            if (selectedProvider === "gemini") {
              dispatch(setGeminiApiKey(nextValue));
              return;
            }
            dispatch(setOpenAiApiKey(nextValue));
          }}
        />
        {validation.status === "valid" ? (
          <p
            id={apiKeyHintId}
            className="text-sm text-emerald-700 dark:text-emerald-400"
          >
            {validationContent.success}
          </p>
        ) : null}
        {validation.status === "invalid" && validation.errorMessage ? (
          <p id={apiKeyHintId} className="text-sm text-destructive">
            {validation.errorMessage}
          </p>
        ) : null}
        {validation.status === "validating" ? (
          <p id={apiKeyHintId} className="text-sm text-muted-foreground">
            {validationContent.pending}
          </p>
        ) : null}
        {validation.status === "idle" && isDebouncing && precheck.eligible ? (
          <p id={apiKeyHintId} className="text-sm text-muted-foreground">
            {validationContent.waiting}
          </p>
        ) : null}
        {validation.status === "idle" && !isDebouncing ? (
          <p id={apiKeyHintId} className="text-sm text-muted-foreground">
            {getPrecheckMessage(precheck.reason)}
          </p>
        ) : null}
      </div>

      {continueAction ? (
        <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
          <Button
            size="lg"
            onClick={continueAction.onContinue}
            disabled={continueAction.disabled}
            className="bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
          >
            {continueAction.label}
          </Button>
          <span className="text-sm text-muted-foreground">
            {continueAction.help}
          </span>
        </div>
      ) : null}

      {showApiKeyLinks ? (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex">
            <div>
              <a
                href={apiKeyLinks.sectionHref}
                className="inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline"
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
              <div className="mr-1 inline-block">
                <a
                  href={apiKeyLinks.providers.gemini.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {providerOptionLabels.gemini}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function getProviderApiKey(
  settings: AppSettings,
  provider: SupportedLlmProvider,
) {
  switch (provider) {
    case "anthropic":
      return settings.anthropicApiKey;
    case "gemini":
      return settings.geminiApiKey;
    case "openai":
      return settings.openAiApiKey;
  }
}

function getProviderModel(
  settings: AppSettings,
  provider: SupportedLlmProvider,
) {
  switch (provider) {
    case "anthropic":
      return settings.preferredAnthropicModel;
    case "gemini":
      return settings.preferredGeminiModel;
    case "openai":
      return settings.preferredOpenAiModel;
  }
}

function getApiKeyPlaceholder(provider: SupportedLlmProvider) {
  switch (provider) {
    case "anthropic":
      return "sk-ant-...";
    case "gemini":
      return "AIza...";
    case "openai":
      return "sk-...";
  }
}

function getInvalidFormatMessage(
  provider: SupportedLlmProvider,
  validationContent: ReturnType<typeof getQuickSetupValidationContent>,
) {
  switch (provider) {
    case "anthropic":
      return validationContent.invalidAnthropicFormat;
    case "gemini":
      return validationContent.invalidGeminiFormat;
    case "openai":
      return validationContent.invalidOpenAiFormat;
  }
}
