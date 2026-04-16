# Skill: FormatJS Extract Workflow

Use this skill whenever you add, remove, or rename `react-intl` messages, or when you add or remove a supported app locale.

## Scope

- Keep the extraction workflow out of `package.json` unless the project explicitly decides to automate it later.
- Treat route-local message sources such as `src/modules/app-shell/docsContent.tsx`, `src/modules/onboarding-settings/onboardingContent.tsx`, and route workspace/components as the source of truth for message descriptors.
- Keep `src/app/locales/en-US.messages.json` as the extracted source catalog.
- Keep runtime translations in locale files such as `src/app/locales/ja.json` and `src/app/locales/ko.json`.
- Treat locale support as a cross-module change owned primarily by:
  - `src/modules/app-shell/README.md` for shell/docs/legal locale behavior
  - `src/modules/onboarding-settings/README.md` for locale selection and settings behavior
  - `src/modules/local-data/README.md` for locale persistence and sanitization behavior

## Current command

Run the native FormatJS CLI directly from the repo root:

```bash
npx @formatjs/cli extract "src/app/**/*.{ts,tsx}" "src/modules/**/*.{ts,tsx}" "src/routes/**/*.{ts,tsx}" "src/shared/**/*.{ts,tsx}" --ignore "**/*.test.*" --out-file src/app/locales/en-US.messages.json
```

## Rules

- Re-run extraction after changing any message descriptor IDs or default messages.
- Do not hand-edit `src/app/locales/en-US.messages.json`; regenerate it.
- Update translated locale files such as `src/app/locales/ja.json` and `src/app/locales/ko.json` after extraction changes land.
- Keep page copy and schema copy driven from the same descriptor source so translations do not drift.
- If a glob-based extract fails on declaration files or other non-message sources, narrow the input set rather than hand-editing the extracted catalog.

## Adding a locale

When adding a new supported locale, treat it as a product-surface change rather than just a translation-file change.

1. Add the runtime locale file under `src/app/locales/`, typically by copying an existing translated locale file and replacing the values.
2. Update the locale union and shared labels in the runtime locale entrypoints:
   - `src/shared/types/models.ts`
   - `src/app/intl.ts`
3. Update locale sanitization and persistence boundaries so unknown values still fall back to `en-US`:
   - `src/modules/local-data/storage.ts`
4. Update any locale-typed schema or content helpers that still hard-code the supported locale union instead of importing `AppLocale`, especially:
   - `src/shared/seo/jsonLd.ts`
   - `src/modules/app-shell/DocsPage.tsx`
   - `src/modules/onboarding-settings/onboardingContent.tsx`
5. Update locale-facing tests so the new locale is exercised through:
   - the header language picker
   - the settings language picker
   - docs rendering and JSON-LD output
6. Update the relevant module docs if the supported locale list or ownership boundary changed:
   - `src/modules/app-shell/README.md`
   - `src/modules/onboarding-settings/README.md`
   - `src/modules/local-data/README.md` when persistence behavior changes
7. Keep higher-level docs concise. In `AGENTS.md` and `DEV-NOTES.md`, add or update pointers to this workflow instead of duplicating the checklist there.

## Verification

For locale additions or translation-catalog changes, prefer this verification order:

1. `npm run typecheck`
2. Focused tests for shell/docs/settings locale behavior
3. `npm run lint`

If you add or rename message descriptors while doing the locale work, run the extract command above and then update all runtime locale files to match the regenerated source catalog.
