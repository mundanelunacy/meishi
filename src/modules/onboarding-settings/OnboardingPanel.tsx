import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { KeyRound, ShieldAlert } from "lucide-react";
import { useIntl } from "react-intl";
import { Spinner } from "../../shared/ui/spinner";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { hasFirebaseConfiguration } from "../../app/env";
import { Button } from "../../shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../shared/ui/card";
import { Input } from "../../shared/ui/input";
import { Label } from "../../shared/ui/label";
import { Select } from "../../shared/ui/select";
import { Alert } from "../../shared/ui/alert";
import { pushToast } from "../../shared/ui/toastBus";
import {
  completeOnboarding,
  selectAppReadiness,
  selectGoogleAuth,
  selectSettings,
  setAnthropicApiKey,
  setGeminiApiKey,
  setGoogleAuthState,
  setLlmProvider,
  setOpenAiApiKey,
  setPreferredAnthropicModel,
  setPreferredGeminiModel,
  setPreferredOpenAiModel,
} from "./onboardingSlice";
import {
  connectGoogleContacts,
  getGoogleScope,
} from "../google-auth/googleIdentity";
import { useAnalytics } from "../gdpr";
import { getSupportedModelOptions } from "./modelOptions";
import {
  getLlmValidationContent,
  getOnboardingPanelContent,
  getProviderFieldLabels,
  getProviderOptionLabels,
} from "./onboardingContent";
import { useLlmValidation } from "./useLlmValidation";
import type { AppSettings, SupportedLlmProvider } from "../../shared/types/models";

export function OnboardingPanel() {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const settings = useAppSelector(selectSettings);
  const googleAuth = useAppSelector(selectGoogleAuth);
  const readiness = useAppSelector(selectAppReadiness);
  const { currentConfiguration, validateCurrentConfiguration, validation } =
    useLlmValidation();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const selectedProvider = settings.llmProvider;
  const providerApiKey = getProviderApiKey(settings, selectedProvider);
  const providerModel = getProviderModel(settings, selectedProvider);
  const providerModelOptions = getSupportedModelOptions(
    selectedProvider,
    providerModel,
  );
  const content = getOnboardingPanelContent(intl, getGoogleScope());
  const validationContent = getLlmValidationContent(intl);
  const providerLabels = getProviderFieldLabels(intl, selectedProvider);
  const providerOptionLabels = getProviderOptionLabels(intl);

  const analytics = useAnalytics();
  const canContinue = readiness.hasLlmConfiguration;

  async function handleGoogleConnect() {
    setIsAuthorizing(true);
    setErrorMessage(null);

    try {
      dispatch(
        setGoogleAuthState({
          ...googleAuth,
          status: "connecting",
        }),
      );
      const nextAuthState = await connectGoogleContacts();
      dispatch(setGoogleAuthState(nextAuthState));
      analytics.capture("google_auth_connected", {
        account_email: nextAuthState.accountEmail ?? null,
        context: "onboarding",
      });
      pushToast(content.toasts.accessGranted);
    } catch (error) {
      dispatch(
        setGoogleAuthState({
          ...googleAuth,
          status: googleAuth.connectedAt ? "connected" : "signed_out",
        }),
      );
      analytics.captureException(error);
      const message =
        error instanceof Error ? error.message : content.toasts.connectError;
      setErrorMessage(message);
    } finally {
      setIsAuthorizing(false);
    }
  }

  function handleFinish() {
    dispatch(completeOnboarding());
    analytics.capture("onboarding_completed", {
      llm_provider: settings.llmProvider,
      has_google_auth: readiness.hasGoogleAuthorization,
    });
    pushToast(content.toasts.complete);
    navigate({ to: "/capture" });
  }

  async function handleValidate() {
    await validateCurrentConfiguration();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{content.title}</CardTitle>
          <CardDescription>{content.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-1 h-5 w-5 text-accent" />
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  {content.securityTitle}
                </p>
                <p>{content.securityBody}</p>
              </div>
            </div>
            {!hasFirebaseConfiguration() ? (
              <Alert>{content.firebaseAlert}</Alert>
            ) : null}
          </section>

          <section className="space-y-3">
            <Label htmlFor="provider">{providerLabels.provider}</Label>
            <Select
              id="provider"
              value={selectedProvider}
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
              <option value="gemini">{providerOptionLabels.gemini}</option>
            </Select>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3 sm:col-span-2">
              <Label htmlFor="api-key">{providerLabels.apiKey}</Label>
              <Input
                id="api-key"
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
            </div>
            <div className="space-y-3 sm:col-span-2">
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
          </section>

          <section className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  void handleValidate();
                }}
                disabled={
                  currentConfiguration === null ||
                  validation.status === "validating"
                }
              >
                {validation.status === "validating"
                  ? validationContent.pending
                  : validationContent.action}
              </Button>
              <span className="text-sm text-muted-foreground">
                {validationContent.help}
              </span>
            </div>
            {validation.status === "valid" ? (
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                {validationContent.success}
              </p>
            ) : null}
            {validation.status === "invalid" && validation.errorMessage ? (
              <Alert className="border-destructive/40 text-destructive">
                {validation.errorMessage}
              </Alert>
            ) : null}
            {validation.status === "idle" && currentConfiguration ? (
              <p className="text-sm text-muted-foreground">
                {validationContent.required}
              </p>
            ) : null}
          </section>

          <section className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              {content.structuredTitle}
            </p>
            <p className="mt-1">{content.structuredBody}</p>
          </section>

          <section className="rounded-xl bg-muted/60 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <KeyRound className="h-4 w-4" />
              {content.googleTitle}
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              {content.googleBody}
            </p>
            <div className="mb-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-background px-3 py-1 font-medium text-foreground">
                {content.firebaseSessionLabel(
                  googleAuth.firebaseUid
                    ? content.firebaseReady
                    : content.firebaseStarting,
                )}
              </span>
              <span className="rounded-full bg-background px-3 py-1 text-muted-foreground">
                {content.statusLabel(
                  googleAuth.status === "connected"
                    ? content.connected
                    : googleAuth.status === "connecting"
                      ? content.connecting
                      : content.notConnected,
                )}
              </span>
            </div>
            <Button
              onClick={handleGoogleConnect}
              disabled={isAuthorizing || !hasFirebaseConfiguration()}
            >
              {isAuthorizing ? <Spinner /> : null}
              {isAuthorizing
                ? content.connectingButton
                : readiness.hasGoogleAuthorization
                  ? content.reconnectButton
                  : content.connectButton}
            </Button>
          </section>

          {errorMessage ? (
            <Alert className="border-destructive/40 text-destructive">
              {errorMessage}
            </Alert>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleFinish} disabled={!canContinue}>
              {content.continueLabel}
            </Button>
            <span className="text-sm text-muted-foreground">
              {content.continueHelp}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/90">
        <CardHeader>
          <CardTitle>{content.nextTitle}</CardTitle>
          <CardDescription>{content.nextDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {content.nextSteps.map((step) => (
            <div key={step.title}>
              <p className="font-medium text-foreground">{step.title}</p>
              <p>{step.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
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
