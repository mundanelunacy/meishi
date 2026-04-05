import { describe, expect, it } from "vitest";
import { createAppEnv, resolveGoogleAuthMode } from "./env";

describe("env", () => {
  it("uses an explicit Google auth mode when provided", () => {
    expect(
      resolveGoogleAuthMode({
        googleClientId: "",
        explicitMode: "real",
        isDevelopment: true,
      })
    ).toBe("real");
    expect(
      resolveGoogleAuthMode({
        googleClientId: "client-id",
        explicitMode: "mock",
        isDevelopment: false,
      })
    ).toBe("mock");
  });

  it("falls back to mock auth in development when no client id is present", () => {
    expect(
      resolveGoogleAuthMode({
        googleClientId: "",
        isDevelopment: true,
      })
    ).toBe("mock");
  });

  it("falls back to real auth outside that development case", () => {
    expect(
      resolveGoogleAuthMode({
        googleClientId: "client-id",
        isDevelopment: true,
      })
    ).toBe("real");
    expect(
      resolveGoogleAuthMode({
        googleClientId: "",
        isDevelopment: false,
      })
    ).toBe("real");
  });

  it("builds the app env object from Vite-style input", () => {
    expect(
      createAppEnv({
        DEV: true,
        VITE_GOOGLE_CLIENT_ID: "client-id",
      })
    ).toEqual({
      googleClientId: "client-id",
      googleAuthMode: "real",
      isDevelopment: true,
    });
  });
});
