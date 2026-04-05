# Changelog

## 2026-04-05

### Capture session deletion race fix

- Fixed the `/capture` active-session image list so deleting the final remaining image no longer requires a second click.
- Changed `src/modules/card-capture/CaptureWorkspace.tsx` to hydrate persisted capture-session images only once per mount, preventing stale IndexedDB session data from being reloaded after an in-memory delete clears the list.
- Added a regression test in `src/modules/card-capture/CaptureWorkspace.test.tsx` that simulates a delayed final delete write plus a stale `loadCapturedImages()` result, and verifies the last image stays removed.

### Capture and review debug gating

- Added a shared URL-based debug flag in `src/app/debug.ts` so debug-only UI can be enabled with `?debug=1` instead of a persisted settings toggle.
- Moved the review route’s raw extraction, derived vCard, and derived Google payload sections behind `/review?debug=1`.
- Removed the persisted developer debug toggle from onboarding/settings state, storage sanitization, and the `/settings` screen.

### Android capture investigation tooling

- Added a development-only page-session marker in `src/app/AppRoot.tsx` so true reloads can be distinguished from in-app remounts during capture debugging.
- Added reload-persistent capture diagnostics in `src/modules/card-capture/CaptureWorkspace.tsx`, including lifecycle events, capture pipeline events, and a debug panel shown only with `/capture?debug=1`.
- Added temporary image downscaling support for capture debugging via `captureDebugMaxEdge`, plus file-size and dimension logging in `src/modules/card-capture/imageProcessing.ts`.
- Hardened non-submit shell and capture buttons with explicit `type="button"` attributes.

### Documentation and tests

- Updated the root README and module READMEs to document URL-based debug access, temporary capture diagnostics, and the removal of the settings-based debug toggle.
- Documented that mobile native-camera capture can still refresh the page when using the Vite dev server via `npm run dev`, and noted that as an open issue for future work.
- Added and updated tests covering debug-query behavior, removed settings-toggle expectations, and the trimmed persisted settings shape.

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

### Structured extraction and provider settings

- Added real OpenAI and Anthropic extraction support behind one shared extraction boundary.
- Switched extraction to provider-enforced structured-output mode with schema validation for both providers.
- Replaced the old single generic LLM key shape with provider-specific settings, model preferences, a shared advanced extraction prompt, and a persisted developer debug toggle.
- Kept the user-editable extraction prompt additive so fixed structured-output and fidelity rules remain enforced in code.

### Capture, draft persistence, and review flow

- Completed the capture-to-review handoff so extraction results are saved into a persisted draft before navigating to review.
- Added persisted `extractionSnapshot` storage on `ContactDraft` for traceability and debug inspection.
- Preserved capture-session recovery and review autosave while expanding the review draft shape.

### Review form and contact fidelity

- Reworked the review screen into a Google-Contacts-style dynamic form with editable repeatable sections for emails, phone numbers, addresses, websites, related people, significant dates, and custom fields.
- Preserved non-standard and ambiguous card text through custom/X-fields and notes so repeated or unclear values are not lost.
- Added inline developer debug preview for raw extraction JSON, derived vCard output, and derived Google People API payloads based on the current edited form state.
- Updated the source-image panel so captured images render inside a viewport-bounded container with contained sizing instead of overflowing at intrinsic image width.

### Google Contacts mapping

- Added pure mapping helpers for reviewed contacts to both Google People create-contact payloads and developer-facing vCard previews.
- Expanded sync mapping to cover repeatable emails, phones, URLs, addresses, relations, significant dates, and user-defined custom fields.
- Kept non-date significant data preserved locally through notes and custom fields when it cannot map cleanly to Google People `events`.

### Type and validation fixes

- Re-exported shared repeatable contact field types from `src/shared/types/models.ts` to match the project’s import boundary.
- Normalized `react-hook-form` watched values before passing them into typed draft builders to avoid partial-value drift.
- Simplified review sync typing by switching mutation handling to RTK Query `unwrap()`.

