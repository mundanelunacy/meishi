# Onboarding and Settings Module

## Responsibilities

- Own first-run setup and settings management.
- Persist the chosen LLM provider, provider-specific API keys, provider models, and one shared extraction prompt.
- Track onboarding completion.
- Manage Google auth state handoff from the Firebase-backed auth module.
- Act as the app readiness authority for LLM-dependent routes while keeping Google sync opt-in.

## Features

- First-run onboarding panel
- Provider picker with OpenAI and Anthropic support
- Provider-specific BYOK API key entry
- Provider-specific model selection from the app's current supported-model list
- Standalone `/setup` page that reuses the landing-page quick setup section
- `/capture`, `/review`, and `/settings` route entry now redirects through `/setup` until an API key is configured
- `/setup` redirects to `/settings` once an API key is configured
- Appearance preference with `system`, `light`, and `dark` modes
- Docs language preference with `en-US`, `ja`, and `ko` options
- Shared advanced extraction guidance setting appended to fixed structured-output and fidelity rules
- Settings screen for later edits and local reset
- Settings screen that reuses the landing-page provider form, exposes a simple Google connection toggle, and separates advanced controls
- Route readiness selectors
- Firebase-backed Google connection status and reconnect/disconnect controls
- Landing-page setup that treats Google Contacts authorization as optional until sync time

## Interfaces

- Exposes:
  - `AppSettings`
  - `AppLocale`
  - `GoogleAuthState`
  - `ThemeMode`
  - onboarding selectors including `selectHasLlmConfiguration`, `selectHasGoogleAuthorization`, `selectLocale`, and `selectAppReadiness`
  - onboarding actions such as `setOpenAiApiKey`, `setAnthropicApiKey`, `setExtractionPrompt`, `setThemeMode`, `setLocale`, `setGoogleAuthState`, and `completeOnboarding`
- Depends on:
  - `src/modules/google-auth`
  - `src/modules/local-data`

## Persistence

- Persists the settings object in `localStorage`.
- Keeps only light Google connection metadata such as scope, connected account email, and connected timestamp in `localStorage`; Google bearer tokens are reacquired from Functions when needed.
- Stores the appearance preference alongside other settings and resolves `system` against the browser color-scheme preference at runtime.
- Stores the docs locale preference in the same settings payload. `en-US` is the persisted default, with `ja` and `ko` available as translated locales.

## Constraints

- This module must continue to warn that client-side API key storage is prototype-only.
- Google readiness is based on a renewable backend-backed connection, not the presence of a bearer token in Redux.
- The settings screen may place Google auth in a transient `disconnecting` state so both connection toggles stay locked until backend disconnect finishes.
- Onboarding copy should explain that Google consent text is broader than the app's current create-plus-photo-upload flow because the People API requires the full contacts scope.
- Route readiness must be based on the currently selected provider’s configuration, not a generic API key flag.
- Capture readiness should not require pre-authorized Google access because review can export a local vCard without Google.
