export interface AppEnv {
  firebaseApiKey: string;
  firebaseAuthDomain: string;
  firebaseProjectId: string;
  firebaseAppId: string;
  firebaseFunctionsRegion: string;
  firebaseUseEmulators: boolean;
  isDevelopment: boolean;
}

interface EnvLike {
  DEV?: boolean;
  VITE_FIREBASE_API_KEY?: string;
  VITE_FIREBASE_AUTH_DOMAIN?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_APP_ID?: string;
  VITE_FIREBASE_FUNCTIONS_REGION?: string;
  VITE_FIREBASE_USE_EMULATORS?: string;
}

function isEnabledFlag(value?: string) {
  return value === "1" || value === "true";
}

export function createAppEnv(env: EnvLike): AppEnv {
  return {
    firebaseApiKey: env.VITE_FIREBASE_API_KEY?.trim() ?? "",
    firebaseAuthDomain: env.VITE_FIREBASE_AUTH_DOMAIN?.trim() ?? "",
    firebaseProjectId: env.VITE_FIREBASE_PROJECT_ID?.trim() ?? "",
    firebaseAppId: env.VITE_FIREBASE_APP_ID?.trim() ?? "",
    firebaseFunctionsRegion: env.VITE_FIREBASE_FUNCTIONS_REGION?.trim() || "us-central1",
    firebaseUseEmulators: isEnabledFlag(env.VITE_FIREBASE_USE_EMULATORS),
    isDevelopment: Boolean(env.DEV),
  };
}

export const appEnv = createAppEnv(import.meta.env);

export function hasFirebaseConfiguration() {
  return [
    appEnv.firebaseApiKey,
    appEnv.firebaseAuthDomain,
    appEnv.firebaseProjectId,
    appEnv.firebaseAppId,
  ].every((value) => value.length > 0);
}
