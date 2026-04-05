import { appEnv, type AppEnv } from "../../app/env";
import type { GoogleAuthMode, GoogleAuthState } from "../../shared/types/models";

const GOOGLE_SCOPE = "https://www.googleapis.com/auth/contacts";
const MOCK_ACCOUNT_HINT = "developer@local.test";

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

export interface GoogleTokenRequestOptions {
  prompt?: string;
  hint?: string;
}

export interface GoogleAuthClient {
  readonly mode: GoogleAuthMode;
  getScope(): string;
  getInitialState(metadata?: Partial<GoogleAuthState>): GoogleAuthState;
  isConfigured(): boolean;
  load(): Promise<void>;
  requestAccessToken(options?: GoogleTokenRequestOptions): Promise<GoogleAuthState>;
  revokeAccessToken(token: string | null): Promise<void>;
}

let scriptLoadingPromise: Promise<void> | null = null;

function createBaseGoogleAuthState(mode: GoogleAuthMode) {
  return {
    mode,
    accessToken: null,
    scope: null,
    expiresAt: null,
    accountHint: undefined,
  } satisfies GoogleAuthState;
}

function createRealGoogleAuthClient(env: AppEnv): GoogleAuthClient {
  return {
    mode: "real",
    getScope() {
      return GOOGLE_SCOPE;
    },
    getInitialState(metadata) {
      return {
        ...createBaseGoogleAuthState("real"),
        scope: metadata?.scope ?? null,
        accountHint: metadata?.accountHint,
      };
    },
    isConfigured() {
      return env.googleClientId.length > 0;
    },
    async load() {
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

      await scriptLoadingPromise;
    },
    async requestAccessToken(options) {
      if (!env.googleClientId) {
        throw new Error("Set VITE_GOOGLE_CLIENT_ID before requesting Google access.");
      }

      await this.load();

      return new Promise<GoogleAuthState>((resolve, reject) => {
        const client = window.google?.accounts.oauth2.initTokenClient({
          client_id: env.googleClientId,
          scope: GOOGLE_SCOPE,
          callback: (response) => {
            if (response.error) {
              reject(new Error(response.error));
              return;
            }

            resolve({
              mode: "real",
              accessToken: response.access_token,
              scope: response.scope,
              expiresAt: Date.now() + response.expires_in * 1000,
              accountHint: options?.hint,
            });
          },
          error_callback: (error) => reject(new Error(error.type)),
        });

        if (!client) {
          reject(new Error("Google token client could not be initialized."));
          return;
        }

        client.requestAccessToken({
          prompt: options?.prompt ?? "consent",
          hint: options?.hint,
        });
      });
    },
    async revokeAccessToken(token) {
      if (!token) {
        return;
      }

      await new Promise<void>((resolve) => {
        window.google?.accounts.oauth2.revoke(token, resolve);
      });
    },
  };
}

function createMockGoogleAuthClient(): GoogleAuthClient {
  return {
    mode: "mock",
    getScope() {
      return GOOGLE_SCOPE;
    },
    getInitialState(metadata) {
      return {
        ...createBaseGoogleAuthState("mock"),
        scope: metadata?.scope ?? GOOGLE_SCOPE,
        accountHint: metadata?.accountHint ?? MOCK_ACCOUNT_HINT,
      };
    },
    isConfigured() {
      return true;
    },
    async load() {},
    async requestAccessToken() {
      return {
        mode: "mock",
        accessToken: `mock-google-token-${crypto.randomUUID()}`,
        scope: GOOGLE_SCOPE,
        expiresAt: Date.now() + 60 * 60 * 1000,
        accountHint: MOCK_ACCOUNT_HINT,
      };
    },
    async revokeAccessToken() {},
  };
}

export function createGoogleAuthClient(env: AppEnv): GoogleAuthClient {
  if (env.googleAuthMode === "mock") {
    return createMockGoogleAuthClient();
  }

  return createRealGoogleAuthClient(env);
}

export const googleAuthClient = createGoogleAuthClient(appEnv);

export function getGoogleScope() {
  return googleAuthClient.getScope();
}

export function loadGoogleIdentityScript() {
  return googleAuthClient.load();
}

export function requestGoogleAccessToken(options?: GoogleTokenRequestOptions) {
  return googleAuthClient.requestAccessToken(options);
}

export function revokeGoogleAccessToken(token: string | null) {
  return googleAuthClient.revokeAccessToken(token);
}
