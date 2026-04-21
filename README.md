# Meishi

Meishi turns business cards into structured contacts you can review, export, and optionally sync to Google Contacts.

[Open the public app](https://meishi.dev)  
[Read the technical notes](./DEV-NOTES.md)

![Meishi hero](./public/landing/networking_scene.jpg)

## Why it exists

Typing contact details by hand is slow, inconsistent, and easy to abandon. Meishi keeps the workflow short: capture a card, run extraction, verify the result, then save a `.vcf` or push the cleaned contact to Google Contacts.

## What you get

- Mobile-friendly business-card capture and image import
- Structured extraction with OpenAI or Anthropic using your own API key
- Editable review UI with repeatable contact fields
- Local draft recovery in the browser
- `.vcf` export
- Optional Google Contacts sync with one contact photo upload

## For end-users

### Use the public app

Open [https://meishi.dev](https://meishi.dev).

You will be guided through:

1. Picking an LLM provider and adding your own API key.
2. Capturing or importing one or more business-card images.
3. Reviewing the extracted contact before saving anything.
4. Exporting a vCard or optionally syncing to Google Contacts.

### Install it like an app

- Android + Chrome: open the public app, then use the browser install prompt or the Chrome menu and choose `Install app` or `Add to Home screen`.
- iPhone or iPad + Safari: open the public app, tap `Share`, then choose `Add to Home Screen`.
- Desktop Chrome or Edge: open the public app and use the install icon in the address bar.

### What happens under the hood

Meishi is a browser-first PWA. Your images, draft contact, and app settings stay in browser storage so you can recover work after a refresh. Extraction only happens when you send the captured images to your selected LLM provider. Google sync is optional, and when you use it the app goes through Firebase-backed token brokering so the browser does not hold your Google refresh token.

If you want the in-app walkthrough instead of GitHub docs, use the `/docs` page inside the app.

## For developers

### Quick start

```bash
npm install
npm --prefix functions install
npm run dev
```

### Deployment basics

Meishi deploys as a Vite-built SPA on Firebase Hosting with Firebase Functions handling the Google OAuth token broker.

```bash
firebase deploy
```

Use these deeper references when you need more than the quick path:

- [DEV-NOTES.md](./DEV-NOTES.md) for architecture, routes, storage boundaries, security posture, and deployment behavior
- [LOCAL-DEV.md](./LOCAL-DEV.md) for emulator setup and local auth/sync testing
- [functions/README.md](./functions/README.md) for the Functions workspace and token-broker details
- [AGENTS.md](./AGENTS.md) for repository-specific implementation and verification rules

## Technical snapshot

- React 18 + Vite 5 + TypeScript
- TanStack Router, Redux Toolkit, RTK Query
- Tailwind CSS and shadcn-style UI patterns
- IndexedDB via Dexie for images, drafts, and sync history
- `localStorage` for provider settings and non-sensitive preferences
- Firebase Auth + Functions for Google OAuth brokering
- `vite-plugin-pwa` for installable PWA behavior

## Repo map

- `src/modules/card-capture`: camera and import flows
- `src/modules/card-extraction`: provider adapters, structured output, schema validation
- `src/modules/contact-review`: editable contact review and debug views
- `src/modules/google-auth` and `src/modules/google-contacts`: Google connection and sync
- `src/modules/local-data`: browser persistence boundary
- `functions/`: Firebase Functions workspace for server-side auth handling

## Read more

- [DEV-NOTES.md](./DEV-NOTES.md)
- [LOCAL-DEV.md](./LOCAL-DEV.md)
- [functions/README.md](./functions/README.md)

[![Buy Me a Coffee](https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png)](https://www.buymeacoffee.com/mundanelunacy)
