# Local Development

This guide describes how to run Meishi locally, which services matter for each workflow, and which parts of the stack are still live external dependencies.

## What Runs Where

- Browser app: Vite dev server from the repo root
- Firebase auth/session layer: Firebase Auth emulator when `VITE_FIREBASE_USE_EMULATORS=true`
- Firebase token broker: Firebase Functions emulator when `VITE_FIREBASE_USE_EMULATORS=true`
- Google refresh-token storage for local auth testing: Firestore emulator when using the local Functions broker
- LLM extraction: live OpenAI or Anthropic from the browser
- Google OAuth / Google People API: live Google services even during local development

## Prerequisites

- Node installed
- Firebase CLI installed
- A Firebase project selected locally with `firebase use <project-id>`
- Valid Google OAuth client credentials if you want to test real Google connect/sync

Install dependencies once:

```bash
npm install
npm --prefix functions install
```

## Environment Setup

Start from [.env.example](./.env.example).

The browser app expects these `VITE_*` variables:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_FUNCTIONS_REGION=us-central1
VITE_FIREBASE_USE_EMULATORS=false
```

Recommended local setup:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_FUNCTIONS_REGION=us-central1
VITE_FIREBASE_USE_EMULATORS=true
```

Notes:

- `VITE_*` values are compiled into the browser app. Restart `npm run dev` after changing them.
- The browser connects to the Auth emulator on `:9099` and the Functions emulator on `:5001` when `VITE_FIREBASE_USE_EMULATORS=true`.
- There is no browser-side Firestore usage, but the local Functions broker stores Google refresh-token records in Firestore, so Firestore should be running for end-to-end local auth tests.

## Services You Need

### 1. UI-only work

Use this when you are working on layout, navigation, local draft flows, or pure frontend logic and do not need real Google auth or sync.

Start:

```bash
npm run dev
```

Usually enough for:

- shell and route work
- capture UI
- review UI
- local IndexedDB and localStorage behavior
- extraction UI if you supply a real BYOK key in the app

### 2. Full local app with Firebase-backed Google auth

Use this when you need to exercise:

- anonymous Firebase session bootstrap
- Google connect / reconnect
- backend token refresh
- Google contact creation / photo upload

Start the browser app:

```bash
npm run dev
```

Start Firebase emulators in a separate terminal:

```bash
firebase emulators:start --only auth,firestore,functions
```

Why these three:

- `auth`: required because the browser creates an anonymous Firebase user
- `functions`: required because Google token brokering happens through callable Functions
- `firestore`: required because the local Functions broker stores Google refresh-token metadata there

Important:

- `npm --prefix functions run serve` starts only the Functions emulator. That is not enough for the current end-to-end auth flow because the browser also expects the Auth emulator, and the local token broker expects Firestore for stored Google credentials.
- Google OAuth and Google People API are still live external services. Emulators do not replace them.

## Google Auth Setup For Local Testing

If you want to test real Google connect/sync locally, configure the Functions secrets used by the token broker:

- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`

Redirect URIs are not read from Secret Manager or env vars anymore. They are selected from the allowlist in [functions/src/googleContactsAuth.ts](./functions/src/googleContactsAuth.ts) based on the caller origin.

The current allowlist includes these callback URLs:

```text
http://localhost:5173/auth/google/callback
http://127.0.0.1:5173/auth/google/callback
http://localhost:4173/auth/google/callback
http://127.0.0.1:4173/auth/google/callback
https://meishi.dev/auth/google/callback
https://www.meishi.dev/auth/google/callback
https://meishi-492400.web.app/auth/google/callback
https://meishi-492400.firebaseapp.com/auth/google/callback
```

Add the URLs you need to the Google OAuth client in Google Cloud Console, and keep the code allowlist in sync with that set. If you run the app from a different origin, add it in both places.

Local auth flow summary:

1. The browser signs in anonymously to Firebase.
2. The browser calls the local Functions emulator to get a Google OAuth URL.
3. Google redirects back to `/auth/google/callback` in the local Vite app.
4. The callback page calls the local Functions emulator to exchange the code.
5. The Functions emulator stores refresh-token metadata in Firestore.
6. Later Google People API requests ask the local Functions broker for a fresh access token.

## Common Workflows

### Run the app for normal frontend work

```bash
npm run dev
```

### Run the full auth/sync stack locally

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
firebase emulators:start --only auth,firestore,functions
```

### Run tests

```bash
npm run test
```

Watch mode:

```bash
npm run test:watch
```

### Typecheck and lint

```bash
npm run typecheck
npm run lint
npm --prefix functions run lint
npm --prefix functions run build
```

### Verify the production-style PWA locally

Use this for service worker, install, update, and offline-shell testing:

```bash
npm run build
npm run preview
```

`npm run dev` is not the authoritative PWA verification path in this repo.

## Usage Guides

### Frontend-only feature work

- Start only `npm run dev`
- Use mocked tests first: `npm run test`
- Use `npm run typecheck` before widening scope
- If the change touches browser persistence, inspect `localStorage` and IndexedDB in Chrome DevTools

### Google auth debugging

- Start `npm run dev`
- Start `firebase emulators:start --only auth,firestore,functions`
- Confirm `VITE_FIREBASE_USE_EMULATORS=true`
- Connect Google from the onboarding or settings screen
- If connect fails, check:
  - browser console
  - Functions emulator logs
  - Firestore emulator data for `googleContactsCredentials/{uid}`
  - whether the redirect URI exactly matches the local callback URL

### Google sync debugging

Follow the pipeline in order:

1. confirm Google auth connects successfully
2. confirm the Functions broker can mint an access token
3. confirm `people.createContact` succeeds
4. confirm contact photo upload succeeds

If sync fails:

- inspect the browser network tab for Google People API responses
- inspect the Functions emulator logs for token-broker failures
- confirm the browser is calling emulators, not deployed Firebase services

### LLM extraction debugging

- No local LLM service exists in this repo
- Enter a real OpenAI or Anthropic key in the app
- Prefer MSW/Vitest for request-shape or error-handling work
- Prefer browser testing when debugging image handling or real form timing

## Troubleshooting

### “Firebase is not configured”

The browser is missing one or more required `VITE_FIREBASE_*` values. Check your env file and restart Vite.

### Google connect opens but callback fails

Most likely causes:

- redirect URI mismatch
- Functions emulator not running
- Auth emulator not running
- Firestore emulator not running

### Google connect works, but later sync says Google is not connected

The token broker likely could not read the stored credential record. Check:

- Firestore emulator is running
- the credential document exists
- the browser is still using the same anonymous Firebase user session

### `npm --prefix functions run serve` is running, but auth still fails

That script starts only the Functions emulator. For the current local auth flow, use:

```bash
firebase emulators:start --only auth,firestore,functions
```

### PWA behavior differs between `dev` and `preview`

That is expected. Validate install/offline/update behavior with:

```bash
npm run build
npm run preview
```

## Current Limits

- There is no mock Google auth path anymore.
- Local end-to-end Google auth still depends on live Google OAuth and live Google People API.
- LLM extraction remains browser-side BYOK and does not use Firebase Functions.
