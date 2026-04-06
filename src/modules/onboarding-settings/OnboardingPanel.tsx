import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { KeyRound, ShieldAlert } from "lucide-react";
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
  setGoogleAuthState,
  setLlmProvider,
  setOpenAiApiKey,
  setPreferredAnthropicModel,
  setPreferredOpenAiModel,
} from "./onboardingSlice";
import {
  connectGoogleContacts,
  getGoogleScope,
} from "../google-auth/googleIdentity";
import { getSupportedModelOptions } from "./modelOptions";

export function OnboardingPanel() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const settings = useAppSelector(selectSettings);
  const googleAuth = useAppSelector(selectGoogleAuth);
  const readiness = useAppSelector(selectAppReadiness);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
      pushToast("Google Contacts access granted.");
    } catch (error) {
      dispatch(
        setGoogleAuthState({
          ...googleAuth,
          status: googleAuth.connectedAt ? "connected" : "signed_out",
        }),
      );
      const message =
        error instanceof Error
          ? error.message
          : "Unable to authorize Google Contacts.";
      setErrorMessage(message);
    } finally {
      setIsAuthorizing(false);
    }
  }

  function handleFinish() {
    dispatch(completeOnboarding());
    pushToast("Onboarding complete. You can start capturing cards.");
    navigate({ to: "/capture" });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>First-run setup</CardTitle>
          <CardDescription>
            Meishi runs entirely in the browser. It stores your LLM key locally,
            which is acceptable for trusted prototype use only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-1 h-5 w-5 text-accent" />
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Security note</p>
                <p>
                  This scaffold uses a browser-only BYOK model. Do not treat
                  client-side API key storage as production-safe.
                </p>
              </div>
            </div>
            {!hasFirebaseConfiguration() ? (
              <Alert>
                Set the required <code>VITE_FIREBASE_*</code> values before
                Google sign-in will work.
              </Alert>
            ) : null}
          </section>

          <section className="space-y-3">
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
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3 sm:col-span-2">
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
            <div className="space-y-3 sm:col-span-2">
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
          </section>

          <section className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Structured extraction</p>
            <p className="mt-1">
              Meishi enforces structured output for extraction. The shared
              prompt is adjustable later in Settings, but the schema contract
              stays fixed.
            </p>
          </section>

          <section className="rounded-xl bg-muted/60 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <KeyRound className="h-4 w-4" />
              Google Contacts access
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Meishi creates new Google contacts and can upload one contact
              photo after save. Google currently requires the{" "}
              <code>{getGoogleScope()}</code> scope for that flow, so the
              consent screen may mention broader contact access than the app
              uses. Short-lived access tokens are re-acquired only when needed.
            </p>
            <div className="mb-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-background px-3 py-1 font-medium text-foreground">
                Firebase session:{" "}
                {googleAuth.firebaseUid ? "Ready" : "Starting"}
              </span>
              <span className="rounded-full bg-background px-3 py-1 text-muted-foreground">
                Status:{" "}
                {googleAuth.status === "connected"
                  ? "Connected"
                  : googleAuth.status === "connecting"
                    ? "Connecting"
                    : "Not connected"}
              </span>
            </div>
            <Button
              onClick={handleGoogleConnect}
              disabled={isAuthorizing || !hasFirebaseConfiguration()}
            >
              {isAuthorizing ? <Spinner /> : null}
              {isAuthorizing
                ? "Connecting..."
                : readiness.hasGoogleAuthorization
                  ? "Reconnect Google account"
                  : "Connect Google account"}
            </Button>
          </section>

          {errorMessage ? (
            <Alert className="border-destructive/40 text-destructive">
              {errorMessage}
            </Alert>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleFinish} disabled={!canContinue}>
              Continue to capture
            </Button>
            <span className="text-sm text-muted-foreground">
              Ready when the selected provider is configured. Google access is
              only needed when you save to Google Contacts.
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/90">
        <CardHeader>
          <CardTitle>What happens next</CardTitle>
          <CardDescription>
            The app keeps images and drafts locally until you verify them, then
            syncs verified contact data to Google Contacts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">1. Capture</p>
            <p>
              Use the phone camera or photo picker to add one or more
              business-card images.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">2. Extract</p>
            <p>
              Meishi sends those images to the selected provider and validates
              the returned structured schema locally before the draft reaches
              review.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">3. Review and sync</p>
            <p>
              One selected image becomes the Google contact photo. Additional
              images stay local in the PWA history.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
