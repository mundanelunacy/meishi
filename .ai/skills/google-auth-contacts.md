# Skill: Google Auth and Contacts

Use this skill when changing Google sign-in or Google Contacts sync behavior.

## Guardrails

- Use Google Identity Services token flow for browser auth.
- Use Google People API for contact creation and photo upload.
- Do not treat Google access tokens as durable settings.
- Keep contact creation and photo upload as separate sequential steps.
- Assume only one image can be uploaded remotely as the contact photo in v1.

## Verification

1. Check scope usage.
2. Confirm token expiry behavior.
3. Test create-contact and photo-upload paths separately.
4. Update module docs if field mapping changes.
