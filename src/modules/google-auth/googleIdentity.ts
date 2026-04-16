import {
  onAuthStateChanged,
  signInAnonymously,
  signOut,
  type User,
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { hasFirebaseConfiguration } from "../../app/env";
import { getFirebaseAuth, getFirebaseFunctions } from "../../app/firebase";
import type { GoogleAuthState } from "../../shared/types/models";
import { createInitialGoogleAuthState } from "./googleAuthState";

const GOOGLE_SCOPE = "https://www.googleapis.com/auth/contacts";
const POPUP_MESSAGE_TYPE = "meishi:google-auth-result";
const POPUP_NAME = "meishi-google-auth";
const POPUP_WIDTH = 520;
const POPUP_HEIGHT = 720;
const TOKEN_REFRESH_SKEW_MS = 5 * 60 * 1000;

interface BeginGoogleContactsAuthResponse {
  authUrl: string;
}

interface CompleteGoogleContactsAuthRequest {
  code: string;
  state: string;
}

interface GoogleAuthStatusResponse {
  googleAuth: GoogleAuthState;
}

interface GoogleAccessTokenResponse {
  accessToken: string;
  expiresIn: number;
}

interface PopupMessageSuccessPayload {
  type: typeof POPUP_MESSAGE_TYPE;
  status: "success";
  googleAuth: GoogleAuthState;
}

interface PopupMessageErrorPayload {
  type: typeof POPUP_MESSAGE_TYPE;
  status: "error";
  error: string;
}

type GoogleAuthPopupMessage =
  | PopupMessageSuccessPayload
  | PopupMessageErrorPayload;

let authBootstrapPromise: Promise<User> | null = null;
let googleAccessTokenCache: { value: string; expiresAt: number } | null = null;
const RECOVERABLE_GOOGLE_AUTH_MESSAGE_PATTERNS = [
  /token has been expired or revoked/i,
  /invalid_grant/i,
  /invalid authentication credentials/i,
  /google contacts is not connected for the current firebase session/i,
] as const;

export function getGoogleScope() {
  return GOOGLE_SCOPE;
}

function createPopupFeatures() {
  const left =
    typeof window === "undefined"
      ? 0
      : window.screenX + (window.outerWidth - POPUP_WIDTH) / 2;
  const top =
    typeof window === "undefined"
      ? 0
      : window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2;

  return [
    `width=${POPUP_WIDTH}`,
    `height=${POPUP_HEIGHT}`,
    `left=${Math.max(left, 0)}`,
    `top=${Math.max(top, 0)}`,
    "popup=yes",
    "resizable=yes",
    "scrollbars=yes",
  ].join(",");
}

async function waitForInitialAuthState() {
  const auth = getFirebaseAuth();

  if (auth.currentUser) {
    return auth.currentUser;
  }

  return new Promise<User | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

async function ensureFirebaseUser() {
  if (!hasFirebaseConfiguration()) {
    throw new Error(
      "Firebase is not configured. Add the VITE_FIREBASE_* values before connecting Google Contacts.",
    );
  }

  if (!authBootstrapPromise) {
    authBootstrapPromise = (async () => {
      const existingUser = await waitForInitialAuthState();
      if (existingUser) {
        return existingUser;
      }

      const credential = await signInAnonymously(getFirebaseAuth());
      return credential.user;
    })().finally(() => {
      authBootstrapPromise = null;
    });
  }

  return authBootstrapPromise;
}

function getGoogleAuthStatusCallable() {
  return httpsCallable<undefined, GoogleAuthStatusResponse>(
    getFirebaseFunctions(),
    "getGoogleAuthStatus",
  );
}

function normalizeGoogleAuthState(
  state: GoogleAuthState,
  firebaseUid: string,
): GoogleAuthState {
  return {
    ...state,
    firebaseUid: state.firebaseUid ?? firebaseUid,
    scope: state.scope ?? null,
    connectedAt: state.connectedAt ?? null,
  };
}

export async function initializeGoogleAuth() {
  const user = await ensureFirebaseUser();

  try {
    const result = await getGoogleAuthStatusCallable()();
    return normalizeGoogleAuthState(result.data.googleAuth, user.uid);
  } catch {
    return createInitialGoogleAuthState({
      firebaseUid: user.uid,
      connectedAt: null,
      scope: null,
    });
  }
}

function postPopupMessage(message: GoogleAuthPopupMessage) {
  if (typeof window === "undefined" || !window.opener) {
    return;
  }

  window.opener.postMessage(message, window.location.origin);
}

function waitForPopupResult(popup: Window, firebaseUid: string) {
  return new Promise<GoogleAuthState>((resolve, reject) => {
    const interval = window.setInterval(() => {
      if (!popup.closed) {
        return;
      }

      cleanup();
      reject(
        new Error("Google authorization was cancelled before it completed."),
      );
    }, 250);

    function cleanup() {
      window.clearInterval(interval);
      window.removeEventListener("message", handleMessage);
    }

    function handleMessage(event: MessageEvent<GoogleAuthPopupMessage>) {
      if (
        event.origin !== window.location.origin ||
        event.data?.type !== POPUP_MESSAGE_TYPE
      ) {
        return;
      }

      cleanup();
      if (event.data.status === "error") {
        reject(new Error(event.data.error));
        return;
      }

      resolve(normalizeGoogleAuthState(event.data.googleAuth, firebaseUid));
    }

    window.addEventListener("message", handleMessage);
  });
}

export async function connectGoogleContacts() {
  const user = await ensureFirebaseUser();
  const beginGoogleContactsAuth = httpsCallable<
    undefined,
    BeginGoogleContactsAuthResponse
  >(getFirebaseFunctions(), "beginGoogleContactsAuth");
  const { data } = await beginGoogleContactsAuth();
  const popup = window.open(data.authUrl, POPUP_NAME, createPopupFeatures());

  if (!popup) {
    throw new Error("Google authorization popup was blocked by the browser.");
  }

  popup.focus();
  const nextGoogleAuth = await waitForPopupResult(popup, user.uid);
  invalidateGoogleAccessTokenCache();
  return nextGoogleAuth;
}

export async function completeGoogleContactsAuthCallback(
  payload: CompleteGoogleContactsAuthRequest,
) {
  const user = await ensureFirebaseUser();
  const completeGoogleContactsAuth = httpsCallable<
    CompleteGoogleContactsAuthRequest,
    GoogleAuthStatusResponse
  >(getFirebaseFunctions(), "completeGoogleContactsAuth");
  const result = await completeGoogleContactsAuth(payload);
  return normalizeGoogleAuthState(result.data.googleAuth, user.uid);
}

export async function getGoogleAuthStatus() {
  const user = await ensureFirebaseUser();
  const result = await getGoogleAuthStatusCallable()();
  return normalizeGoogleAuthState(result.data.googleAuth, user.uid);
}

export function invalidateGoogleAccessTokenCache() {
  googleAccessTokenCache = null;
}

function findNestedErrorMessage(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = findNestedErrorMessage(item);
      if (nested) {
        return nested;
      }
    }

    return null;
  }

  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;

  for (const key of ["message", "error_description", "statusText"]) {
    const nested = findNestedErrorMessage(record[key]);
    if (nested) {
      return nested;
    }
  }

  for (const key of ["error", "data", "details"]) {
    const nested = findNestedErrorMessage(record[key]);
    if (nested) {
      return nested;
    }
  }

  return null;
}

