import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { KeyRound, ShieldAlert } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { requiresRealGoogleClientId, usesMockGoogleAuth } from "../../app/env";
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
  setGoogleAuthState,
  setLlmApiKey,
  setLlmProvider,
  setPreferredOpenAiModel,
} from "./onboardingSlice";
import {
  getGoogleScope,
  googleAuthClient,
  requestGoogleAccessToken,
} from "../google-auth/googleIdentity";

export function OnboardingPanel() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const settings = useAppSelector(selectSettings);
  const googleAuth = useAppSelector(selectGoogleAuth);
  const readiness = useAppSelector(selectAppReadiness);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canContinue = readiness.hasLlmConfiguration && readiness.hasGoogleAuthorization;

  async function handleGoogleConnect() {
    setIsAuthorizing(true);
    setErrorMessage(null);

    try {
      const nextAuthState = await requestGoogleAccessToken({
        prompt: googleAuth.accessToken ? "" : "consent",
        hint: googleAuth.accountHint,
      });
      dispatch(setGoogleAuthState(nextAuthState));
      pushToast(
        nextAuthState.mode === "mock"
          ? "Mock Google session ready for local testing."
          : "Google Contacts access granted."
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to authorize Google Contacts.";
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
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle>First-run setup</CardTitle>
          <CardDescription>
            Meishi runs entirely in the browser. It stores your LLM key locally, which is acceptable for trusted prototype use only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-1 h-5 w-5 text-accent" />
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Security note</p>
                <p>
                  This scaffold uses a browser-only BYOK model. Do not treat client-side API key storage as production-safe.
                </p>
              </div>
            </div>
            {usesMockGoogleAuth() ? (
              <Alert className="border-accent/40 bg-accent/10 text-foreground">
                Development mode is using mock Google auth. You can test the app flow locally, but this is not a real Google Contacts session.
              </Alert>
            ) : null}
            {requiresRealGoogleClientId() ? (
              <Alert>
                Set <code>VITE_GOOGLE_CLIENT_ID</code> in your Vite environment before Google sign-in will work.
              </Alert>
            ) : null}
          </section>

          <section className="space-y-3">
            <Label htmlFor="provider">LLM provider</Label>
            <Select
              id="provider"
              value={settings.llmProvider}
              onChange={(event) =>
                dispatch(setLlmProvider(event.target.value as typeof settings.llmProvider))
              }
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic" disabled>
                Anthropic (planned)
              </option>
              <option value="gemini" disabled>
                Gemini (planned)
              </option>
            </Select>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3 sm:col-span-2">
              <Label htmlFor="api-key">API key</Label>
              <Input
                id="api-key"
                type="password"
                autoComplete="off"
                placeholder="sk-..."
                value={settings.llmApiKey}
                onChange={(event) => dispatch(setLlmApiKey(event.target.value))}
              />
            </div>
            <div className="space-y-3 sm:col-span-2">
              <Label htmlFor="model">OpenAI model</Label>
              <Input
                id="model"
                placeholder="gpt-4.1-mini"
                value={settings.preferredOpenAiModel}
                onChange={(event) => dispatch(setPreferredOpenAiModel(event.target.value))}
              />
            </div>
          </section>

          <section className="rounded-[28px] bg-muted/60 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <KeyRound className="h-4 w-4" />
              Google Contacts access
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              The app requests the <code>{getGoogleScope()}</code> scope and re-acquires short-lived access tokens when needed.
            </p>
            <div className="mb-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-background px-3 py-1 font-medium text-foreground">
                Mode: {googleAuth.mode === "mock" ? "Developer mock" : "Google OAuth"}
              </span>
              <span className="rounded-full bg-background px-3 py-1 text-muted-foreground">
                Status: {readiness.hasGoogleAuthorization ? "Authorized" : "Not connected"}
              </span>
            </div>
            <Button
              onClick={handleGoogleConnect}
              disabled={isAuthorizing || !googleAuthClient.isConfigured()}
            >
              {readiness.hasGoogleAuthorization ? "Refresh Google access" : "Connect Google account"}
            </Button>
          </section>

          {errorMessage ? <Alert className="border-destructive/40 text-destructive">{errorMessage}</Alert> : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleFinish} disabled={!canContinue}>
              Continue to capture
            </Button>
            <span className="text-sm text-muted-foreground">
              Ready when Google access and an API key are both present.
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/75">
        <CardHeader>
          <CardTitle>What happens next</CardTitle>
          <CardDescription>
            The app keeps images and drafts locally until you verify them, then syncs verified contact data to Google Contacts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">1. Capture</p>
            <p>Use the phone camera or photo picker to add one or more business-card images.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">2. Extract</p>
            <p>Meishi sends those images to the selected LLM provider and validates the returned schema locally.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">3. Review and sync</p>
            <p>One selected image becomes the Google contact photo. Additional images stay local in the PWA history.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
