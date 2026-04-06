import { describe, expect, it } from "vitest";
import { createAppEnv } from "./env";

describe("env", () => {
  it("builds the app env object from Vite-style input", () => {
    expect(
      createAppEnv({
        DEV: true,
        VITE_FIREBASE_API_KEY: "api-key",
        VITE_FIREBASE_AUTH_DOMAIN: "meishi.firebaseapp.com",
        VITE_FIREBASE_PROJECT_ID: "meishi",
        VITE_FIREBASE_APP_ID: "app-id",
        VITE_FIREBASE_FUNCTIONS_REGION: "asia-northeast3",
        VITE_FIREBASE_USE_EMULATORS: "true",
      })
    ).toEqual({
      firebaseApiKey: "api-key",
      firebaseAuthDomain: "meishi.firebaseapp.com",
      firebaseProjectId: "meishi",
      firebaseAppId: "app-id",
      firebaseFunctionsRegion: "asia-northeast3",
      firebaseUseEmulators: true,
      isDevelopment: true,
    });
  });

  it("defaults the functions region and emulator flag", () => {
    expect(
      createAppEnv({
        DEV: false,
      })
    ).toEqual({
      firebaseApiKey: "",
      firebaseAuthDomain: "",
      firebaseProjectId: "",
      firebaseAppId: "",
      firebaseFunctionsRegion: "us-central1",
      firebaseUseEmulators: false,
      isDevelopment: false,
    });
  });
});
