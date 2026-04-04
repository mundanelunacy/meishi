# PWA Runtime Module

## Responsibilities

- Register the service worker.
- Surface update availability to the app shell.
- Keep install/update behavior explicit and low-risk.

## Features

- `usePwaLifecycle` hook
- App update prompt support
- Registration error logging

## Interfaces

- Exposes:
  - `usePwaLifecycle`
- Consumed by:
  - `src/modules/app-shell`

## Constraints

- Cache only shell assets and runtime-safe resources.
- Do not imply that capture, extraction, or sync are available offline when external APIs are required.
