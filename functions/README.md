# Firebase Functions

This workspace contains the Firebase Cloud Functions code for Meishi.

## Responsibility

- Holds server-side TypeScript entrypoints under `src/`
- Builds deployable output into `lib/`
- Runs its own lint and TypeScript checks before deploy
- Provides the place for secrets-backed or privileged integrations that should
  not live in the browser bundle
- Brokers Google OAuth code exchange, refresh-token storage, access-token minting,
  disconnect/revoke behavior for Google Contacts sync, and scheduled retention
  cleanup for stored Google credentials

The main app is still a browser-first PWA. Add Cloud Functions only for work
that should move off the client, such as secret-bearing API calls, webhook
handlers, or server-side orchestration.

The current Google auth flow uses Functions as a token broker. The browser never
stores the Google OAuth client secret or refresh token.

Stored Google credential documents are also subject to a daily retention
cleanup. The scheduled job deletes `googleContactsCredentials` records whose
`connectedAt` timestamp is more than 90 days old. This is a storage policy for
quota control, not a true check for Google refresh-token expiry.

Firestore is currently server-only in this repo. The browser app does not use
the Firestore Web SDK, and the root
[firestore.rules](/Users/mundanelunacy/Projects/meishi/firestore.rules) file
intentionally denies all client reads and writes. Only Admin SDK access from
Functions is expected to touch `googleContactsCredentials`.

## Workspace layout

- `src/`: authored TypeScript source
- `lib/`: compiled JavaScript output used by Firebase deploy
- `package.json`: functions-only scripts and dependencies
- `.eslintrc.js`: legacy ESLint config for this workspace
- `tsconfig.json`: TypeScript build config
- `tsconfig.dev.json`: local config used by ESLint parser options

## Install

From the repo root:

```bash
npm --prefix functions install
```

## Common commands

Lint:

```bash
npm --prefix functions run lint
```

Build:

```bash
npm --prefix functions run build
```

Start the emulator:

```bash
npm --prefix functions run serve
```

Open the Firebase functions shell:

```bash
npm --prefix functions run shell
```

Deploy only functions:

```bash
npm --prefix functions run deploy
```

View deployed logs:

```bash
npm --prefix functions run logs
```

## Deploy path

When you run `firebase deploy` from the repo root, Firebase reads the functions
target from [firebase.json](/Users/mundanelunacy/Projects/meishi/firebase.json)
and then executes:

1. `npm --prefix "$RESOURCE_DIR" run lint`
2. `npm --prefix "$RESOURCE_DIR" run build`
3. the actual functions deploy

This means a broken lint or TypeScript build in this workspace blocks both the
functions deploy and a combined `firebase deploy`.

## ESLint note

This workspace still uses a legacy ESLint config in `.eslintrc.js`, while the
repo root uses flat config in
[eslint.config.js](/Users/mundanelunacy/Projects/meishi/eslint.config.js).

Because of that split, the `lint` script in
[functions/package.json](/Users/mundanelunacy/Projects/meishi/functions/package.json)
explicitly sets:

```bash
ESLINT_USE_FLAT_CONFIG=false
```

That forces ESLint to use the functions-local legacy config during Firebase
predeploy. If that environment variable is removed, Firebase deploy may fail
with an error like `Invalid option '--ext'` because the legacy CLI flags would
be interpreted in flat-config mode.

## Adding a new function

1. Add the handler in `src/index.ts` or split it into a local module and export
   it from `src/index.ts`
2. Run:

```bash
npm --prefix functions run lint
npm --prefix functions run build
```

3. Test with the emulator before deploying if the function has runtime
   behavior worth validating
4. Deploy with:

```bash
firebase deploy --only functions
```

The current exported Google auth handlers are:

- `beginGoogleContactsAuth`
- `completeGoogleContactsAuth`
- `getGoogleAuthStatus`
- `getGoogleAccessToken`
- `disconnectGoogleContacts`
- `cleanupGoogleContactsCredentials`

## Config guidance

- Keep browser-only env vars in the root Vite env files; those are compiled into
  Hosting output
- Keep server-only secrets out of `VITE_*` variables and out of browser code
- Prefer putting privileged credentials, API keys, and any sensitive
  orchestration behind Functions instead of exposing them to the client
- Treat Firestore as part of that privileged backend boundary unless the app
  explicitly adds a reviewed browser-side use case and corresponding rules
- Current Google auth secrets expected by this workspace:
  - `GOOGLE_OAUTH_CLIENT_ID`
  - `GOOGLE_OAUTH_CLIENT_SECRET`
- Google OAuth redirect URIs are selected from the code allowlist in
  [functions/src/googleContactsAuth.ts](/Users/mundanelunacy/Projects/meishi/functions/src/googleContactsAuth.ts)
  based on the caller origin, not from Secret Manager or env vars

## Troubleshooting

- Lint failure:
  run `npm --prefix functions run lint` directly
- TypeScript build failure:
  run `npm --prefix functions run build`
- Emulator startup issue:
  confirm you ran `npm --prefix functions install`
- `Invalid option '--ext'` from ESLint:
  confirm the lint script still sets `ESLINT_USE_FLAT_CONFIG=false`
