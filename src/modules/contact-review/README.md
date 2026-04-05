# Contact Review Module

## Responsibilities

- Present source business-card images and an editable contact form together.
- Preserve user edits before sync.
- Finalize a `VerifiedContact` payload for Google sync.

## Features

- Split review workspace with image selection and editable fields
- Google-Contacts-aligned scalar editing for name/company details such as prefix, phonetic name parts, nickname, file-as, and department
- Dynamic Google-Contacts-style repeatable sections for emails, phone numbers, addresses, websites, related people, significant dates, and custom fields
- Confidence-note display from extraction
- Draft persistence and restore support
- Persisted raw extraction snapshot for traceability
- Review draft notes preserve extracted `X-` fields and ambiguous text so fidelity is not lost when non-standard or ambiguous card data appears
- Inline developer debug preview for raw extraction, vCard, and Google payload inspection
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
- Developer debug preview must reflect the current edited form values, not just the initial extraction response.
- Review autosave must not reset in-progress edits while dynamic field arrays are being added or removed.
