import { useNavigate } from "@tanstack/react-router";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { Button } from "../../shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../shared/ui/card";
import { Input } from "../../shared/ui/input";
import { Label } from "../../shared/ui/label";
import { Alert } from "../../shared/ui/alert";
import {
  clearAllSettings,
  selectDeveloperDebugMode,
  selectAppReadiness,
  selectGoogleAuth,
  selectSettings,
  setAnthropicApiKey,
  setDeveloperDebugMode,
  setExtractionPrompt,
  setGoogleAuthState,
  setOpenAiApiKey,
  setPreferredAnthropicModel,
  setPreferredOpenAiModel,
  signOutGoogle,
} from "./onboardingSlice";
import {
  googleAuthClient,
  requestGoogleAccessToken,
  revokeGoogleAccessToken,
} from "../google-auth/googleIdentity";
import { pushToast } from "../../shared/ui/toastBus";

export function SettingsPanel() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const settings = useAppSelector(selectSettings);
  const googleAuth = useAppSelector(selectGoogleAuth);
  const readiness = useAppSelector(selectAppReadiness);
  const developerDebugMode = useAppSelector(selectDeveloperDebugMode);

  async function handleReconnectGoogle() {
    try {
      const nextAuthState = await requestGoogleAccessToken({
        prompt: googleAuth.accessToken ? "" : "consent",
        hint: googleAuth.accountHint,
      });
      dispatch(setGoogleAuthState(nextAuthState));
      pushToast(
        nextAuthState.mode === "mock"
          ? "Mock Google session refreshed."
          : "Google authorization refreshed."
      );
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Unable to reconnect Google.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Provider settings</CardTitle>
          <CardDescription>
            OpenAI and Anthropic both use structured extraction. The shared prompt is editable, but provider-specific schema enforcement stays fixed in code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-border/90 bg-muted/40 text-foreground">
            <div className="space-y-1">
              <p className="font-medium">App readiness</p>
              <p className="text-sm text-muted-foreground">
                Provider configured: {readiness.hasLlmConfiguration ? "Yes" : "No"}.
                Google authorized: {readiness.hasGoogleAuthorization ? "Yes" : "No"}.
                Capture ready: {readiness.isCaptureReady ? "Yes" : "No"}.
              </p>
            </div>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="settings-openai-api-key">OpenAI API key</Label>
            <Input
              id="settings-openai-api-key"
              type="password"
              value={settings.openAiApiKey}
              onChange={(event) => dispatch(setOpenAiApiKey(event.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-openai-model">Preferred OpenAI model</Label>
            <Input
              id="settings-openai-model"
              value={settings.preferredOpenAiModel}
              onChange={(event) => dispatch(setPreferredOpenAiModel(event.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-anthropic-api-key">Anthropic API key</Label>
            <Input
              id="settings-anthropic-api-key"
              type="password"
              value={settings.anthropicApiKey}
              onChange={(event) => dispatch(setAnthropicApiKey(event.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-anthropic-model">Preferred Anthropic model</Label>
            <Input
              id="settings-anthropic-model"
              value={settings.preferredAnthropicModel}
              onChange={(event) => dispatch(setPreferredAnthropicModel(event.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-extraction-prompt">Advanced extraction prompt</Label>
            <textarea
              id="settings-extraction-prompt"
              className="flex min-h-[160px] w-full rounded-2xl border border-input bg-background/80 px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={settings.extractionPrompt}
              onChange={(event) => dispatch(setExtractionPrompt(event.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              This guidance is shared by OpenAI and Anthropic and is appended to the fixed structured-output and fidelity rules. Prompt edits cannot disable schema enforcement.
            </p>
          </div>

          <label className="flex items-start justify-between gap-4 rounded-[24px] border border-border/70 bg-muted/40 px-4 py-3">
            <div>
              <p className="font-medium text-foreground">Developer debug mode</p>
              <p className="text-sm text-muted-foreground">
                Show raw extraction, vCard preview, and Google payload preview on the review screen.
              </p>
            </div>
            <input
              aria-label="Developer debug mode"
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={developerDebugMode}
              onChange={(event) => dispatch(setDeveloperDebugMode(event.target.checked))}
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google authorization and local data</CardTitle>
          <CardDescription>
            Google access tokens are short-lived and reacquired on demand. Stored LLM configuration remains local to this browser profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            {googleAuth.mode === "mock"
              ? "Developer mock auth is active. Sync calls will stay in local demo mode until real Google OAuth is configured."
              : googleAuth.accessToken
                ? "Google Contacts is currently authorized in this session."
                : "Google Contacts is not currently authorized in this session."}
          </Alert>

          <div className="rounded-[24px] bg-muted/50 p-4 text-sm">
            <p className="font-medium text-foreground">Current Google session</p>
            <p className="mt-1 text-muted-foreground">
              Mode: {googleAuth.mode === "mock" ? "Developer mock" : "Google OAuth"}
              {googleAuth.accountHint ? ` • Account: ${googleAuth.accountHint}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => {
                void handleReconnectGoogle();
              }}
              disabled={!googleAuthClient.isConfigured()}
            >
              Reconnect Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void revokeGoogleAccessToken(googleAuth.accessToken).finally(() => {
                  dispatch(signOutGoogle());
                });
              }}
            >
              Sign out Google
            </Button>
            <Button type="button" variant="outline" onClick={() => dispatch(clearAllSettings())}>
              Clear local settings
            </Button>
            <Button type="button" onClick={() => navigate({ to: "/onboarding" })}>
              Re-run onboarding
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
