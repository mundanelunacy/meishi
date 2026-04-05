# Onboarding and Settings Module

## Responsibilities

- Own first-run setup and settings management.
- Persist the chosen LLM provider, provider-specific API keys, provider models, and one shared extraction prompt.
- Track onboarding completion.
- Manage Google auth state handoff from the GIS module.
- Act as the app readiness authority for future route and module gating.

## Features

- First-run onboarding panel
- Provider picker with OpenAI and Anthropic support
- Provider-specific BYOK API key entry
- Shared advanced extraction guidance setting appended to fixed structured-output and fidelity rules
- Settings screen for later edits and local reset
- Route readiness selectors
- Explicit development messaging when mock Google auth is active

## Interfaces

- Exposes:
  - `AppSettings`
  - `GoogleAuthState`
  - onboarding selectors including `selectHasLlmConfiguration`, `selectHasGoogleAuthorization`, and `selectAppReadiness`
  - onboarding actions such as `setOpenAiApiKey`, `setAnthropicApiKey`, `setExtractionPrompt`, `setGoogleAuthState`, and `completeOnboarding`
- Depends on:
  - `src/modules/google-auth`
  - `src/modules/local-data`

## Persistence

- Persists the settings object in `localStorage`.
- Keeps only light Google session metadata such as scope and account hint in `localStorage`; access tokens are reacquired when needed.

## Constraints

- This module must continue to warn that client-side API key storage is prototype-only.
- Mock Google auth is acceptable only for local development and must stay explicitly labeled in the UI.
- Route readiness must be based on the currently selected provider’s configuration, not a generic API key flag.
