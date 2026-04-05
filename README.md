# Meishi

Meishi is a TypeScript-only React/Vite PWA for scanning business cards, extracting structured contact data with an LLM, verifying the result in-app, and syncing the verified contact to Google Contacts.

## Product flow

1. On first load, the user authorizes Google Contacts access with Google Identity Services.
   - In local development, the app can fall back to an explicit mock Google auth mode when a Google client ID is not configured.
2. The user selects an LLM provider and stores a BYOK API key locally in the browser.
3. The user captures one or more business-card images from a mobile camera or image library.
4. The app sends those images to the configured LLM, validates the structured response, and builds a local contact draft.
5. The review screen shows source images in the top section and an editable contact form in the lower section. Draft edits autosave locally for recovery after refresh.
6. Saving creates a Google contact and uploads one selected image as the Google contact photo.
7. Additional captured images remain local in IndexedDB because Google Contacts does not support arbitrary multi-image business-card attachments.

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
- Google auth client boundary for real GIS token acquisition and development-safe mock auth.

### `src/modules/card-capture`
- Camera and file-library capture flows plus image normalization hooks.

### `src/modules/card-extraction`
- LLM provider abstraction, OpenAI extraction request building, response parsing, and schema validation.

### `src/modules/contact-review`
- Editable review form, source-image pairing, and verified-contact finalization.

### `src/modules/google-contacts`
- Google People API contact creation, contact photo upload, and sync result tracking.

### `src/modules/local-data`
- Browser persistence boundaries for `localStorage` and IndexedDB, including draft recovery and append-only sync history.

### `src/modules/pwa-runtime`
- PWA lifecycle hooks, install prompting, prompt-based updates, and explicit offline-runtime messaging.

## Data boundaries

- `localStorage`
  - LLM provider choice
  - LLM API key
  - preferred OpenAI model
  - limited Google auth metadata such as scope and account hint, but not durable access tokens
- IndexedDB
  - captured images
  - active capture session
  - latest draft with autosaved review edits
  - append-only sync history
- In-memory Redux state
  - current Google access token
  - active draft edit state
  - sync session status

## Security posture

This scaffold intentionally uses a browser-only BYOK model. That is acceptable for a trusted prototype, but not for a production multi-user app. User-entered LLM API keys are stored client-side, and provider requests originate from the browser.

The app does not include a backend token broker, encrypted key vault, or server-side proxy. If the project moves beyond prototype use, those constraints should be revisited before rollout.

## External API references

- Google Identity Services token flow:
  - [Using the token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model)
  - [OAuth 2.0 for Web](https://developers.google.com/identity/oauth2/web/guides/overview)
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
- Start from [.env.example](/Users/mundanelunacy/Projects/meishi/.env.example)

## Local testing notes

- `VITE_GOOGLE_CLIENT_ID` is required for real Google OAuth.
- `VITE_GOOGLE_AUTH_MODE=real|mock` can force the auth mode.
- In development, if `VITE_GOOGLE_CLIENT_ID` is missing and no explicit auth mode is set, Meishi defaults to mock Google auth so the onboarding, shell, capture, review, and demo sync flow remain testable.
- `VITE_*` variables are compile-time inputs to the browser build. If `VITE_GOOGLE_CLIENT_ID` exists only in `.env.production`, the production build will see it, but `npm run dev` will not.
- After changing `.env.production`, rebuild before re-testing: `npm run build && npm run preview`.
- `npm run dev` is not the authoritative way to test PWA behavior in this repo because `vite-plugin-pwa` development service worker support is not enabled in [vite.config.ts](/Users/mundanelunacy/Projects/meishi/vite.config.ts).
- Use `npm run build && npm run preview` when testing service worker registration, install prompts, offline shell behavior, or update prompts.
- If temporary dev-server PWA testing is needed, enable `devOptions: { enabled: true }` in the `VitePWA(...)` config, but treat previewing the production build as the final verification path.
- If an older PWA build is still showing stale behavior, clear site data or unregister the service worker before re-testing.

See [AGENTS.md](/Users/mundanelunacy/Projects/meishi/AGENTS.md) for the project-specific development loop future agents should follow.
