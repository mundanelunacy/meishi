# Local Data Module

## Responsibilities

- Define browser persistence boundaries for settings, images, drafts, and sync history.
- Keep local storage strategy explicit and documented.

## Features

- `localStorage` helpers for onboarding/settings persistence
- Dexie-based IndexedDB for images, sessions, drafts, and sync history
- Recovery helpers for active capture and latest draft

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
  - settings only
- IndexedDB
  - card images
  - active session
  - draft
  - sync history

## Constraints

- Do not store durable Google access tokens here.
