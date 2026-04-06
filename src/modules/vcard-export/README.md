# vCard Export Module

## Responsibilities

- Build a browser-shareable or downloadable vCard artifact from a reviewed contact.
- Keep vCard-specific formatting and filename rules out of review UI and Google sync code.

## Features

- Pure `VerifiedContact` to vCard 3.0 serialization
- Web Share API helper for native share-sheet export when supported
- Browser download fallback for `.vcf` export
- Filename generation derived from reviewed contact metadata
- Preservation of non-standard and ambiguous card text through `X-` fields and notes

## Interfaces

- Exposes:
  - `buildContactVCard`
  - `buildVCardFileName`
  - `downloadContactVCard`
  - `saveContactVCard`
- Consumes:
  - `VerifiedContact`

## Constraints

- Remain browser-only; do not introduce backend or filesystem dependencies.
- Keep share/download behavior explicit and user-triggered from the review flow.
- Prefer the native share sheet when the browser can share files, but fall back to file download when file sharing is unavailable or unreliable.
- Preserve fidelity for non-standard card data through `NOTE` and `X-` fields.
