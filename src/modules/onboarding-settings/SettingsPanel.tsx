import { useNavigate } from "@tanstack/react-router";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { Button } from "../../shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../shared/ui/card";
import { Input } from "../../shared/ui/input";
import { Label } from "../../shared/ui/label";
import { Alert } from "../../shared/ui/alert";
import {
  clearAllSettings,
  selectGoogleAuth,
  selectSettings,
  setLlmApiKey,
  setPreferredOpenAiModel,
  signOutGoogle,
} from "./onboardingSlice";
import { revokeGoogleAccessToken } from "../google-auth/googleIdentity";

export function SettingsPanel() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const settings = useAppSelector(selectSettings);
  const googleAuth = useAppSelector(selectGoogleAuth);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Provider settings</CardTitle>
          <CardDescription>
            OpenAI is the only implemented provider in this scaffold. Future adapters should conform to the same extraction interface.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-api-key">OpenAI API key</Label>
            <Input
              id="settings-api-key"
              type="password"
              value={settings.llmApiKey}
              onChange={(event) => dispatch(setLlmApiKey(event.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-model">Preferred model</Label>
            <Input
              id="settings-model"
              value={settings.preferredOpenAiModel}
              onChange={(event) => dispatch(setPreferredOpenAiModel(event.target.value))}
            />
          </div>
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
            {googleAuth.accessToken
              ? "Google Contacts is currently authorized in this session."
              : "Google Contacts is not currently authorized in this session."}
          </Alert>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (googleAuth.accessToken) {
                  revokeGoogleAccessToken(googleAuth.accessToken);
                }
                dispatch(signOutGoogle());
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
