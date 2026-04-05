// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import type { AppEnv } from "../../app/env";
import { createGoogleAuthClient } from "./googleIdentity";

interface TokenClientConfig {
  callback: (response: {
    access_token: string;
    expires_in: number;
    scope: string;
  }) => void;
}

function createEnv(overrides: Partial<AppEnv>): AppEnv {
  return {
    googleClientId: "",
    googleAuthMode: "mock",
    isDevelopment: true,
    ...overrides,
  };
}

describe("googleIdentity", () => {
  it("returns a local testing session for mock auth", async () => {
    const client = createGoogleAuthClient(
      createEnv({
        googleAuthMode: "mock",
      })
    );

    expect(client.mode).toBe("mock");
    expect(client.isConfigured()).toBe(true);

    const token = await client.requestAccessToken();

    expect(token.mode).toBe("mock");
    expect(token.accessToken).toContain("mock-google-token-");
    expect(token.scope).toBe(client.getScope());
    expect(token.accountHint).toBe("developer@local.test");
  });

  it("requests a real GIS token when real auth is configured", async () => {
    const requestAccessToken = vi.fn((options?: { prompt?: string; hint?: string }) => {
      const config = (window as Window & typeof globalThis & {
        __callback: TokenClientConfig["callback"];
      }).__callback;
      config({
        access_token: "real-token",
        expires_in: 1800,
        scope: "https://www.googleapis.com/auth/contacts",
      });
      expect(options).toEqual({
        prompt: "consent",
        hint: "user@example.com",
      });
    });

    Object.assign(window, {
      google: {
        accounts: {
          oauth2: {
            initTokenClient: vi.fn((config: TokenClientConfig) => {
              Object.assign(window, { __callback: config.callback });
              return {
                requestAccessToken,
              };
            }),
            revoke: vi.fn(),
          },
        },
      },
    });

    const client = createGoogleAuthClient(
      createEnv({
        googleAuthMode: "real",
        googleClientId: "client-id",
      })
    );

    const token = await client.requestAccessToken({
      prompt: "consent",
      hint: "user@example.com",
    });

    expect(token).toMatchObject({
      mode: "real",
      accessToken: "real-token",
      scope: "https://www.googleapis.com/auth/contacts",
      accountHint: "user@example.com",
    });
    expect(token.expiresAt).toBeGreaterThan(Date.now());
    expect(requestAccessToken).toHaveBeenCalledTimes(1);
  });
});
