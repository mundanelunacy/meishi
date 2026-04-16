import { usePostHog } from "@posthog/react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { LOCALE_LABELS } from "../../app/intl";
import { hasFirebaseConfiguration } from "../../app/env";
import { useIntl } from "react-intl";
import { Button } from "../../shared/ui/button";
import { Select } from "../../shared/ui/select";
import { Spinner } from "../../shared/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "../../shared/ui/card";
import { Input } from "../../shared/ui/input";
import { Label } from "../../shared/ui/label";
import { Alert } from "../../shared/ui/alert";
import { Textarea } from "../../shared/ui/textarea";
import {
  clearAllSettings,
  selectGoogleAuth,
  selectSettings,
  setAnthropicApiKey,
  setExtractionPrompt,
  setGoogleAuthState,
  setLlmProvider,
  setOpenAiApiKey,
  setPreferredAnthropicModel,
  setPreferredOpenAiModel,
  setLocale,
  setThemeMode,
  signOutGoogle,
} from "./onboardingSlice";
import {
  connectGoogleContacts,
  disconnectGoogleContacts,
} from "../google-auth/googleIdentity";
import { useGoogleAuthStateSync } from "../google-auth/useGoogleAuthStateSync";
import { pushToast } from "../../shared/ui/toastBus";
import { getSupportedModelOptions } from "./modelOptions";
import {
  getProviderFieldLabels,
  getProviderOptionLabels,
  getSettingsContent,
} from "./onboardingContent";

export function SettingsPanel() {
  useGoogleAuthStateSync();

  const posthog = usePostHog();
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectSettings);
  const googleAuth = useAppSelector(selectGoogleAuth);
  const selectedProvider =
    settings.llmProvider === "anthropic" ? "anthropic" : "openai";
  const providerApiKey =
    selectedProvider === "anthropic"
      ? settings.anthropicApiKey
      : settings.openAiApiKey;
  const providerModel =
    selectedProvider === "anthropic"
      ? settings.preferredAnthropicModel
      : settings.preferredOpenAiModel;
  const providerModelOptions = getSupportedModelOptions(
    selectedProvider,
    providerModel,
  );
  const content = getSettingsContent(intl);
  const connectedOnLabel = googleAuth.connectedAt
    ? content.connectedOn(googleAuth.connectedAt)
    : null;
  const providerLabels = getProviderFieldLabels(intl, selectedProvider);
  const providerOptionLabels = getProviderOptionLabels(intl);

  async function handleGoogleStatusChange(
    nextValue: "connected" | "signed_out",
  ) {
    if (nextValue === "connected") {
      if (
        !hasFirebaseConfiguration() ||
        googleAuth.status === "connecting" ||
        googleAuth.status === "disconnecting"
      ) {
        return;
      }

      try {
        dispatch(
          setGoogleAuthState({
            ...googleAuth,
            status: "connecting",
          }),
        );
        const nextAuthState = await connectGoogleContacts();
        dispatch(setGoogleAuthState(nextAuthState));
        pushToast(content.toasts.refreshed);
      } catch (error) {
        dispatch(
          setGoogleAuthState({
            ...googleAuth,
            status: googleAuth.connectedAt ? "connected" : "signed_out",
          }),
        );
        pushToast(
          error instanceof Error
            ? error.message
            : content.toasts.reconnectError,
        );
      }

      return;
    }

    if (
      googleAuth.status === "signed_out" ||
      googleAuth.status === "disconnecting"
    ) {
      return;
    }

    try {
      dispatch(
        setGoogleAuthState({
          ...googleAuth,
          status: "disconnecting",
        }),
      );
      await disconnectGoogleContacts();
      dispatch(signOutGoogle());
      posthog.capture("google_auth_disconnected");
    } catch (error) {
      dispatch(
        setGoogleAuthState({
          ...googleAuth,
          status: googleAuth.connectedAt ? "connected" : "signed_out",
        }),
      );
      pushToast(
        error instanceof Error ? error.message : content.toasts.signOutError,
      );
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{content.llmTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-3 rounded-xl bg-muted/60 p-4">
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                {content.securityTitle}
              </p>
              <p>{content.securityBody}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="settings-provider">{providerLabels.provider}</Label>
            <Select
              id="settings-provider"
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
              <Label htmlFor="settings-api-key">{providerLabels.apiKey}</Label>
              <Input
                id="settings-api-key"
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
              <Label htmlFor="settings-model">{providerLabels.model}</Label>
              <Select
                id="settings-model"
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{content.googleTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasFirebaseConfiguration() ? (
            <Alert>{content.googleAlert}</Alert>
          ) : null}

          <fieldset>
            <div className="flex flex-wrap gap-3">
              {(
                [
                  ["connected", content.connected],
                  ["signed_out", content.disconnected],
                ] as const
              ).map(([value, label]) => {
                const checked =
                  value === "connected"
                    ? googleAuth.status === "connected"
                    : googleAuth.status === "signed_out" ||
                      googleAuth.status === "disconnecting";
                const disabled =
                  googleAuth.status === "connecting" ||
                  googleAuth.status === "disconnecting" ||
                  (!hasFirebaseConfiguration() && value === "connected");

                return (
                  <label
                    key={value}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                      checked
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-background text-muted-foreground"
                    } ${disabled ? "opacity-60" : ""}`}
                  >
                    <input
                      type="radio"
                      name="google-status"
                      className="h-4 w-4"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => {
                        void handleGoogleStatusChange(value);
                      }}
                    />
                    {label}
                    {(googleAuth.status === "connecting" &&
                      value === "connected") ||
                    (googleAuth.status === "disconnecting" &&
                      value === "signed_out") ? (
                      <Spinner />
                    ) : null}
                  </label>
                );
              })}
            </div>
          </fieldset>
          {(googleAuth.status === "connected" ||
            googleAuth.status === "disconnecting") &&
          (googleAuth.accountEmail || connectedOnLabel) ? (
            <div className="space-y-1 text-sm text-muted-foreground">
              {googleAuth.accountEmail ? (
                <p>{content.signedInAs(googleAuth.accountEmail)}</p>
              ) : null}
              {connectedOnLabel ? <p>{connectedOnLabel}</p> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{content.appearanceTitle}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <Label htmlFor="settings-theme">{content.themeLabel}</Label>
            <Select
              id="settings-theme"
              value={settings.themeMode}
              onChange={(event) =>
                dispatch(
                  setThemeMode(event.target.value as typeof settings.themeMode),
                )
              }
            >
              <option value="system">{content.themeSystem}</option>
              <option value="light">{content.themeLight}</option>
              <option value="dark">{content.themeDark}</option>
            </Select>
            <p className="text-xs text-muted-foreground">{content.themeHelp}</p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="settings-locale">{content.localeLabel}</Label>
            <Select
              id="settings-locale"
              value={settings.locale}
              onChange={(event) =>
                dispatch(
                  setLocale(event.target.value as typeof settings.locale),
                )
              }
            >
              {Object.entries(LOCALE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              {content.localeHelp}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{content.advancedTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-extraction-prompt">
              {content.promptLabel}
            </Label>
            <Textarea
              id="settings-extraction-prompt"
              value={settings.extractionPrompt}
              onChange={(event) =>
                dispatch(setExtractionPrompt(event.target.value))
              }
            />
            <p className="text-xs text-muted-foreground">
              {content.promptHelp}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              posthog.capture("settings_cleared");
              dispatch(clearAllSettings());
            }}
          >
            {content.clearButton}
          </Button>
          <p className="text-xs text-muted-foreground">{content.clearHelp}</p>
        </CardContent>
      </Card>
    </div>
  );
}
