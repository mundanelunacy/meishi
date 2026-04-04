# Contact Review Module

## Responsibilities

- Present source business-card images and an editable contact form together.
- Preserve user edits before sync.
- Finalize a `VerifiedContact` payload for Google sync.

## Features

- Split review workspace with image selection and editable fields
- Confidence-note display from extraction
- Draft persistence and restore support
- Sync trigger after verification

## Interfaces

- Exposes:
  - `reviewDraftSlice`
  - `ReviewWorkspace`
- Owns:
  - `ContactDraft`
  - `VerifiedContact`
- Consumes:
  - `CapturedCardImage[]`
  - extraction results from `src/modules/card-extraction`
  - sync mutations from `src/modules/google-contacts`

## Constraints

- Keep form validation local and deterministic.
- Never write directly to Google Contacts from extraction output without passing through this module.
