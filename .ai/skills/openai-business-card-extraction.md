# Skill: OpenAI Business Card Extraction

Use this skill when changing the extraction pipeline.

## Guardrails

- Keep OpenAI behind the provider abstraction.
- Preserve a strict schema for extraction output.
- Do not send extraction output directly to Google Contacts without review.
- Keep the BYOK prototype warning in docs and UI.

## Verification

1. Validate request shape.
2. Validate structured output parsing.
3. Confirm invalid model output fails closed.
4. Update extraction schema docs when fields change.
