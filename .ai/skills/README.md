# Skills Index

This directory holds project-local and imported skill instructions for future agents. Read the relevant skill before changing the matching area of the app, then follow the repo guidance in `AGENTS.md`, module `README.md` files, `DEV-NOTES.md`, and `functions/README.md` as applicable.

## Project Skills

- [`docs-sync.md`](docs-sync.md): Use when a code change alters module boundaries, public interfaces, persistence shape, integration behavior, or documentation expectations.
- [`formatjs-extract-workflow.md`](formatjs-extract-workflow.md): Use when adding, removing, or renaming `react-intl` message descriptors and regenerating locale catalogs.
- [`google-auth-contacts.md`](google-auth-contacts.md): Use when changing Google Identity Services auth, Google Contacts sync, contact creation, or contact photo upload behavior.
- [`openai-business-card-extraction.md`](openai-business-card-extraction.md): Use when changing the OpenAI-backed business card extraction pipeline, schema validation, or provider abstraction.
- [`project-bootstrap.md`](project-bootstrap.md): Use when bootstrapping or reshaping the project foundation, stack configuration, routing structure, shared types, or dependencies.
- [`pwa-camera-storage.md`](pwa-camera-storage.md): Use when changing card capture, service worker behavior, offline behavior, local image storage, drafts, or IndexedDB persistence.

## Imported Skills

- [`firebase-basics/SKILL.md`](firebase-basics/SKILL.md): Use as the foundational Firebase reference for Firebase CLI setup, project context, service initialization, SDK setup, and Firebase operational workflows.
- [`firebase-auth-basics/SKILL.md`](firebase-auth-basics/SKILL.md): Use when working with Firebase Authentication, anonymous identity, sign-in providers, user identity, or auth-dependent security behavior.
- [`firebase-firestore-standard/SKILL.md`](firebase-firestore-standard/SKILL.md): Use when working with Firestore Standard Edition provisioning, security rules, indexes, or SDK usage. In this repo, remember that direct browser Firestore access is intentionally denied.
- [`firebase-hosting-basics/SKILL.md`](firebase-hosting-basics/SKILL.md): Use when working with Firebase Hosting configuration, SPA rewrites, preview channels, hosting emulation, or deployment.
- [`integration-react-tanstack-router-file-based/SKILL.md`](integration-react-tanstack-router-file-based/SKILL.md): Use when adding or revising PostHog analytics in React with TanStack Router file-based routing.

## How To Use This Directory

1. Start with this index to identify the relevant skill.
2. Read only the matching skill file and any references it explicitly points to.
3. Prefer project-local skills for Meishi-specific architecture and imported skills for vendor-specific workflows.
4. If a task spans several areas, combine the smallest relevant set of skills and document any changed contracts in the same change.
