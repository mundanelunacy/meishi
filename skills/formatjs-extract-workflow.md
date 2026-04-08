# Skill: FormatJS Extract Workflow

Use this skill whenever you add, remove, or rename `react-intl` messages.

## Scope

- Keep the extraction workflow out of `package.json` unless the project explicitly decides to automate it later.
- Treat `src/modules/app-shell/docsContent.tsx` as the current source of truth for docs-page message descriptors.
- Keep `src/app/locales/en-US.messages.json` as the extracted source catalog.
- Keep runtime translations in locale files such as `src/app/locales/ja.json`.

## Current command

Run the native FormatJS CLI directly from the repo root:

```bash
formatjs extract src/modules/app-shell/docsContent.tsx --out-file src/app/locales/en-US.messages.json
```

## Rules

- Re-run extraction after changing any message descriptor IDs or default messages.
- Do not hand-edit `src/app/locales/en-US.messages.json`; regenerate it.
- Update translated locale files such as `src/app/locales/ja.json` after extraction changes land.
- Keep page copy and schema copy driven from the same descriptor source so translations do not drift.
