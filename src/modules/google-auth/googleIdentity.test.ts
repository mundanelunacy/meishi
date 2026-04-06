// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

const firebaseAuth = {
  currentUser: {
    uid: "firebase-uid-1",
  },
};

const signInAnonymouslyMock = vi.fn(async () => ({
  user: {
    uid: "firebase-uid-1",
  },
}));

const signOutMock = vi.fn(async () => undefined);

const callableMocks = {
  beginGoogleContactsAuth: vi.fn(),
  completeGoogleContactsAuth: vi.fn(),
  disconnectGoogleContacts: vi.fn(),
  getGoogleAccessToken: vi.fn(),
  getGoogleAuthStatus: vi.fn(),
};

vi.mock("../../app/env", () => ({
  hasFirebaseConfiguration: () => true,
}));

vi.mock("../../app/firebase", () => ({
  getFirebaseAuth: () => firebaseAuth,
  getFirebaseFunctions: () => ({}),
}));

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn(
    (
      auth: typeof firebaseAuth,
      callback: (user: typeof auth.currentUser) => void,
    ) => {
      callback(auth.currentUser);
      return () => undefined;
    },
  ),
  signInAnonymously: signInAnonymouslyMock,
  signOut: signOutMock,
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn(
    (_functions: unknown, name: keyof typeof callableMocks) =>
      callableMocks[name],
  ),
}));

describe("googleIdentity", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    firebaseAuth.currentUser = {
      uid: "firebase-uid-1",
    };
  });

  it("creates a signed-out initial state from lightweight metadata", async () => {
    const { createInitialGoogleAuthState } = await import("./googleIdentity");

    expect(
      createInitialGoogleAuthState({
        scope: "https://www.googleapis.com/auth/contacts",
        accountEmail: "developer@example.com",
        connectedAt: "2026-04-06T00:00:00.000Z",
      }),
    ).toEqual({
      status: "connecting",
      firebaseUid: null,
      scope: "https://www.googleapis.com/auth/contacts",
      accountEmail: "developer@example.com",
      connectedAt: "2026-04-06T00:00:00.000Z",
    });
  });

  it("initializes auth state from the backend status for the current Firebase user", async () => {
    callableMocks.getGoogleAuthStatus.mockResolvedValue({
      data: {
        googleAuth: {
          status: "connected",
          firebaseUid: "firebase-uid-1",
          scope: "https://www.googleapis.com/auth/contacts",
          accountEmail: "developer@example.com",
          connectedAt: "2026-04-06T00:00:00.000Z",
        },
      },
    });

    const { initializeGoogleAuth } = await import("./googleIdentity");
    const state = await initializeGoogleAuth();

    expect(state).toEqual({
      status: "connected",
      firebaseUid: "firebase-uid-1",
      scope: "https://www.googleapis.com/auth/contacts",
      accountEmail: "developer@example.com",
      connectedAt: "2026-04-06T00:00:00.000Z",
    });
    expect(signInAnonymouslyMock).not.toHaveBeenCalled();
  });

  it("caches short-lived Google access tokens in memory", async () => {
    callableMocks.getGoogleAccessToken.mockResolvedValue({
      data: {
        accessToken: "fresh-google-token",
        expiresIn: 3600,
      },
    });

    const { getValidGoogleAccessToken } = await import("./googleIdentity");

    await expect(getValidGoogleAccessToken()).resolves.toBe(
      "fresh-google-token",
    );
    await expect(getValidGoogleAccessToken()).resolves.toBe(
      "fresh-google-token",
    );
    expect(callableMocks.getGoogleAccessToken).toHaveBeenCalledTimes(1);
  });

  it("surfaces a popup-blocked error when Google authorization cannot open", async () => {
    callableMocks.beginGoogleContactsAuth.mockResolvedValue({
      data: {
        authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      },
    });
    vi.spyOn(window, "open").mockReturnValue(null);

    const { connectGoogleContacts } = await import("./googleIdentity");

    await expect(connectGoogleContacts()).rejects.toThrow(
      "Google authorization popup was blocked by the browser.",
    );
  });
});
