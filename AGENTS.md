# Meishi Agent Guide

## Environment

- Repo type: browser-first PWA with a Firebase backend
- Language: TypeScript only
- UI stack: React, Vite, Tailwind, shadcn-style components
- Routing: TanStack Router file-based routes
- State: Redux Toolkit + RTK Query
- Persistence: `localStorage` for settings, IndexedDB via Dexie for images/drafts/history
- Backend: Firebase Cloud Functions + server-only Firestore for privileged auth and credential storage
- External integrations: Firebase Auth, Firebase Functions, Firestore Admin via Functions, Google Identity Services, Google People API, OpenAI Responses API

## Working model

- Work module-by-module under `src/modules`.
- Read the target module `README.md` before editing. Consult `DEV-NOTES.md` when the task needs broader technical context such as architecture, routing, persistence, auth, deployment, or debugging behavior beyond the local module boundary. Consult `functions/README.md` before editing privileged backend flows, Google auth broker logic, or deploy-sensitive Functions behavior.
- When a task needs implementation guidance for a specific technology or workflow, check `.ai/skills/README.md` and read the relevant skill under `.ai/skills/` before editing.
- Keep module boundaries explicit and typed.
- Keep provider-specific logic out of shared UI components.
- Keep privileged logic explicit: browser UI and local draft flows stay in `src/modules`, while secret-bearing or admin-only work belongs in `functions/`.
- Preserve the distinction between:
  - persisted user preferences,
  - short-lived Google access tokens,
  - server-stored Google refresh tokens and account metadata,
  - local draft/image data,
  - remote Google Contacts state,
  - Firestore documents that are managed only through Functions.

## Development loop

1. Read the relevant module README and confirm the interface it owns. If the task crosses module boundaries or depends on operational details, read `DEV-NOTES.md` for the deeper technical context.
2. Make the smallest coherent change that leaves the module runnable.
3. Prefer typed helpers and local validation over ad hoc component logic.
4. Keep browser-first constraints in mind when choosing dependencies or APIs, but remember this repo already has a Firebase Functions backend for privileged flows.
5. If the change affects another module, update the interface contract explicitly rather than relying on hidden coupling.
6. Treat `src/modules/local-data` as the persistence boundary. Import from its module entrypoint instead of reaching into `storage.ts` or `database.ts` directly.
7. Do not persist durable Google auth tokens in browser storage. Only light metadata such as scope, account hint, and connection timestamp belongs on the client; refresh tokens stay server-side in Firestore through Functions.
8. Treat Firestore as a privileged backend boundary in the current app shape. Browser clients do not use the Firestore Web SDK, and `firestore.rules` intentionally deny direct client access.
9. When changing backend auth or deploy behavior, verify the impact on both the browser workspace and the `functions/` workspace instead of assuming one side owns the whole flow.

## Test-debug loop

1. Start with the smallest useful verification step and only widen scope if that step does not explain the bug.
2. Use `npm run typecheck` first for interface drift, route typing issues, and RTK/React Hook Form wiring errors.
3. Use `npm run test` or `npm run test:watch` with Vitest for Jest-style unit and integration feedback.
   - Prefer Vitest first when debugging reducers, selectors, schema validation, mapping helpers, RTK Query request shaping, and local persistence helpers.
   - Prefer Testing Library tests when the question is "what does this component or route render after user input?" rather than "what function returned the wrong value?"
4. Use MSW in tests whenever a behavior depends on OpenAI or Google responses.
   - Mock external APIs by default.
   - Do not rely on live Google or OpenAI calls for routine verification.
5. Use Playwright when the bug depends on route transitions, camera/file inputs, service worker behavior, localStorage or IndexedDB persistence, or multi-step flows such as onboarding -> capture -> review -> sync.
6. Use the running app in a browser with Chrome DevTools when runtime behavior matters more than isolated assertions.
   - Use Chrome DevTools for layout bugs, mobile viewport issues, camera permission behavior, real form interaction timing, service worker registration/update behavior, storage inspection, network request inspection, and JavaScript errors that only appear in the browser.
   - Inspect `Application` panels for `localStorage`, IndexedDB, and service worker state.
   - Inspect `Network` when debugging GIS token requests, OpenAI requests, and People API mutations.
   - Inspect `Console` when debugging route loader failures, React runtime errors, and browser-only API failures.
7. When debugging sync issues, isolate the stages in order:
   - draft creation,
   - Google contact creation,
   - contact photo upload.
