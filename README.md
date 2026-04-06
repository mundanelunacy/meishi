# Meishi

Meishi is a TypeScript-only React/Vite PWA for scanning business cards, extracting structured contact data with an LLM, verifying the result in-app, exporting a vCard, and syncing the verified contact to Google Contacts.

## Product flow

1. On first load, the user selects OpenAI or Anthropic, stores the provider-specific BYOK key locally in the browser, and can tune one shared advanced extraction prompt.
2. The user captures one or more business-card images from a mobile camera or image library.
3. The app sends those images to the configured LLM using structured-output mode, validates the response, and builds a local contact draft with a persisted extraction snapshot.
4. The review screen shows source images in the top section and an editable contact form in the lower section. The form covers Google-Contacts-style name/company fields such as prefix, phonetic name parts, nickname, file-as, and department, and expands to repeatable collections such as multiple emails, phone numbers, addresses, websites, related people, significant dates, and custom fields. Draft edits autosave locally for recovery after refresh.
5. From review, the user can save a `.vcf` vCard locally or choose to sync the verified contact to Google Contacts.
6. If the user chooses Google sync while signed out, the browser first establishes an anonymous Firebase Auth session, then completes a popup-based Google OAuth code flow whose refresh token is stored server-side.
7. An optional `?debug=1` review mode shows the raw extraction snapshot, a derived vCard preview, and the Google People API payload derived from the current reviewed form values.
8. Saving to Google creates a contact and uploads one selected image as the Google contact photo.
9. Additional captured images remain local in IndexedDB because Google Contacts does not support arbitrary multi-image business-card attachments.

## Stack

- React 18 + Vite 5
- TypeScript only
- TanStack Router file-based routes
- Redux Toolkit + RTK Query
- Tailwind CSS with shadcn-style UI primitives
- Dexie for IndexedDB persistence
- `vite-plugin-pwa` for manifest and service worker wiring
- Vitest + Testing Library + MSW for focused verification

## Architecture

### `src/modules/app-shell`
- Top-level frame, navigation, route shell, app readiness display, and PWA update affordances.

### `src/modules/onboarding-settings`
- First-run flow, provider selection, API key entry, readiness selectors, and settings management.

### `src/modules/google-auth`
- Firebase-backed Google auth client boundary for anonymous Firebase identity, popup OAuth connect, and on-demand access-token retrieval.

### `src/modules/card-capture`
- Camera and file-library capture flows plus image normalization hooks.

### `src/modules/card-extraction`
- LLM provider abstraction, OpenAI and Anthropic structured-output extraction, response parsing, and schema validation.

### `src/modules/contact-review`
- Editable review form, source-image pairing, dynamic repeatable field editing, developer debug preview, and verified-contact finalization.

### `src/modules/google-contacts`
- Google People API contact creation, contact photo upload, and sync result tracking.

### `src/modules/vcard-export`
- Browser-side vCard serialization and `.vcf` download handling.

### `src/modules/local-data`
- Browser persistence boundaries for `localStorage` and IndexedDB, including draft recovery and append-only sync history.

### `src/modules/pwa-runtime`
- PWA lifecycle hooks, install prompting, prompt-based updates, and explicit offline-runtime messaging.

## Data boundaries

- `localStorage`
  - LLM provider choice
  - provider-specific API keys
  - preferred OpenAI and Anthropic models
  - shared advanced extraction prompt
  - limited Google auth metadata such as scope, connected account email, and connection timestamp, but not Google bearer tokens
- IndexedDB
  - captured images
  - active capture session
  - latest draft with autosaved review edits and persisted extraction snapshot
  - append-only sync history
- In-memory Redux state
  - current Google connection status and Firebase UID
  - active draft edit state
  - sync session status

## Security posture

This scaffold still uses a browser-side BYOK model for LLM providers. That is acceptable for a trusted prototype, but not for a production multi-user app. User-entered LLM API keys are stored client-side, and provider requests originate from the browser.

Google Contacts auth no longer uses a browser-only token flow. Firebase Functions now act as the token broker for Google OAuth code exchange, refresh-token storage, short-lived access-token refresh, and daily retention cleanup of stored backend credentials. LLM key handling remains client-side and should still be revisited before rollout.

## External API references

