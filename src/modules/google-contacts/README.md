# Google Contacts Module

## Responsibilities

- Map a verified local contact into Google People API payloads.
- Create Google contacts.
- Upload one selected contact photo after contact creation.
- Track sync outcomes and partial-failure behavior.

## Features

- RTK Query mutations for `people.createContact`
- RTK Query mutation for `people.updateContactPhoto`
- Pure `VerifiedContact` mappers for Google payload and vCard preview
- Google People mapping for extended name/company fields including prefix, phonetic name parts, nickname, file-as, and department
- Multi-value mapping for emails, phones, URLs, and addresses
- Related people, significant dates, and user-defined custom field mapping aligned with the Google Contacts edit model
- Sync status tracking
- Local recording of sync results
- Mock-mode sync responses for local development when Google auth is explicitly mocked

## Interfaces

- Exposes:
  - `googlePeopleApi`
  - `useCreateContactMutation`
  - `useUpdateContactPhotoMutation`
  - `buildContactPayload`
  - `buildContactVCard`
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
- Mock-mode responses must remain clearly limited to local development and should not obscure the real production Google API boundary.
- The vCard output is a developer preview artifact; Google sync still uses the People API payload plus a separate photo-upload step.
- Non-standard and ambiguous extracted fields are preserved in vCard `X-` lines and folded into notes for sync fidelity.
- Google People events require structured dates; non-date "significant data" text remains preserved locally through notes and custom fields.
