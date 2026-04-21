# GDPR Module

## Responsibilities

- Read the Firebase Hosting privacy-region bootstrap injected into `index.html`.
- Decide whether first-load analytics consent must block the app.
- Own the PostHog enable/disable lifecycle for browser analytics.
- Expose safe analytics helpers so feature modules do not call PostHog directly.
- Render consent-management UI for later changes in Settings.

## Features

- Bootstrap parsing for `window.__MEISHI_PRIVACY_BOOTSTRAP__`
- Full-screen first-load consent screen for GDPR-region visitors with no stored choice
- Auto-grant behavior for non-GDPR visitors when no prior analytics choice exists
- PostHog lifecycle management tied to persisted consent
- Safe `useAnalytics()` hook with no-op capture methods when analytics is disabled
- Settings card for reviewing and changing analytics consent

## Interfaces

- Exposes:
  - `readPrivacyRegion`
  - `GdprBootstrap`
  - `AnalyticsSettingsCard`
  - `useAnalytics`
- Depends on:
  - `src/modules/onboarding-settings`
  - `src/modules/local-data`

## Hosting Contract

- The app shell injects `window.__MEISHI_PRIVACY_BOOTSTRAP__ = { region: "gdpr" | "non-gdpr" }`.
- Firebase Hosting i18n country matching serves GDPR-specific `index.html` copies from `dist/localized-files/ALL_<country>/index.html`.
- Unknown or missing bootstrap values fall back to `non-gdpr` so local development remains usable.

## Constraints

- This module gates analytics consent only. It does not claim to complete a full GDPR legal review.
- Region detection is request-based and must not be re-persisted separately from the consent choice.
- Feature modules should use `useAnalytics()` instead of importing PostHog directly.
