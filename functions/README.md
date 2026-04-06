# Firebase Functions

This workspace contains the Firebase Cloud Functions code for Meishi.

## Responsibility

- Holds server-side TypeScript entrypoints under `src/`
- Builds deployable output into `lib/`
- Runs its own lint and TypeScript checks before deploy
- Provides the place for secrets-backed or privileged integrations that should
  not live in the browser bundle

The main app is still a browser-first PWA. Add Cloud Functions only for work
that should move off the client, such as secret-bearing API calls, webhook
handlers, or server-side orchestration.

## Workspace layout

- `src/`: authored TypeScript source
- `lib/`: compiled JavaScript output used by Firebase deploy
- `package.json`: functions-only scripts and dependencies
- `.eslintrc.js`: legacy ESLint config for this workspace
- `tsconfig.json`: TypeScript build config
- `tsconfig.dev.json`: local config used by ESLint parser options

## Install

From the repo root:

```bash
npm --prefix functions install
```

## Common commands

Lint:

```bash
npm --prefix functions run lint
```

Build:

```bash
npm --prefix functions run build
```

Start the emulator:

```bash
npm --prefix functions run serve
```

Open the Firebase functions shell:

```bash
npm --prefix functions run shell
```

Deploy only functions:

```bash
npm --prefix functions run deploy
```

View deployed logs:

```bash
npm --prefix functions run logs
```

## Deploy path

When you run `firebase deploy` from the repo root, Firebase reads the functions
target from [firebase.json](/Users/mundanelunacy/Projects/meishi/firebase.json)
and then executes:

1. `npm --prefix "$RESOURCE_DIR" run lint`
2. `npm --prefix "$RESOURCE_DIR" run build`
3. the actual functions deploy

This means a broken lint or TypeScript build in this workspace blocks both the
functions deploy and a combined `firebase deploy`.

## ESLint note

This workspace still uses a legacy ESLint config in `.eslintrc.js`, while the
repo root uses flat config in
[eslint.config.js](/Users/mundanelunacy/Projects/meishi/eslint.config.js).

Because of that split, the `lint` script in
[functions/package.json](/Users/mundanelunacy/Projects/meishi/functions/package.json)
explicitly sets:

```bash
ESLINT_USE_FLAT_CONFIG=false
```

That forces ESLint to use the functions-local legacy config during Firebase
predeploy. If that environment variable is removed, Firebase deploy may fail
with an error like `Invalid option '--ext'` because the legacy CLI flags would
be interpreted in flat-config mode.

## Adding a new function

1. Add the handler in `src/index.ts` or split it into a local module and export
   it from `src/index.ts`
2. Run:

```bash
npm --prefix functions run lint
npm --prefix functions run build
```

3. Test with the emulator before deploying if the function has runtime
   behavior worth validating
4. Deploy with:

```bash
firebase deploy --only functions
```

## Config guidance

- Keep browser-only env vars in the root Vite env files; those are compiled into
  Hosting output
- Keep server-only secrets out of `VITE_*` variables and out of browser code
- Prefer putting privileged credentials, API keys, and any sensitive
  orchestration behind Functions instead of exposing them to the client

## Troubleshooting

- Lint failure:
  run `npm --prefix functions run lint` directly
- TypeScript build failure:
  run `npm --prefix functions run build`
- Emulator startup issue:
  confirm you ran `npm --prefix functions install`
- `Invalid option '--ext'` from ESLint:
  confirm the lint script still sets `ESLINT_USE_FLAT_CONFIG=false`
