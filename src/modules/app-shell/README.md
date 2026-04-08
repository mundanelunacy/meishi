# App Shell Module

## Responsibilities

- Provide the top-level application frame.
- Render navigation for landing, capture, review, docs, settings, and external links.
- Render the static `/docs`, `/privacy`, and `/terms` pages.
- Surface app-wide API-key-driven route gating for setup, capture, review, and settings navigation.
- Host PWA update prompts and installation-safe shell behavior.

## Features

- Hero/header treatment for the PWA
- Brand link back to the landing page
- Route outlet and navigation state
- Centered two-option primary navigation for capture/review that reads as a toggle, with a right-aligned overflow menu in the desktop header and in the mobile top header beside the brand
- Overflow-menu navigation for sharing the app site, docs, settings, Google Contacts, and external project/support links on both desktop and mobile
- React Intl-backed app shell, legal routes, and docs content with `en-US` as the default locale and `ja` translations
- Header-level language pickers beside the overflow-menu trigger on both mobile and desktop layouts
- Mobile swipe gestures on the primary navigation surface to move left/right between capture and review
- PWA update notification hook integration
- App-wide setup gating cues for locked routes

## Interfaces

- Consumes Redux selectors from onboarding and sync-related modules.
- Consumes stable setup/readiness selectors rather than direct provider or auth transport APIs.
- Consumes the PWA lifecycle hook from `src/modules/pwa-runtime`.
- Exposes the route shell through `AppShell`.
- Exposes the static `DocsPage` for route-level app documentation.

## Route Map

- `/landing`: app entry and onboarding surface.
- `/setup`: standalone quick-setup surface that reuses the landing-page setup form.
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
- Keep docs copy and docs JSON-LD sourced from the same message/content helpers so localized page text and schema stay aligned.
- Keep legal route copy sourced from `legalContent.tsx` so page structure and translations stay centralized.
- The overflow-menu Share action targets the site root URL. It uses the browser's native Web Share flow when available and falls back to an in-app modal with social share links and copy-to-clipboard when native share is unavailable.
