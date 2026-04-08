/* eslint-disable require-jsdoc, max-len */
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import type { CallableRequest } from "firebase-functions/v2/https";
import { GOOGLE_CONTACTS_CREDENTIALS_COLLECTION } from "./googleContactsCredentialRetention.js";

const GOOGLE_CONTACTS_SCOPE = "https://www.googleapis.com/auth/contacts";
const GOOGLE_AUTH_STATE_TTL_MS = 10 * 60 * 1000;
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke";
// Keep this allowlist in sync with the Google Cloud OAuth client configuration.
const GOOGLE_OAUTH_REDIRECT_URIS_BY_ORIGIN = new Map<string, string>([
  ["http://localhost:5173", "http://localhost:5173/auth/google/callback"],
  ["http://127.0.0.1:5173", "http://127.0.0.1:5173/auth/google/callback"],
  ["http://localhost:4173", "http://localhost:4173/auth/google/callback"],
  ["http://127.0.0.1:4173", "http://127.0.0.1:4173/auth/google/callback"],
  ["https://meishi.dev", "https://meishi.dev/auth/google/callback"],
  ["https://www.meishi.dev", "https://www.meishi.dev/auth/google/callback"],
  [
    "https://meishi-492400.web.app",
    "https://meishi-492400.web.app/auth/google/callback",
  ],
  [
    "https://meishi-492400.firebaseapp.com",
    "https://meishi-492400.firebaseapp.com/auth/google/callback",
  ],
]);

const googleOauthClientId = defineSecret("GOOGLE_OAUTH_CLIENT_ID");
const googleOauthClientSecret = defineSecret("GOOGLE_OAUTH_CLIENT_SECRET");

if (getApps().length === 0) {
  initializeApp();
}

const firestore = getFirestore();

interface StoredGoogleCredential {
  refreshToken: string;
  scope: string | null;
  accountEmail?: string;
  connectedAt: string;
}

interface SignedStatePayload {
  uid: string;
  nonce: string;
  issuedAt: number;
}

interface GoogleTokenExchangeResponse {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleAuthState {
  status: "signed_out" | "connected";
  firebaseUid: string | null;
  scope: string | null;
  accountEmail?: string;
  connectedAt: string | null;
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signStatePayload(encodedPayload: string) {
  return createHmac("sha256", googleOauthClientSecret.value())
    .update(encodedPayload)
    .digest("base64url");
}

function assertAuthenticated(uid: string | undefined): string {
  if (!uid) {
    throw new HttpsError(
      "unauthenticated",
      "A Firebase-authenticated session is required.",
    );
  }

  return uid;
}

function getCredentialDocument(uid: string) {
  return firestore.collection(GOOGLE_CONTACTS_CREDENTIALS_COLLECTION).doc(uid);
}

function getRequestOrigin(request: CallableRequest): string | null {
  const rawOrigin = request.rawRequest.headers.origin;
  if (typeof rawOrigin === "string" && rawOrigin.length > 0) {
    return rawOrigin;
  }

  const referer = request.rawRequest.headers.referer;
  if (typeof referer !== "string" || referer.length === 0) {
    return null;
  }

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

function getRedirectUriForRequest(request: CallableRequest): string {
  const origin = getRequestOrigin(request);
  if (!origin) {
    throw new HttpsError(
      "failed-precondition",
      "Unable to determine the caller origin for Google OAuth.",
    );
  }

  const redirectUri = GOOGLE_OAUTH_REDIRECT_URIS_BY_ORIGIN.get(origin);
  if (!redirectUri) {
    throw new HttpsError(
      "permission-denied",
      `Origin ${origin} is not allowed for Google OAuth redirects.`,
    );
  }

  return redirectUri;
}

async function readStoredCredential(
  uid: string,
): Promise<StoredGoogleCredential | null> {
  const snapshot = await getCredentialDocument(uid).get();
  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data();
  if (
    !data ||
    typeof data.refreshToken !== "string" ||
    typeof data.connectedAt !== "string"
  ) {
    throw new HttpsError(
      "internal",
      "Stored Google credential data is malformed.",
    );
  }

  return {
    refreshToken: data.refreshToken,
    scope: typeof data.scope === "string" ? data.scope : null,
    accountEmail:
      typeof data.accountEmail === "string" ? data.accountEmail : undefined,
    connectedAt: data.connectedAt,
  };
}

function buildGoogleAuthState(
  uid: string,
  credential: StoredGoogleCredential | null,
): GoogleAuthState {
  if (!credential) {
    return {
      status: "signed_out",
      firebaseUid: uid,
      scope: null,
      connectedAt: null,
    };
  }

  return {
    status: "connected",
    firebaseUid: uid,
    scope: credential.scope,
    accountEmail: credential.accountEmail,
    connectedAt: credential.connectedAt,
  };
}

function buildSignedState(uid: string) {
  const payload: SignedStatePayload = {
    uid,
    nonce: randomUUID(),
    issuedAt: Date.now(),
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signStatePayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function verifySignedState(rawState: unknown, uid: string): SignedStatePayload {
  if (typeof rawState !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "Google authorization state is missing.",
    );
  }

  const [encodedPayload, signature] = rawState.split(".");
  if (!encodedPayload || !signature) {
    throw new HttpsError(
      "invalid-argument",
      "Google authorization state is malformed.",
    );
  }

  const expectedSignature = signStatePayload(encodedPayload);
  const providedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new HttpsError(
      "permission-denied",
      "Google authorization state could not be verified.",
    );
  }

  const payload = JSON.parse(
    decodeBase64Url(encodedPayload),
  ) as SignedStatePayload;
  if (payload.uid !== uid) {
    throw new HttpsError(
      "permission-denied",
      "Google authorization state does not match the current Firebase user.",
    );
  }

  if (Date.now() - payload.issuedAt > GOOGLE_AUTH_STATE_TTL_MS) {
    throw new HttpsError(
      "deadline-exceeded",
      "Google authorization state expired. Start the connection flow again.",
    );
  }

  return payload;
}

async function exchangeGoogleTokens(params: URLSearchParams) {
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const payload = (await response.json()) as GoogleTokenExchangeResponse;
  if (!response.ok || payload.error) {
    throw new HttpsError(
      "internal",
      payload.error_description ||
        payload.error ||
        "Google token exchange failed.",
    );
  }

  return payload;
}

function readEmailFromIdToken(idToken?: string) {
  if (!idToken) {
    return undefined;
  }

  const segments = idToken.split(".");
  if (segments.length !== 3) {
    return undefined;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(segments[1])) as {
      email?: string;
    };
    return typeof payload.email === "string" ? payload.email : undefined;
  } catch {
    return undefined;
  }
}

function coerceCompletionPayload(data: unknown) {
  if (typeof data !== "object" || data === null) {
    throw new HttpsError(
      "invalid-argument",
      "Google callback payload is missing.",
    );
  }

  const { code, state } = data as { code?: unknown; state?: unknown };
  if (typeof code !== "string" || typeof state !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "Google callback payload is malformed.",
    );
  }

