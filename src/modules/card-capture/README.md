# Card Capture Module

## Responsibilities

- Let users capture business-card images from a mobile camera or local image library.
- Normalize captured files into the app's `CapturedCardImage` interface.
- Persist the active capture session locally.

## Features

- Camera input with `capture="environment"`
- Multi-image upload
- Image metadata extraction
- Active-session persistence to IndexedDB

## Interfaces

- Exposes:
  - `createCapturedCardImages`
  - `CaptureWorkspace`
- Produces:
  - `CapturedCardImage[]`
- Depends on:
  - `src/modules/local-data`
  - `src/modules/contact-review`

## Constraints

- Compression can be added later, but only if it preserves LLM extraction quality.
- Keep the capture module independent from provider-specific extraction logic.
