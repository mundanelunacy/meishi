# App Shell Module

## Responsibilities

- Provide the top-level application frame.
- Render navigation for landing, capture, review, docs, settings, and external links.
- Render the static `/docs`, `/privacy`, and `/terms` pages.
- Surface app-wide onboarding-driven route gating for capture/review navigation.
- Host PWA update prompts and installation-safe shell behavior.

## Features

- Hero/header treatment for the PWA
- Brand link back to the landing page
- Route outlet and navigation state
- Centered two-option primary navigation for capture/review that reads as a toggle, with a right-aligned overflow menu in the desktop header and in the mobile top header beside the brand
- Overflow-menu navigation for docs, settings, Google Contacts, and external project/support links on both desktop and mobile
- Mobile swipe gestures on the primary navigation surface to move left/right between capture and review
- PWA update notification hook integration
- App-wide setup gating cues for locked routes

## Interfaces

- Consumes Redux selectors from onboarding and sync-related modules.
- Consumes stable onboarding readiness selectors rather than direct provider or auth transport APIs.
- Consumes the PWA lifecycle hook from `src/modules/pwa-runtime`.
- Exposes the route shell through `AppShell`.
- Exposes the static `DocsPage` for route-level app documentation.

## Route Map

- `/landing`: app entry and onboarding surface.
- `/capture`: image capture and extraction start point.
- `/review`: review, edit, export, and sync surface.
- `/docs`: static in-app help and usage documentation.
- `/privacy`: static privacy policy page.
- `/terms`: static terms of service page.
- `/settings`: later configuration and account-management surface.
- `/auth/google/callback`: OAuth callback handoff route for Google connection completion.

## Notes

- Keep this module presentation-focused.
- Do not place provider-specific API logic here.
