# Contact Review Module

## Responsibilities

- Present source business-card images and an editable contact form together.
- Preserve user edits before sync.
- Finalize a `VerifiedContact` payload for Google sync.

## Features

- Split review workspace with capture-style photoroll lightbox, upload-image selection, and editable fields
- Header-level photoroll clear action that removes all current source images without resetting reviewed contact fields
- Google-Contacts-aligned scalar editing for name/company details such as prefix, phonetic name parts, nickname, file-as, and department
- Dynamic Google-Contacts-style repeatable sections for emails, phone numbers, addresses, websites, related people, significant dates, and custom fields
- Google-Contacts-style collapsed "show more" behavior for optional review fields, with automatic expansion when extraction already filled hidden fields
- Broom-action reset for clearing reviewed contact form data while keeping source images available in the workspace
- Confidence-note display from extraction
- Draft persistence and restore support
- Persisted raw extraction snapshot for traceability
- Review draft notes preserve extracted `X-` fields and ambiguous text so fidelity is not lost when non-standard or ambiguous card data appears
- Inline `?debug=1` preview for raw extraction, vCard, and Google payload inspection
- Explicit export actions for saving a vCard or syncing to Google after verification
- Save actions stay disabled until the reviewed form contains meaningful contact data
- On-demand Google authorization from review before sync when no Google session is active

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
  - `useSyncGoogleContact` from `src/modules/google-contacts`
  - `downloadContactVCard` from `src/modules/vcard-export`

## Constraints

- Keep form validation local and deterministic.
- Never write directly to Google Contacts from extraction output without passing through this module.
- Keep Google create-plus-photo-upload orchestration inside `src/modules/google-contacts`; this module should only finalize the reviewed contact and trigger sync.
- If Google auth is missing when sync is requested, this module may start authorization and then resume the sync flow after auth succeeds.
- Keep vCard serialization and browser download logic inside `src/modules/vcard-export`; this module should only finalize the reviewed contact and trigger export.
- Developer debug preview must reflect the current edited form values, not just the initial extraction response.
- Review autosave must not reset in-progress edits while dynamic field arrays are being added or removed.
