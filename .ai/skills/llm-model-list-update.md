# Skill: LLM Model List Update

Use this skill when updating the selectable OpenAI, Anthropic, or Gemini model lists, model labels, or default provider model settings.

## Confirmation Sources

The model lists are time-sensitive. Always re-check provider developer docs before changing model IDs.

Last confirmation performed: 2026-04-28.

Pages visited during the 2026-04-28 confirmation:

- OpenAI Models: https://developers.openai.com/api/docs/models
  - Confirmed `gpt-5.5` as the newest listed flagship option.
  - Confirmed `gpt-5.4`, `gpt-5.4-mini`, and `gpt-5.4-nano` remained current selectable options.
- Anthropic Models Overview: https://platform.claude.com/docs/en/about-claude/models/overview
  - Confirmed latest comparison entries: `claude-opus-4-7`, `claude-sonnet-4-6`, and `claude-haiku-4-5-20251001`.

If Gemini model options are being changed, also check the current Gemini model docs before editing:

- Gemini models: https://ai.google.dev/gemini-api/docs/models

## Files To Inspect

Read `src/modules/onboarding-settings/README.md` before editing.

Primary files:

- `src/modules/onboarding-settings/modelOptions.ts`
  - Owns selectable model IDs and labels.
  - Preserve `getSupportedModelOptions` legacy saved-model behavior.
- `src/modules/local-data/storage.ts`
  - Owns `defaultSettings`, including provider default models.
- `src/modules/onboarding-settings/llmKeyValidation.ts`
  - Usually does not need model-specific edits, but tests may assert default-generated provider URLs.
- `src/modules/card-extraction/structuredExtraction.ts`
  - Usually does not need edits for literal model-list changes because it passes selected model strings through.

## Update Process

1. Re-check provider docs and note the date and exact URLs in this skill if the source list changes.
2. Update `modelOptions.ts` with current model IDs and user-facing labels.
3. Change `defaultSettings` only when the requested behavior explicitly changes defaults. Do not silently migrate existing users.
4. Keep provider-specific API behavior behind the existing validation and extraction boundaries.
5. Preserve saved legacy model handling so persisted unknown model IDs remain selectable instead of disappearing.
6. Update tests that assert dropdown contents, default model IDs, generated validation URLs, or default-shaped fixtures.

## Tests

Run the narrowest relevant tests first:

```sh
npm run test -- src/modules/onboarding-settings src/modules/local-data
```

If extraction or route fixtures were touched, also run the specific affected test files.

Before handoff, run:

```sh
npm run typecheck
npm run lint
```

If full lint fails outside the touched browser modules, record the existing failure and run scoped ESLint on the changed browser paths.
