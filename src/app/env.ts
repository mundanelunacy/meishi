import type { GoogleAuthMode } from "../shared/types/models";

export interface AppEnv {
  googleClientId: string;
  googleAuthMode: GoogleAuthMode;
  isDevelopment: boolean;
}

interface EnvLike {
  DEV?: boolean;
  VITE_GOOGLE_CLIENT_ID?: string;
  VITE_GOOGLE_AUTH_MODE?: string;
}

export function resolveGoogleAuthMode({
  googleClientId,
  explicitMode,
  isDevelopment,
}: {
  googleClientId: string;
  explicitMode?: string;
  isDevelopment: boolean;
}): GoogleAuthMode {
  if (explicitMode === "mock" || explicitMode === "real") {
    return explicitMode;
  }

  if (isDevelopment && googleClientId.length === 0) {
    return "mock";
  }

  return "real";
}

export function createAppEnv(env: EnvLike): AppEnv {
  const googleClientId = env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "";

  return {
    googleClientId,
    googleAuthMode: resolveGoogleAuthMode({
      googleClientId,
      explicitMode: env.VITE_GOOGLE_AUTH_MODE,
      isDevelopment: Boolean(env.DEV),
    }),
    isDevelopment: Boolean(env.DEV),
  };
}

export const appEnv = createAppEnv(import.meta.env);

export function hasGoogleClientId() {
  return appEnv.googleClientId.length > 0;
}

export function usesMockGoogleAuth() {
  return appEnv.googleAuthMode === "mock";
}

export function requiresRealGoogleClientId() {
  return appEnv.googleAuthMode === "real" && !hasGoogleClientId();
}
