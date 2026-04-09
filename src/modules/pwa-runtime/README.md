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
- Runtime sync of `theme-color` metadata to the active app theme so Chromium-based installed PWAs use the same top chrome color as the app shell
- Static Apple standalone metadata with best-effort status-bar contrast updates for iOS home-screen installs

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
- Android and other Chromium-based PWAs should pick up the active `theme-color` value, but iOS still limits standalone status-bar styling to Apple-defined modes rather than arbitrary colors.
- macOS and Windows installed PWAs may keep native window-frame colors under OS control even when the page top area matches the app shell.
