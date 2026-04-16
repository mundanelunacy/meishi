# Google Auth Module

## Responsibilities

- Establish an anonymous Firebase Auth session for callable Functions access.
- Start and complete the Google Contacts OAuth authorization-code flow.
- Request short-lived Google access tokens from Firebase Functions when the browser needs them.
- Revoke the stored backend Google connection when the user signs out.
- Provide one typed auth client surface for the rest of the app.

## Features

- On-demand Firebase app/auth/functions bootstrap when Google auth surfaces or sync flows need it
- Anonymous Firebase session bootstrap
- Popup-based Google OAuth connect flow with callback route handoff
- Backend token fetch with in-memory browser caching
- Recoverable-auth-failure detection so review sync can reconnect automatically after revoked or expired Google credentials
- Disconnect helper that clears the backend Google connection and signs out Firebase locally
- Scope definition for Google Contacts sync
- Route-local Google auth status refresh for settings and review flows instead of an app-wide startup effect

## Interfaces

- Exposes:
  - `initializeGoogleAuth`
  - `connectGoogleContacts`
  - `completeGoogleContactsAuthCallback`
  - `getValidGoogleAccessToken`
  - `disconnectGoogleContacts`
  - `createInitialGoogleAuthState`
  - `getGoogleScope`
- Consumed by onboarding and settings flows.

## External docs

- [Firebase Auth for Web](https://firebase.google.com/docs/auth/web/start)
- [Callable Functions](https://firebase.google.com/docs/functions/callable)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)

## Constraints

- Firebase config requires `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID`.
- The browser does not persist Google access tokens or refresh tokens.
- The browser only keeps a short-lived in-memory access-token cache and lightweight connection metadata in local storage.
- The Google OAuth client secret and refresh-token storage stay in Firebase Functions and Firestore, never in the browser bundle.
- Firebase Functions run a daily retention cleanup that deletes stored backend
  Google credential records more than 90 days after `connectedAt`, even if the
  underlying Google refresh token might still be valid.
- When that retention cleanup deletes a stored credential, the browser falls
  back to the existing disconnected state and the user must reconnect Google
  Contacts.