export function shouldReconnectGoogleContacts(error: unknown) {
  const message = findNestedErrorMessage(error);
  if (!message) {
    return false;
  }

  return RECOVERABLE_GOOGLE_AUTH_MESSAGE_PATTERNS.some((pattern) =>
    pattern.test(message),
  );
}

export async function getValidGoogleAccessToken() {
  if (
    googleAccessTokenCache &&
    googleAccessTokenCache.expiresAt > Date.now() + TOKEN_REFRESH_SKEW_MS
  ) {
    return googleAccessTokenCache.value;
  }

  await ensureFirebaseUser();
  const getGoogleAccessTokenCallable = httpsCallable<
    undefined,
    GoogleAccessTokenResponse
  >(getFirebaseFunctions(), "getGoogleAccessToken");
  const result = await getGoogleAccessTokenCallable();
  const expiresAt = Date.now() + result.data.expiresIn * 1000;

  googleAccessTokenCache = {
    value: result.data.accessToken,
    expiresAt,
  };

  return result.data.accessToken;
}

export async function disconnectGoogleContacts() {
  await ensureFirebaseUser();
  const disconnectGoogleContactsCallable = httpsCallable<
    undefined,
    { success: boolean }
  >(getFirebaseFunctions(), "disconnectGoogleContacts");
  await disconnectGoogleContactsCallable();
  invalidateGoogleAccessTokenCache();
  await signOut(getFirebaseAuth());
}

export { createInitialGoogleAuthState, POPUP_MESSAGE_TYPE, postPopupMessage };
