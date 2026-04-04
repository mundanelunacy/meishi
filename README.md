# Meishi

Meishi is a TypeScript-only React/Vite PWA for scanning business cards, extracting structured contact data with an LLM, verifying the result in-app, and syncing the verified contact to Google Contacts.

## Product flow

1. On first load, the user authorizes Google Contacts access with Google Identity Services.
2. The user selects an LLM provider and stores a BYOK API key locally in the browser.
3. The user captures one or more business-card images from a mobile camera or image library.
4. The app sends those images to the configured LLM, validates the structured response, and builds a local contact draft.
5. The review screen shows source images in the top section and an editable contact form in the lower section.
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
- Top-level frame, navigation, route shell, and PWA update affordances.

### `src/modules/onboarding-settings`
- First-run flow, provider selection, API key entry, session-ready checks, and settings management.

### `src/modules/google-auth`
- Google Identity Services script loading and token acquisition for browser-only Google Contacts access.

### `src/modules/card-capture`
- Camera and file-library capture flows plus image normalization hooks.

### `src/modules/card-extraction`
- LLM provider abstraction, OpenAI extraction request building, response parsing, and schema validation.

### `src/modules/contact-review`
- Editable review form, source-image pairing, and verified-contact finalization.

### `src/modules/google-contacts`
- Google People API contact creation, contact photo upload, and sync result tracking.

### `src/modules/local-data`
- Browser persistence boundaries for `localStorage` and IndexedDB.

### `src/modules/pwa-runtime`
- PWA lifecycle hooks, update prompts, and install/update wiring.

## Data boundaries

- `localStorage`
  - LLM provider choice
  - LLM API key
  - preferred OpenAI model
  - limited Google auth metadata, but not durable access tokens
- IndexedDB
  - captured images
  - active capture session
  - latest draft
  - sync history
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

See [AGENTS.md](/Users/mundanelunacy/Projects/meishi/AGENTS.md) for the project-specific development loop future agents should follow.