- Google OAuth and Firebase:
  - [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
  - [Firebase Auth for Web](https://firebase.google.com/docs/auth/web/start)
  - [Callable Functions](https://firebase.google.com/docs/functions/callable)
- Google People API:
  - [people.createContact](https://developers.google.com/people/api/rest/v1/people/createContact)
  - [people.updateContactPhoto](https://developers.google.com/people/api/rest/v1/people/updateContactPhoto)
- OpenAI:
  - [Images and vision](https://platform.openai.com/docs/guides/images-vision)
  - [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
  - [Best Practices for API Key Safety](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety)

## Development

```bash
npm install
npm run dev
```

## Firebase deployment

This repo can be deployed with Firebase Hosting for the Vite-built SPA and
Cloud Functions for server-side endpoints that should not run in the browser.

- Hosting serves the built app from `dist`
- Functions are built from `functions/src` into `functions/lib`
- `firebase deploy` runs both the functions predeploy checks and the hosting
  deploy defined in [firebase.json](./firebase.json)

### Project files

- [firebase.json](./firebase.json):
  deploy targets, hosting rewrite, and functions predeploy commands
- [.firebaserc](./.firebaserc):
  default Firebase project alias
- [firestore.rules](./firestore.rules):
  prototype Firestore Security Rules that deny all browser access because
  Firestore is server-only in the current architecture
- [functions/package.json](./functions/package.json):
  functions-specific build, lint, emulator, and deploy scripts
- [functions/README.md](./functions/README.md):
  detailed functions workspace notes

### One-time setup

1. Install dependencies in both workspaces:

```bash
npm install
npm --prefix functions install
```

2. Install the Firebase CLI if needed:

```bash
npm install -g firebase-tools
```

3. Authenticate and confirm the active project:

```bash
firebase login
firebase use meishi-492400
```

### Local workflow

Build and verify the browser app:

```bash
npm run build
```

Build and verify the functions workspace:

```bash
npm --prefix functions run lint
npm --prefix functions run build
```

Run the functions emulator from the functions workspace:

```bash
npm --prefix functions run serve
```

Deploy both Hosting and Functions:

```bash
firebase deploy
```

Deploy only one target when iterating:

```bash
firebase deploy --only hosting
firebase deploy --only functions
```

### Hosting behavior

- Hosting publishes the Vite production build from `dist`
- All routes rewrite to `/index.html`, which is required for the TanStack
  Router SPA
- `VITE_*` values are compiled into the browser build at build time, so update
  env files before running `npm run build`

### Functions behavior

- Functions use their own Node/TypeScript workspace under `functions/`
- Predeploy runs the functions workspace `lint` and `build` scripts before any
  deploy proceeds
- Firestore is a server-only credential store in the current app shape:
  browser clients do not use the Firestore Web SDK, and
  [firestore.rules](./firestore.rules)
  intentionally deny all client reads and writes
- Functions now own the Google Contacts token broker:
  - `beginGoogleContactsAuth`
  - `completeGoogleContactsAuth`
  - `getGoogleAccessToken`
  - `disconnectGoogleContacts`
  - `cleanupGoogleContactsCredentials`
- A scheduled retention job runs daily in `Asia/Seoul` and hard-deletes
  `googleContactsCredentials` records whose `connectedAt` timestamp is more
  than 90 days old
- This cleanup is quota-driven retention, not true Google refresh-token expiry
  detection; users with deleted records must reconnect Google Contacts
- The functions workspace intentionally keeps its own legacy ESLint config in
  [functions/.eslintrc.js](./functions/.eslintrc.js)
  and forces `ESLINT_USE_FLAT_CONFIG=false` in its lint script so it does not
  inherit the root flat config from
  [eslint.config.js](./eslint.config.js)
- Put server-only secrets and privileged API calls in functions, not in the
  browser bundle
- If a future feature needs browser-side Firestore access, revisit the
  deny-all rules first rather than weakening them ad hoc

### Troubleshooting

- If `firebase deploy` fails during `functions predeploy`, run
  `npm --prefix functions run lint` and `npm --prefix functions run build`
  directly first
- If ESLint reports that `--ext` is invalid while deploying functions, the
  functions lint command is being interpreted with flat config instead of the
  local legacy config. The functions lint script should keep
  `ESLINT_USE_FLAT_CONFIG=false`
- If Hosting deploy succeeds but routing is broken on refresh, confirm the SPA
  rewrite in [firebase.json](./firebase.json)
- If browser code cannot see an env var after deploy, confirm it starts with
  `VITE_` and that the app was rebuilt before deploying Hosting

## Environment files

Vite loads env files from the repo root automatically. Meishi now assumes this layout:

```bash
.env
.env.development
.env.production
```

- `.env`: shared defaults used in every mode
- `.env.development`: local development overrides for `npm run dev`
- `.env.production`: production build values for `npm run build`
- Only variables prefixed with `VITE_` are exposed to browser code
- Start from [.env.example](./.env.example)

## Local testing notes

- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID` are required for Firebase-backed Google auth.
- `VITE_FIREBASE_FUNCTIONS_REGION` optionally overrides the default `us-central1` Functions region.
- `VITE_FIREBASE_USE_EMULATORS=true` connects the browser to the local Firebase Auth and Functions emulators.
- `VITE_*` variables are compile-time inputs to the browser build. If a required Firebase value exists only in `.env.production`, the production build will see it, but `npm run dev` will not.
- After changing `.env.production`, rebuild before re-testing: `npm run build && npm run preview`.
- `npm run dev` is not the authoritative way to test PWA behavior in this repo because `vite-plugin-pwa` development service worker support is not enabled in [vite.config.ts](./vite.config.ts).
- When testing through the Vite dev server with `npm run dev`, mobile native-camera capture on `/capture` can still trigger page refreshes after returning from the camera flow. Treat that as an open issue to address in future capture/runtime work, and prefer `npm run build && npm run preview` when validating mobile capture behavior.
- Use `npm run build && npm run preview` when testing service worker registration, install prompts, offline shell behavior, or update prompts.
- If temporary dev-server PWA testing is needed, enable `devOptions: { enabled: true }` in the `VitePWA(...)` config, but treat previewing the production build as the final verification path.
- If an older PWA build is still showing stale behavior, clear site data or unregister the service worker before re-testing.
- For Android capture refresh debugging, `/capture?debug=1`
  shows the capture debug panel, and `/capture?debug=1&captureDebugMaxEdge=1600`
  additionally enables temporary image downscaling in development.
- For review diagnostics, `/review?debug=1` shows the raw extraction snapshot,
  derived vCard, and derived Google payload sections.

See [AGENTS.md](./AGENTS.md) for the project-specific development loop future agents should follow.
