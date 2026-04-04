# Google Auth Module

## Responsibilities

- Load Google Identity Services in the browser.
- Request Google Contacts access tokens through the GIS token model.
- Revoke Google access when the user signs out.

## Features

- GIS script loader
- Token request helper
- Scope definition for Google Contacts sync
- Sign-out and revoke helper

## Interfaces

- Exposes:
  - `loadGoogleIdentityScript`
  - `requestGoogleAccessToken`
  - `revokeGoogleAccessToken`
  - `getGoogleScope`
- Consumed by onboarding and settings flows.

## External docs

- [Using the token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model)
- [OAuth 2.0 for Web](https://developers.google.com/identity/oauth2/web/guides/overview)

## Constraints

- Requires `VITE_GOOGLE_CLIENT_ID`.
- Access tokens are short-lived and should not be treated as durable local settings.
