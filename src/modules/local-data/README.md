# Local Data Module

## Responsibilities

- Define browser persistence boundaries for settings, images, drafts, and sync history.
- Keep local storage strategy explicit and documented.

## Features

- `localStorage` helpers for onboarding/settings persistence
- Dexie-based IndexedDB for images, sessions, drafts, and sync history
- Recovery helpers for active capture and the latest autosaved draft
- Append-only sync outcome recording for create-plus-photo flows
- Deliberate stripping of durable Google access tokens before persistence

## Interfaces

- Exposes:
  - `loadPersistedState`
  - `persistOnboardingState`
  - `clearPersistedState`
  - `saveCapturedImages`
  - `loadCapturedImages`
  - `saveDraft`
  - `loadLatestDraft`
  - `saveSyncOutcome`

## Data ownership

- `localStorage`
  - settings
  - docs locale preference
  - light Google auth metadata only
- IndexedDB
  - card images
  - active session
  - latest draft
  - append-only sync history

## Constraints

- Do not store Google access tokens or refresh tokens here.
- Keep review-draft autosave recoverable after navigation or refresh.
- Keep locale settings sanitized at the storage boundary so unknown values fall back to `en-US`.
