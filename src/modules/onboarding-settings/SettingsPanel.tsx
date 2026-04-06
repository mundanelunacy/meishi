import { useNavigate } from "@tanstack/react-router";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { hasFirebaseConfiguration } from "../../app/env";
import { Button } from "../../shared/ui/button";
import { Spinner } from "../../shared/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../shared/ui/card";
import { Input } from "../../shared/ui/input";
import { Label } from "../../shared/ui/label";
import { Alert } from "../../shared/ui/alert";
import {
  clearAllSettings,
  selectAppReadiness,
  selectGoogleAuth,
  selectSettings,
  setAnthropicApiKey,
  setExtractionPrompt,
  setGoogleAuthState,
  setOpenAiApiKey,
  setPreferredAnthropicModel,
  setPreferredOpenAiModel,
  signOutGoogle,
} from "./onboardingSlice";
import {
  connectGoogleContacts,
  disconnectGoogleContacts,
} from "../google-auth/googleIdentity";
import { pushToast } from "../../shared/ui/toastBus";

export function SettingsPanel() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const settings = useAppSelector(selectSettings);
  const googleAuth = useAppSelector(selectGoogleAuth);
  const readiness = useAppSelector(selectAppReadiness);

  async function handleReconnectGoogle() {
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
        error instanceof Error ? error.message : "Unable to reconnect Google.",
      );
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Provider settings</CardTitle>
          <CardDescription>
            OpenAI and Anthropic both use structured extraction. The shared
            prompt is editable, but provider-specific schema enforcement stays
            fixed in code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-border/90 bg-muted/40 text-foreground">
            <div className="space-y-1">
              <p className="font-medium">App readiness</p>
              <p className="text-sm text-muted-foreground">
                Provider configured:{" "}
                {readiness.hasLlmConfiguration ? "Yes" : "No"}. Google
                authorized: {readiness.hasGoogleAuthorization ? "Yes" : "No"}.
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
              onChange={(event) =>
                dispatch(setOpenAiApiKey(event.target.value))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-openai-model">
              Preferred OpenAI model
            </Label>
            <Input
              id="settings-openai-model"
              value={settings.preferredOpenAiModel}
              onChange={(event) =>
                dispatch(setPreferredOpenAiModel(event.target.value))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-anthropic-api-key">
              Anthropic API key
            </Label>
            <Input
              id="settings-anthropic-api-key"
              type="password"
              value={settings.anthropicApiKey}
              onChange={(event) =>
                dispatch(setAnthropicApiKey(event.target.value))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-anthropic-model">
              Preferred Anthropic model
            </Label>
            <Input
              id="settings-anthropic-model"
              value={settings.preferredAnthropicModel}
              onChange={(event) =>
                dispatch(setPreferredAnthropicModel(event.target.value))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-extraction-prompt">
              Advanced extraction prompt
            </Label>
            <textarea
              id="settings-extraction-prompt"
              className="flex min-h-[160px] w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google authorization and local data</CardTitle>
          <CardDescription>
            Google access tokens are minted by Firebase Functions on demand and
            refreshed with the stored backend token. Stored LLM configuration
            remains local to this browser profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            {googleAuth.status === "connected"
              ? "Google Contacts is currently connected through Firebase-backed token refresh."
              : googleAuth.status === "connecting"
                ? "Google Contacts authorization is currently in progress."
                : "Google Contacts is not currently connected."}
          </Alert>

          {!hasFirebaseConfiguration() ? (
            <Alert>
              Set the required <code>VITE_FIREBASE_*</code> values before
              reconnecting Google.
            </Alert>
          ) : null}

          <div className="rounded-xl bg-muted/50 p-4 text-sm">
            <p className="font-medium text-foreground">
              Current Google session
            </p>
            <p className="mt-1 text-muted-foreground">
              Status: {googleAuth.status}
              {googleAuth.accountEmail
                ? ` • Account: ${googleAuth.accountEmail}`
                : ""}
              {googleAuth.firebaseUid
                ? ` • Firebase UID: ${googleAuth.firebaseUid}`
                : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => {
                void handleReconnectGoogle();
              }}
              disabled={
                !hasFirebaseConfiguration() ||
                googleAuth.status === "connecting"
              }
            >
              {googleAuth.status === "connecting" ? <Spinner /> : null}
              {googleAuth.status === "connecting"
                ? "Reconnecting..."
                : "Reconnect Google"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void disconnectGoogleContacts()
                  .then(() => {
                    dispatch(signOutGoogle());
                  })
                  .catch((error) => {
                    pushToast(
                      error instanceof Error
                        ? error.message
                        : "Unable to sign out Google.",
                    );
                  });
              }}
            >
              Sign out Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => dispatch(clearAllSettings())}
            >
              Clear local settings
            </Button>
            <Button type="button" onClick={() => navigate({ to: "/landing" })}>
              Re-run onboarding
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
