# Google Contacts Module

## Responsibilities

- Map a verified local contact into Google People API payloads.
- Create Google contacts.
- Upload one selected contact photo after contact creation.
- Track sync outcomes and partial-failure behavior.

## Features

- RTK Query mutations for `people.createContact`
- RTK Query mutation for `people.updateContactPhoto`
- Module-owned sync orchestration via `useSyncGoogleContact`
- Browser-side token acquisition through the Firebase-backed google-auth module
- Pure `VerifiedContact` mapper for Google payload generation
- Google People mapping for extended name/company fields including prefix, phonetic name parts, nickname, file-as, and department
- Multi-value mapping for emails, phones, URLs, and addresses
- Related people, significant dates, and user-defined custom field mapping aligned with the Google Contacts edit model
- Sync status tracking
- Local recording of sync results
- Three-attempt contact-photo upload retry before degrading to partial success

## Interfaces

- Exposes:
  - `useSyncGoogleContact`
  - `googlePeopleApi`
  - `useCreateContactMutation`
  - `useUpdateContactPhotoMutation`
  - `buildContactPayload`
  - sync status selectors/actions
- Consumes:
  - `VerifiedContact`
  - selected source image

## External docs

- [people.createContact](https://developers.google.com/people/api/rest/v1/people/createContact)
- [people.updateContactPhoto](https://developers.google.com/people/api/rest/v1/people/updateContactPhoto)
- [Person resource fields](https://developers.google.com/people/api/rest/v1/people)

## Constraints

- Google Contacts does not support arbitrary multi-image business-card attachments in this flow.
- Mutating contact creation and photo upload should remain sequential.
- Contact creation is never rolled back if the photo upload fails after 3 attempts.
- Exhausted photo-upload failure is recorded as partial success via `photoUploaded: false`.
- The browser should obtain Google bearer tokens through the google-auth module, not from Redux or persistent browser storage.
- Non-standard and ambiguous extracted fields are preserved in vCard `X-` lines and folded into notes for sync fidelity.
- Google People events require structured dates; non-date "significant data" text remains preserved locally through notes and custom fields.