  return { code, state };
}

async function revokeRefreshToken(refreshToken: string) {
  await fetch(GOOGLE_REVOKE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      token: refreshToken,
    }),
  });
}

export const beginGoogleContactsAuth = onCall(
  {
    secrets: [googleOauthClientId, googleOauthClientSecret],
  },
  async (request) => {
    const uid = assertAuthenticated(request.auth?.uid);
    const redirectUri = getRedirectUriForRequest(request);
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.search = new URLSearchParams({
      access_type: "offline",
      client_id: googleOauthClientId.value(),
      include_granted_scopes: "true",
      prompt: "consent",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: GOOGLE_CONTACTS_SCOPE,
      state: buildSignedState(uid),
    }).toString();

    return {
      authUrl: authUrl.toString(),
    };
  },
);

export const completeGoogleContactsAuth = onCall(
  {
    secrets: [googleOauthClientId, googleOauthClientSecret],
  },
  async (request) => {
    const uid = assertAuthenticated(request.auth?.uid);
    const redirectUri = getRedirectUriForRequest(request);
    const { code, state } = coerceCompletionPayload(request.data);
    verifySignedState(state, uid);

    const existingCredential = await readStoredCredential(uid);
    const tokenPayload = await exchangeGoogleTokens(
      new URLSearchParams({
        client_id: googleOauthClientId.value(),
        client_secret: googleOauthClientSecret.value(),
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    );

    const refreshToken =
      tokenPayload.refresh_token || existingCredential?.refreshToken;
    if (!refreshToken) {
      throw new HttpsError(
        "failed-precondition",
        "Google did not return a refresh token for this connection.",
      );
    }

    const connectedAt = new Date().toISOString();
    const scope =
      tokenPayload.scope || existingCredential?.scope || GOOGLE_CONTACTS_SCOPE;
    const accountEmail =
      readEmailFromIdToken(tokenPayload.id_token) ||
      existingCredential?.accountEmail;

    await getCredentialDocument(uid).set({
      refreshToken,
      scope,
      accountEmail: accountEmail || null,
      connectedAt,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      googleAuth: buildGoogleAuthState(uid, {
        refreshToken,
        scope,
        accountEmail,
        connectedAt,
      }),
    };
  },
);

export const getGoogleAuthStatus = onCall(async (request) => {
  const uid = assertAuthenticated(request.auth?.uid);
  const credential = await readStoredCredential(uid);
  return {
    googleAuth: buildGoogleAuthState(uid, credential),
  };
});

export const getGoogleAccessToken = onCall(
  {
    secrets: [googleOauthClientId, googleOauthClientSecret],
  },
  async (request) => {
    const uid = assertAuthenticated(request.auth?.uid);
    const credential = await readStoredCredential(uid);
    if (!credential) {
      throw new HttpsError(
        "failed-precondition",
        "Google Contacts is not connected for the current Firebase session.",
      );
    }

    const payload = await exchangeGoogleTokens(
      new URLSearchParams({
        client_id: googleOauthClientId.value(),
        client_secret: googleOauthClientSecret.value(),
        grant_type: "refresh_token",
        refresh_token: credential.refreshToken,
      }),
    );

    if (!payload.access_token || typeof payload.expires_in !== "number") {
      throw new HttpsError(
        "internal",
        "Google refresh response did not include an access token.",
      );
    }

    return {
      accessToken: payload.access_token,
      expiresIn: payload.expires_in,
      scope: payload.scope || credential.scope || GOOGLE_CONTACTS_SCOPE,
    };
  },
);

export const disconnectGoogleContacts = onCall(
  {
    secrets: [googleOauthClientSecret],
  },
  async (request) => {
    const uid = assertAuthenticated(request.auth?.uid);
    const credential = await readStoredCredential(uid);

    if (credential) {
      await revokeRefreshToken(credential.refreshToken);
      await getCredentialDocument(uid).delete();
    }

    return {
      success: true,
    };
  },
);
