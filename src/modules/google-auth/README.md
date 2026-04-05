# Google Auth Module

## Responsibilities

- Load Google Identity Services in the browser.
- Request Google Contacts access tokens through the GIS token model.
- Revoke Google access when the user signs out.
- Provide a single typed auth client surface that hides whether the app is using real GIS or development mock auth.

## Features

- GIS script loader
- Token request helper
- Scope definition for Google Contacts sync
- Sign-out and revoke helper
- Development-safe mock auth client for local testing

## Interfaces

- Exposes:
  - `googleAuthClient`
  - `createGoogleAuthClient`
  - `loadGoogleIdentityScript`
  - `requestGoogleAccessToken`
  - `revokeGoogleAccessToken`
  - `getGoogleScope`
- Consumed by onboarding and settings flows.

## External docs

- [Using the token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model)
- [OAuth 2.0 for Web](https://developers.google.com/identity/oauth2/web/guides/overview)

## Constraints

- Real auth requires `VITE_GOOGLE_CLIENT_ID`.
- `VITE_GOOGLE_AUTH_MODE=mock|real` can override the default mode selection.
- Access tokens are short-lived and should not be treated as durable local settings.
- Mock auth is for local development only and should never be presented as a real Google session.
