# App Shell Module

## Responsibilities

- Provide the top-level application frame.
- Render navigation for onboarding, capture, review, and settings routes.
- Surface app-wide readiness signals such as LLM provider, Google auth state, and onboarding status.
- Host PWA update prompts and installation-safe shell behavior.

## Features

- Hero/header treatment for the PWA
- Route outlet and navigation state
- PWA update notification hook integration
- App-wide status badges

## Interfaces

- Consumes Redux selectors from onboarding and sync-related modules.
- Consumes the PWA lifecycle hook from `src/modules/pwa-runtime`.
- Exposes the route shell through `AppShell`.

## Notes

- Keep this module presentation-focused.
- Do not place provider-specific API logic here.
