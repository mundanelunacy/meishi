# Google Contacts Module

## Responsibilities

- Map a verified local contact into Google People API payloads.
- Create Google contacts.
- Upload one selected contact photo after contact creation.
- Track sync outcomes and partial-failure behavior.

## Features

- RTK Query mutations for `people.createContact`
- RTK Query mutation for `people.updateContactPhoto`
- Sync status tracking
- Local recording of sync results
- Mock-mode sync responses for local development when Google auth is explicitly mocked

## Interfaces

- Exposes:
  - `googlePeopleApi`
  - `useCreateContactMutation`
  - `useUpdateContactPhotoMutation`
  - sync status selectors/actions
- Consumes:
  - `VerifiedContact`
  - selected source image

## External docs

- [people.createContact](https://developers.google.com/people/api/rest/v1/people/createContact)
- [people.updateContactPhoto](https://developers.google.com/people/api/rest/v1/people/updateContactPhoto)

## Constraints

- Google Contacts does not support arbitrary multi-image business-card attachments in this flow.
- Mutating contact creation and photo upload should remain sequential.
- Mock-mode responses must remain clearly limited to local development and should not obscure the real production Google API boundary.
