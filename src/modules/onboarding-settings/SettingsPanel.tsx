import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { hasFirebaseConfiguration } from "../../app/env";
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

export function SettingsPanel() {
  useGoogleAuthStateSync();

  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectSettings);
  const googleAuth = useAppSelector(selectGoogleAuth);
  const selectedProvider = settings.llmProvider;
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

  async function handleGoogleStatusChange(
    nextValue: "connected" | "signed_out",
  ) {
    if (nextValue === "connected") {
      if (!hasFirebaseConfiguration() || googleAuth.status === "connecting") {
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
        pushToast("Google authorization refreshed.");
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
            : "Unable to reconnect Google.",
        );
      }

      return;
    }

    try {
      await disconnectGoogleContacts();
      dispatch(signOutGoogle());
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Unable to sign out Google.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>LLM Provider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-3 rounded-xl bg-muted/60 p-4">
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Security note</p>
              <p>
                Meishi stores your API key in the browser only, which is
                acceptable for personal use on a trusted device.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="settings-provider">LLM provider</Label>
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
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="gemini" disabled>
                Gemini (planned)
              </option>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="settings-api-key">
                {selectedProvider === "anthropic"
                  ? "Anthropic API key"
                  : "OpenAI API key"}
              </Label>
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
              <Label htmlFor="settings-model">
                {selectedProvider === "anthropic"
                  ? "Anthropic model"
                  : "OpenAI model"}
              </Label>
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
          <CardTitle>Google status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasFirebaseConfiguration() ? (
            <Alert>
              Set the required <code>VITE_FIREBASE_*</code> values before
              changing Google connection status.
            </Alert>
          ) : null}

          <fieldset>
            <div className="flex flex-wrap gap-3">
              {(
                [
                  ["connected", "Connected"],
                  ["signed_out", "Disconnected"],
                ] as const
              ).map(([value, label]) => {
                const checked =
                  value === "connected"
                    ? googleAuth.status === "connected"
                    : googleAuth.status === "signed_out";
                const disabled =
                  googleAuth.status === "connecting" ||
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
                    {googleAuth.status === "connecting" &&
                    value === "connected" ? (
                      <Spinner />
                    ) : null}
                  </label>
                );
              })}
            </div>
          </fieldset>
          {googleAuth.status === "connected" && googleAuth.accountEmail ? (
            <p className="text-sm text-muted-foreground">
              Signed in as {googleAuth.accountEmail}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="settings-theme">Color theme</Label>
          <Select
            id="settings-theme"
            value={settings.themeMode}
            onChange={(event) =>
              dispatch(
                setThemeMode(event.target.value as typeof settings.themeMode),
              )
            }
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </Select>
          <p className="text-xs text-muted-foreground">
            System follows your device appearance automatically. Light and dark
            stay pinned until you change them here.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-extraction-prompt">
              Advanced extraction prompt
            </Label>
            <Textarea
              id="settings-extraction-prompt"
              value={settings.extractionPrompt}
              onChange={(event) =>
                dispatch(setExtractionPrompt(event.target.value))
              }
            />
            <p className="text-xs text-muted-foreground">
              This guidance is shared by OpenAI and Anthropic and is appended to
              the fixed structured-output and fidelity rules. Prompt edits
              cannot disable schema enforcement.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => dispatch(clearAllSettings())}
          >
            Clear local settings
          </Button>
          <p className="text-xs text-muted-foreground">
            Clears saved API keys, preferred models, extraction prompt, Google
            connection metadata, appearance preference, and onboarding progress
            from this browser.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
