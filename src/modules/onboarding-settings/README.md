# Onboarding and Settings Module

## Responsibilities

- Own first-run setup and settings management.
- Persist the chosen LLM provider, provider key, and preferred OpenAI model.
- Track onboarding completion.
- Manage Google auth state handoff from the GIS module.

## Features

- First-run onboarding panel
- Provider picker with OpenAI-first support
- BYOK API key entry
- Settings screen for later edits and local reset
- Route readiness selectors

## Interfaces

- Exposes:
  - `AppSettings`
  - `GoogleAuthState`
  - onboarding selectors
  - onboarding actions such as `setLlmApiKey`, `setGoogleAuthState`, and `completeOnboarding`
- Depends on:
  - `src/modules/google-auth`
  - `src/modules/local-data`

## Persistence

- Persists the settings object in `localStorage`.
- Keeps Google token metadata only as light session metadata; access tokens are reacquired when needed.

## Constraints

- This module must continue to warn that client-side API key storage is prototype-only.
