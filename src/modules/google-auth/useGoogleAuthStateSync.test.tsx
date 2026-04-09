// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGoogleAuthStateSync } from "./useGoogleAuthStateSync";
import {
  onboardingReducer,
  setGoogleAuthState,
} from "../onboarding-settings/onboardingSlice";

const initializeGoogleAuthMock = vi.fn();

function createDeferredPromise() {
  let resolvePromise: (value: unknown) => void;
  let rejectPromise: (reason?: unknown) => void;

  const promise = new Promise<unknown>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  return {
    promise,
    resolve: resolvePromise!,
    reject: rejectPromise!,
  };
}

vi.mock("../../app/env", () => ({
  hasFirebaseConfiguration: () => true,
}));

vi.mock("./googleIdentity", () => ({
  initializeGoogleAuth: (...args: unknown[]) =>
    initializeGoogleAuthMock(...args),
}));

function HookHarness() {
  useGoogleAuthStateSync();

  return null;
}

function createStore() {
  return configureStore({
    reducer: {
      onboarding: onboardingReducer,
    },
    preloadedState: {
      onboarding: {
        settings: onboardingReducer(undefined, { type: "noop" }).settings,
        googleAuth: {
          status: "connected",
          firebaseUid: "firebase-uid-1",
          scope: "https://www.googleapis.com/auth/contacts",
          accountEmail: "developer@example.com",
          connectedAt: "2026-04-06T12:34:00.000Z",
        },
      },
    },
  });
}

describe("useGoogleAuthStateSync", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    initializeGoogleAuthMock.mockReset();
    initializeGoogleAuthMock.mockResolvedValue({
      status: "connected",
      firebaseUid: "firebase-uid-1",
      scope: "https://www.googleapis.com/auth/contacts",
      accountEmail: "developer@example.com",
      connectedAt: "2026-04-06T12:34:00.000Z",
    });
  });

  it("initializes Google auth on mount without rerunning for a disconnecting transition", async () => {
    const deferred = createDeferredPromise();
    initializeGoogleAuthMock.mockImplementationOnce(() => deferred.promise);
    const store = createStore();

    render(
      <Provider store={store}>
        <HookHarness />
      </Provider>,
    );

    await waitFor(() => {
      expect(initializeGoogleAuthMock).toHaveBeenCalledTimes(1);
    });

    store.dispatch(
      setGoogleAuthState({
        ...store.getState().onboarding.googleAuth,
        status: "disconnecting",
      }),
    );

    await waitFor(() => {
      expect(store.getState().onboarding.googleAuth.status).toBe(
        "disconnecting",
      );
    });

    deferred.resolve({
      status: "connected",
      firebaseUid: "firebase-uid-1",
      scope: "https://www.googleapis.com/auth/contacts",
      accountEmail: "developer@example.com",
      connectedAt: "2026-04-06T12:34:00.000Z",
    });

    await waitFor(() => {
      expect(store.getState().onboarding.googleAuth.status).toBe(
        "disconnecting",
      );
    });

    expect(initializeGoogleAuthMock).toHaveBeenCalledTimes(1);
  });

  it("initializes Google auth on mount without rerunning for a connecting transition", async () => {
    const deferred = createDeferredPromise();
    initializeGoogleAuthMock.mockImplementationOnce(() => deferred.promise);
    const store = createStore();

    render(
      <Provider store={store}>
        <HookHarness />
      </Provider>,
    );

    await waitFor(() => {
      expect(initializeGoogleAuthMock).toHaveBeenCalledTimes(1);
    });

    store.dispatch(
      setGoogleAuthState({
        ...store.getState().onboarding.googleAuth,
        status: "connecting",
      }),
    );

    await waitFor(() => {
      expect(store.getState().onboarding.googleAuth.status).toBe("connecting");
    });

    deferred.resolve({
      status: "signed_out",
      firebaseUid: "firebase-uid-1",
      scope: null,
      accountEmail: undefined,
      connectedAt: null,
    });

    await waitFor(() => {
      expect(store.getState().onboarding.googleAuth.status).toBe("connecting");
    });

    expect(initializeGoogleAuthMock).toHaveBeenCalledTimes(1);
  });
});
