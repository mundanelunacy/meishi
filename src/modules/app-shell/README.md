# App Shell Module

## Responsibilities

- Provide the top-level application frame.
- Render navigation for landing, capture, review, settings, and external links.
- Surface app-wide onboarding-driven route gating for capture/review navigation.
- Host PWA update prompts and installation-safe shell behavior.

## Features

- Hero/header treatment for the PWA
- Brand link back to the landing page
- Route outlet and navigation state
- Centered two-option primary navigation for capture/review that reads as a toggle, with a right-aligned overflow menu in the desktop header and in the fixed mobile bottom bar
- Mobile swipe gestures on the primary navigation surface to move left/right between capture and review
- PWA update notification hook integration
- App-wide setup gating cues for locked routes

## Interfaces

- Consumes Redux selectors from onboarding and sync-related modules.
- Consumes stable onboarding readiness selectors rather than direct provider or auth transport APIs.
- Consumes the PWA lifecycle hook from `src/modules/pwa-runtime`.
- Exposes the route shell through `AppShell`.

## Notes

- Keep this module presentation-focused.
- Do not place provider-specific API logic here.
