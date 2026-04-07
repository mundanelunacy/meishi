# Card Capture Module

## Responsibilities

- Let users capture business-card images from a mobile camera or local image library.
- Normalize captured files into the app's `CapturedCardImage` interface.
- Persist the active capture session locally.

## Features

- Native camera-file-input flow on mobile devices, using
  `capture="environment"` as a rear-camera hint
- Live camera preview and snapshot capture via `getUserMedia()` on desktop
  devices and browsers that support it, presented in a large modal dialog
- Rear-camera preference for live-preview camera constraints with front-camera
  fallback when no rear-facing device is detected
- File-input camera fallback for browsers that do not support live webcam APIs
- Multi-image upload
- Image metadata extraction
- Active-session persistence to IndexedDB
- Header-level photoroll clear action for removing all active-session images at once
- Per-image removal from the active capture session
- Extraction handoff into a persisted review draft
- Development-only capture diagnostics that survive reloads, including page
  session markers, lifecycle logging, and optional image downscaling via
  `captureDebugMaxEdge`

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
- Extraction must always run against the current persisted active session images.
- Some mobile browsers may still show a camera-or-library chooser because
  `capture` remains a browser hint rather than a guaranteed native-camera mode.
- Development-only downscaling is for investigation only and should not be
  treated as the production capture path.