### Documentation

- Updated the root README plus module READMEs for onboarding/settings, card extraction, contact review, and Google contacts to reflect structured-output extraction, advanced prompt settings, dynamic review fields, fidelity preservation, and debug previews.
- Added concise future-agent notes to `AGENTS.md` covering persistence boundaries, repeatable contact modeling, fidelity rules, `watch()` normalization, `unwrap()`, and layout sizing pitfalls.

### Tests added and updated

- Added extraction adapter coverage for structured-output success and validation behavior.
- Added mapping tests for Google payload and vCard generation across repeatable fields and custom/X-field preservation.
- Added review workspace tests for debug-mode rendering, preview updates from edited form state, and repeatable field additions.
- Added capture flow coverage for persisted draft creation after extraction.
- Expanded storage, onboarding, and schema tests for the new settings and extraction shapes.

### Verification run

- `npm run typecheck`
- `npm run test`
- `npm run lint`
- `npm run test -- src/modules/contact-review/ReviewWorkspace.test.tsx`

### Capture experience and camera behavior

- Added an adaptive capture-mode boundary in `src/modules/card-capture` that prefers the native camera file input on mobile devices and opens an in-browser live camera preview on desktop-class browsers.
- Added rear-camera preference detection with front-camera and generic-video fallbacks so desktop webcam capture stays usable even when device labels or facing constraints are incomplete.
- Added a large live-preview capture dialog for webcam flows, including snapshot capture from `getUserMedia()` and clearer permission/device error messaging.
- Added per-image deletion from the active capture session while preserving IndexedDB-backed session recovery.
- Added an SVG favicon link in `index.html`.

### Google Contacts-aligned name and company fields

- Extended the extraction schema, persisted draft model, and review form with Google-Contacts-style scalar fields for name prefix, phonetic name parts, nickname, file-as, and department.
- Updated the shared extraction prompt so bilingual cards can map non-Latin names into the primary name fields and Latin-script equivalents into the phonetic fields.
- Expanded Google People payload generation and developer vCard preview output to include honorific prefix, phonetic names, nickname, file-as, and department.
- Updated the People API create-contact request mask to request the new `nicknames` and `fileAses` fields.

### Documentation

- Updated the root `README.md` to clarify that the review workspace now covers Google-Contacts-style scalar name and company fields in addition to repeatable contact collections.
- Updated `src/modules/card-capture/README.md` to document the new mobile-native vs desktop-live-preview split, rear-camera preference/fallback behavior, file-input fallback, per-image removal, and the browser-hint limitation of `capture="environment"`.
- Updated `src/modules/card-extraction/README.md` to document Google-Contacts-aligned top-level extraction for richer name and company details.
- Updated `src/modules/contact-review/README.md` to document scalar editing support for the new name and company fields.
- Updated `src/modules/google-contacts/README.md` to document Google People mapping for the expanded name and company model.

### Tests added and updated

- Added unit coverage for capture-experience selection and preferred camera-facing-mode fallback behavior.
- Expanded capture workspace tests to cover active-session image deletion, native camera input selection on mobile, webcam preview on desktop, and file-input fallback when webcam APIs are unavailable.
- Expanded extraction schema and structured extraction tests for the new Google-Contacts-aligned name and company fields.
- Expanded review workspace, contact mapping, and local-data tests to cover the richer scalar fields through review, persistence, Google payload generation, and vCard output.

### Verification run

- `npm run typecheck`
- `npm run test -- src/modules/card-capture/CaptureWorkspace.test.tsx src/modules/card-capture/cameraFacingMode.test.ts src/modules/card-capture/captureExperience.test.ts src/modules/card-extraction/extractionSchema.test.ts src/modules/card-extraction/structuredExtraction.test.ts src/modules/contact-review/ReviewWorkspace.test.tsx src/modules/google-contacts/contactMapping.test.ts src/modules/local-data/database.test.ts`
- `npm run lint`
