# Skill: PWA Camera and Storage

Use this skill when changing capture flow, service worker behavior, or local persistence.

## Guardrails

- Prefer direct camera/file inputs over heavy native bridges.
- Keep images and drafts recoverable through IndexedDB.
- Do not overstate offline support when extraction and sync require the network.

## Verification

1. Check mobile capture behavior.
2. Check session restore after refresh.
3. Check that service worker changes do not break route loading.
