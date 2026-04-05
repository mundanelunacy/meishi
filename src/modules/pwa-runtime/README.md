# PWA Runtime Module

## Responsibilities

- Register the service worker.
- Surface update availability to the app shell.
- Keep install/update behavior explicit and low-risk.

## Features

- `usePwaLifecycle` hook
- Install prompt support
- Prompt-based app update support
- Offline-ready messaging for shell/local data only
- Registration error logging

## Interfaces

- Exposes:
  - `usePwaLifecycle`
- Consumed by:
  - `src/modules/app-shell`

## Constraints

- Cache only shell assets and runtime-safe resources.
- Do not imply that capture, extraction, or sync are available offline when external APIs are required.
- Keep service-worker updates explicit instead of forcing background reloads during an active capture/review session.
- In this repo, test real PWA lifecycle behavior with `npm run build && npm run preview`; dev-server PWA behavior is not active unless `devOptions.enabled` is explicitly turned on in `vite.config.ts`.
