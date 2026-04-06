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

type GoogleAuthPopupMessage = PopupMessageSuccessPayload | PopupMessageErrorPayload;

let authBootstrapPromise: Promise<User> | null = null;
let googleAccessTokenCache: { value: string; expiresAt: number } | null = null;

export function getGoogleScope() {
  return GOOGLE_SCOPE;
}

export function createInitialGoogleAuthState(
  metadata?: Partial<Pick<GoogleAuthState, "firebaseUid" | "scope" | "accountEmail" | "connectedAt">>
): GoogleAuthState {
  return {
    status:
      metadata?.scope || metadata?.accountEmail || metadata?.connectedAt ? "connecting" : "signed_out",
    firebaseUid: metadata?.firebaseUid ?? null,
    scope: metadata?.scope ?? null,
    accountEmail: metadata?.accountEmail,
    connectedAt: metadata?.connectedAt ?? null,
  };
}

function createPopupFeatures() {
  const left = typeof window === "undefined" ? 0 : window.screenX + (window.outerWidth - POPUP_WIDTH) / 2;
  const top = typeof window === "undefined" ? 0 : window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2;

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
      "Firebase is not configured. Add the VITE_FIREBASE_* values before connecting Google Contacts."
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
  return httpsCallable<undefined, GoogleAuthStatusResponse>(getFirebaseFunctions(), "getGoogleAuthStatus");
}

function normalizeGoogleAuthState(state: GoogleAuthState, firebaseUid: string): GoogleAuthState {
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
      reject(new Error("Google authorization was cancelled before it completed."));
    }, 250);

    function cleanup() {
      window.clearInterval(interval);
      window.removeEventListener("message", handleMessage);
    }

    function handleMessage(event: MessageEvent<GoogleAuthPopupMessage>) {
      if (event.origin !== window.location.origin || event.data?.type !== POPUP_MESSAGE_TYPE) {
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
  const beginGoogleContactsAuth = httpsCallable<undefined, BeginGoogleContactsAuthResponse>(
    getFirebaseFunctions(),
    "beginGoogleContactsAuth"
  );
  const { data } = await beginGoogleContactsAuth();
  const popup = window.open(data.authUrl, POPUP_NAME, createPopupFeatures());

  if (!popup) {
    throw new Error("Google authorization popup was blocked by the browser.");
  }

  popup.focus();
  return waitForPopupResult(popup, user.uid);
}

export async function completeGoogleContactsAuthCallback(payload: CompleteGoogleContactsAuthRequest) {
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

export async function getValidGoogleAccessToken() {
  if (googleAccessTokenCache && googleAccessTokenCache.expiresAt > Date.now() + TOKEN_REFRESH_SKEW_MS) {
    return googleAccessTokenCache.value;
  }

  await ensureFirebaseUser();
  const getGoogleAccessTokenCallable = httpsCallable<undefined, GoogleAccessTokenResponse>(
    getFirebaseFunctions(),
    "getGoogleAccessToken"
  );
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
  const disconnectGoogleContactsCallable = httpsCallable<undefined, { success: boolean }>(
    getFirebaseFunctions(),
    "disconnectGoogleContacts"
  );
  await disconnectGoogleContactsCallable();
  invalidateGoogleAccessTokenCache();
  await signOut(getFirebaseAuth());
}

export { POPUP_MESSAGE_TYPE, postPopupMessage };
