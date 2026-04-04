# Skill: Project Bootstrap

Use this skill when bootstrapping or reshaping Meishi's foundation.

## Goals

- Preserve the TypeScript-only requirement.
- Keep the stack aligned with React, Vite, TanStack Router, Redux Toolkit, and shadcn-style components.
- Prefer browser-compatible dependencies.

## Checklist

1. Update config files first.
2. Keep route structure file-based under `src/routes`.
3. Keep shared types under `src/shared/types`.
4. If a dependency is server-oriented, justify its browser compatibility before adding it.
5. Update the root README and the affected module README in the same change.
