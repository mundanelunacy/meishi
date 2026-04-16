# Skill: FormatJS Extract Workflow

Use this skill whenever you add, remove, or rename `react-intl` messages.

## Scope

- Keep the extraction workflow out of `package.json` unless the project explicitly decides to automate it later.
- Treat route-local message sources such as `src/modules/app-shell/docsContent.tsx`, `src/modules/onboarding-settings/onboardingContent.tsx`, and route workspace/components as the source of truth for message descriptors.
- Keep `src/app/locales/en-US.messages.json` as the extracted source catalog.
- Keep runtime translations in locale files such as `src/app/locales/ja.json`.

## Current command

Run the native FormatJS CLI directly from the repo root:

```bash
npx @formatjs/cli extract "src/app/**/*.{ts,tsx}" "src/modules/**/*.{ts,tsx}" "src/routes/**/*.{ts,tsx}" "src/shared/**/*.{ts,tsx}" --ignore "**/*.test.*" --out-file src/app/locales/en-US.messages.json
```

## Rules

- Re-run extraction after changing any message descriptor IDs or default messages.
- Do not hand-edit `src/app/locales/en-US.messages.json`; regenerate it.
- Update translated locale files such as `src/app/locales/ja.json` after extraction changes land.
- Keep page copy and schema copy driven from the same descriptor source so translations do not drift.
- If a glob-based extract fails on declaration files or other non-message sources, narrow the input set rather than hand-editing the extracted catalog.