8. When debugging UI issues, reproduce them at the route/module boundary first, then narrow down to shared UI primitives only if necessary.
9. Before finishing, rerun the narrowest meaningful checks plus `npm run lint` if UI or shared code changed.
10. If the change touches Firebase Functions, Firestore-backed credential handling, or Google auth broker behavior, also run `npm --prefix functions run lint` and `npm --prefix functions run build`.
11. Use the Functions emulator or Firebase deploy flow when debugging callable functions, auth broker behavior, or predeploy failures. `firebase deploy` runs both functions predeploy checks and hosting deploy steps defined in `firebase.json`.
12. Firestore issues in this repo usually mean backend/Admin SDK behavior or rules drift, not browser-side Firestore bugs, because client access is intentionally denied.
13. For PWA work, use `npm run build && npm run preview` for real install/offline/update verification unless `devOptions.enabled` has been explicitly turned on in `vite.config.ts`.
14. Remember that `VITE_*` env vars are compiled into the browser build. Production-only values in `.env.production` will not appear in `npm run dev`.

## Implementation notes

- Review draft edits currently autosave with a short debounce in `src/modules/contact-review/ReviewWorkspace.tsx`. Be careful not to introduce form-reset behavior that wipes in-progress edits.
- IndexedDB sync history is append-only. The public `SyncOutcome` interface stays stable while local storage adds its own generated record key internally.
- PWA offline messaging must stay explicit: the app shell and local data can recover offline, but extraction and Google sync still require network access.
- Google Contacts refresh tokens are brokered and stored server-side through Functions. Keep the browser-side auth state limited to anonymous Firebase identity, connection status, and lightweight metadata.

## Future agent notes

- Treat `src/modules/local-data` as the persistence boundary. Avoid reaching across modules for draft, image, or settings storage details.
- Treat `functions/` as the privileged integration boundary. Secret-bearing API calls, OAuth code exchange, token refresh, revocation, retention cleanup, and Admin SDK Firestore access belong there unless the architecture is intentionally changed.
- Keep extraction richer than the first review UI. Preserve `extractionSnapshot` and derive editable fields from it instead of collapsing data early.
- Model contact data as repeatable collections first. Google-Contacts-style arrays are the stable base; single-value fields are only summaries.
- Preserve non-standard or ambiguous card text in both custom/X-field form and notes so fidelity survives review and sync.
- Normalize `react-hook-form` `watch()` output before passing it into typed helpers; watched values are often partial.
- Re-export shared contact field types from `src/shared/types/models.ts`, since that is the module boundary most features import.
- Prefer RTK Query `unwrap()` for mutation handling; it keeps control flow and types simpler than branching on union-shaped results.
- In review layouts, remember `min-w-0` on grid/flex children when media should shrink to the viewport.
- Keep the user-editable extraction prompt additive. Structured-output and fidelity rules should stay fixed in code.
- Google People API maps significant dates cleanly, but other “significant data” should remain preserved through custom fields and notes unless a standard field clearly fits.

## Tool selection quick guide

- Use Vitest when you need fast, repeatable, Jest-style feedback on pure logic or small React slices.
- Use Testing Library when user interactions or rendered state are the main question.
- Use MSW when the result depends on HTTP shape or error handling.
- Use Playwright when the issue spans multiple routes, storage layers, or browser capabilities.
- Use Chrome DevTools when you need to observe actual browser runtime behavior instead of simulated test behavior.

## Localization workflow

- When `react-intl` message descriptors change, use [.ai/skills/formatjs-extract-workflow.md](.ai/skills/formatjs-extract-workflow.md) for the extraction workflow.
- Keep the FormatJS extract command documented in that skill file rather than adding package scripts for it by default.

## Documentation loop

- Every browser module keeps a `README.md` describing:
  - responsibilities,
  - feature set,
  - exposed interfaces,
  - integration boundaries.
- The `functions/README.md` file is the backend workspace reference for privileged flows, deploy commands, and token-broker behavior.
- Update documentation in the same change when any of these change:
  - route flow,
  - persisted data shape,
  - public module interfaces,
  - external API behavior,
  - security assumptions,
  - backend trust boundaries.
- Keep the root `README.md` aligned with the product overview, public usage, and quick-start path. Keep `DEV-NOTES.md` aligned with the actual stack, module map, architecture, and operational notes.

## Project guardrails

- Do not introduce server-oriented SDKs into browser runtime code without proving browser compatibility.
- Do not move privileged Google auth or credential-retention behavior out of `functions/` without explicitly redesigning the security model.
- Do not store Google refresh tokens, OAuth client secrets, or equivalent durable credentials in browser storage.
- Do not weaken `firestore.rules` ad hoc. The current Firestore posture is server-only, and any browser access should be a deliberate architecture change with reviewed rules.
- Do not assume Google Contacts can store multiple arbitrary card images.
- One image may be uploaded as the Google contact photo; extra images remain local in v1.
- Treat client-side LLM key storage as prototype-only.
- Preserve schema validation around LLM output.
- Prefer focused, reversible changes over large speculative refactors.

## Definition of done

- The touched code compiles or the failure is explicitly documented.
- Focused verification was run for the changed area.
- Relevant module docs are updated.
- User-visible limitations or follow-up gaps are recorded directly in the docs or final handoff.
