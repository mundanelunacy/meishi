# Changelog

## 2026-04-05

### App shell, onboarding, and Google auth foundation

- Reworked the app shell to act as the top-level composition layer for the PWA.
- Added app readiness badges and setup-state messaging to the shell.
- Kept onboarding always reachable while visibly gating capture, review, and settings until setup is complete.
- Added environment warnings when real Google OAuth is selected but `VITE_GOOGLE_CLIENT_ID` is missing.

### Google auth architecture

- Replaced direct GIS usage with a typed Google auth client boundary in `src/modules/google-auth/googleIdentity.ts`.
- Added auth mode resolution with support for `real` and `mock` Google auth modes.
- Added development-safe mock Google auth for local testing when a client ID is not configured.
- Extended `GoogleAuthState` with auth mode metadata and kept access tokens transient.
- Preserved only light Google metadata such as scope and account hint in `localStorage`.

### Onboarding and settings flow

- Refactored onboarding state to separate persisted settings from transient Google session state.
- Added stable readiness selectors for future route and module gating.
- Updated onboarding to use the shared auth client instead of GIS directly.
- Added explicit mock-auth messaging in onboarding and settings.
- Added settings actions for reconnecting Google auth, signing out, clearing local settings, and re-running onboarding.

### Local dev and demo sync behavior

- Added mock responses in the Google Contacts RTK Query layer so the full onboarding -> capture -> review -> sync flow is locally testable in mock auth mode.
- Preserved the production Google API boundary for real auth mode.

### Vite environment setup

- Updated Vite config to use mode-aware env loading from repo-root `.env` files.
- Added `.env.example` with starter `VITE_` variables.
- Added `.env`-related ignore rules for local secret files.
- Documented `.env`, `.env.development`, and `.env.production` usage in the root README.

### Documentation

- Updated the root README to reflect the new auth behavior, persistence boundaries, and environment-file conventions.
- Updated module READMEs for:
  - `app-shell`
  - `onboarding-settings`
  - `google-auth`
  - `google-contacts`
  - `local-data`

### Tests added

- Added env resolution tests.
- Added Google auth client tests for real and mock modes.
- Expanded onboarding slice coverage for readiness derivation.
- Added component tests for:
  - app shell readiness rendering
  - onboarding panel auth flow
  - settings panel reconnect/sign-out behavior

### Verification run

- `npm run typecheck`
- `npm run test`
- `npm run lint`
- `npm run build`

### Local data and PWA runtime follow-up

- Hardened `src/modules/local-data` into the app’s explicit browser persistence boundary.
- Added a `src/modules/local-data/index.ts` entrypoint and updated consumers to import from the module boundary.
- Sanitized persisted onboarding state so only settings plus light Google metadata are restored from `localStorage`.
- Made `localStorage` persistence and clearing fail-safe when browser storage access throws.
- Updated Dexie sync history storage to be append-only without changing the public `SyncOutcome` interface.
- Preserved active capture-session recovery behavior for stored images.

### Draft persistence and review recovery

- Saved extracted drafts to IndexedDB immediately after extraction before navigating to review.
- Added debounced autosave for review-form edits while preserving `sourceImageIds` and `confidenceNotes`.
- Kept review route recovery behavior so drafts and images can be restored when Redux state is empty after refresh.

### PWA lifecycle and shell integration

- Expanded `src/modules/pwa-runtime/usePwaLifecycle.ts` to handle install availability, installed state, offline-ready state, and prompt-based updates.
- Added a `src/modules/pwa-runtime/index.ts` entrypoint for the PWA runtime boundary.
- Updated the app shell to show install and update actions from the shared PWA lifecycle hook.
- Added explicit offline-ready messaging that limits offline expectations to shell and local data, not extraction or Google sync.
- Switched `vite-plugin-pwa` from `autoUpdate` to prompt-based updates and kept Workbox runtime caching disabled for external API traffic.

### Documentation and testing notes

- Updated the root README with guidance on production env builds, preview-based PWA testing, and clearing stale service worker state.
- Updated `src/modules/pwa-runtime/README.md` with the expected build-and-preview verification path.
- Updated `AGENTS.md` with persistence-boundary guidance, PWA verification guidance, and implementation notes for autosave and append-only sync history.

### Tests added

- Added local-data storage tests for default fallback, malformed JSON handling, auth metadata sanitization, and safe storage writes.
- Added IndexedDB tests for capture-session recovery, latest-draft lookup, and append-only sync history behavior.
- Added PWA lifecycle hook tests covering refresh state, offline-ready state, install prompting, installed-state handling, and update application.
- Updated app-shell tests for the expanded PWA lifecycle hook contract.
- Added `fake-indexeddb` as a dev dependency for Dexie-backed tests.

### Verification run

- `npm run typecheck`
- `npm run test -- src/modules/local-data/storage.test.ts src/modules/local-data/database.test.ts src/modules/pwa-runtime/usePwaLifecycle.test.tsx src/modules/app-shell/AppShell.test.tsx`
- `npm run lint`
