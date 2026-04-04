import { appEnv } from "../../app/env";

const GOOGLE_SCOPE = "https://www.googleapis.com/auth/contacts";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: (error: { type: string }) => void;
          }): {
            requestAccessToken(options?: {
              prompt?: string;
              hint?: string;
            }): void;
          };
          revoke(token: string, done?: () => void): void;
        };
      };
    };
  }
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  error?: string;
}

let scriptLoadingPromise: Promise<void> | null = null;

export function getGoogleScope() {
  return GOOGLE_SCOPE;
}

export async function loadGoogleIdentityScript() {
  if (window.google?.accounts.oauth2) {
    return;
  }

  if (!scriptLoadingPromise) {
    scriptLoadingPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google Identity Services."));
      document.head.appendChild(script);
    });
  }

  return scriptLoadingPromise;
}

export async function requestGoogleAccessToken(prompt = "consent") {
  if (!appEnv.googleClientId) {
    throw new Error("Set VITE_GOOGLE_CLIENT_ID before requesting Google access.");
  }

  await loadGoogleIdentityScript();

  return new Promise<GoogleTokenResponse>((resolve, reject) => {
    const client = window.google?.accounts.oauth2.initTokenClient({
      client_id: appEnv.googleClientId,
      scope: GOOGLE_SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }

        resolve(response);
      },
      error_callback: (error) => reject(new Error(error.type)),
    });

    if (!client) {
      reject(new Error("Google token client could not be initialized."));
      return;
    }

    client.requestAccessToken({
      prompt,
    });
  });
}

export function revokeGoogleAccessToken(token: string) {
  window.google?.accounts.oauth2.revoke(token);
}
