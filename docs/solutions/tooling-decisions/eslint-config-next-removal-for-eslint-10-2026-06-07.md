---
title: Replacing eslint-config-next with hand-rolled flat config to unblock ESLint 10
date: 2026-06-07
last_updated: 2026-06-07
category: docs/solutions/tooling-decisions
module: eslint
problem_type: tooling_decision
component: development_workflow
severity: medium
applies_when:
  - Upgrading ESLint from v9 to v10 in a Next.js 16 + React 19 + TypeScript project
  - Using ESLint flat config (eslint.config.mjs)
  - Currently depending on eslint-config-next (which transitively pulls eslint-plugin-react@7.x)
symptoms:
  - "npm install reports ERESOLVE overriding peer dependency for eslint-plugin-react, eslint-plugin-jsx-a11y, eslint-plugin-import"
  - "eslint-plugin-react@7.x peer dep range caps at eslint ^9.7 — no v10 support"
  - "npm run lint crashes with: TypeError: contextOrFilename.getFilename is not a function (ESLint 10 removed this API)"
resolution_type: dependency_update
related_components:
  - tooling
  - documentation
tags:
  - eslint-10
  - eslint-config-next
  - eslint-react
  - flat-config
  - next.js
  - dependency-upgrade
---

# Replacing eslint-config-next with hand-rolled flat config to unblock ESLint 10

## Context

`eslint-config-next@16.x` (the package every Next.js project gets via `create-next-app` and the official lint setup) is the sole blocker for upgrading to ESLint 10 in a Next.js 16 + React 19 project. It depends on `eslint-plugin-react@^7.37.0`, which still calls the `context.getFilename()` API removed in ESLint 10 — so even after working around the peer-dep warnings, `npm run lint` crashes at runtime with `TypeError: contextOrFilename.getFilename is not a function` (vercel/next.js#89764).

Additionally, `eslint-config-next` also bundles `eslint-plugin-jsx-a11y@6.10.2` (caps at `eslint ^9`) and `eslint-plugin-import@2.32.0` (caps at `eslint ^9`) — all three trigger `ERESOLVE` overrides during `npm install` when ESLint 10 is present.

There is no upstream timeline for an ESLint 10–compatible `eslint-config-next` release as of June 7 2026.

For a small Next.js app, dropping `eslint-config-next` and assembling a flat config directly from the underlying plugins is a smaller diff than a `@eslint/compat` shim and removes the upstream dependency entirely. This approach was validated first in `seamuslowry/siobhan-oca` on 2026-05-10 (same stack).

## Guidance

### 1. Node version is not a concern here

ESLint 10 requires Node `^20.19.0 || ^22.13.0 || >=24`. This project runs Node 22.22.0 (`.nvmrc` and CI), which satisfies the `^22.13.0` range. No Node bump is needed — unlike `seamuslowry/siobhan-oca` which started on Node 22.12.0 and needed a floor bump first.

### 2. Install in the correct order

The required sequence — the same order used in both `siobhan-oca` and `hundred-and-ten-web`:

```bash
# Step 1: bump ESLint first
npm install --save-dev eslint@^10.3.0

# Step 2: drop eslint-config-next (removes transitive eslint-plugin-react,
# eslint-plugin-jsx-a11y, eslint-plugin-import, eslint-plugin-react-hooks,
# typescript-eslint)
npm uninstall eslint-config-next

# Step 3: add direct devDeps for everything we still want
npm install --save-dev \
  @eslint-react/eslint-plugin@^5.7.5 \
  @next/eslint-plugin-next@16.2.7 \
  eslint-plugin-react-hooks@^7.0.0 \
  typescript-eslint@^8.46.0
```

Pin `@next/eslint-plugin-next` to the same version as `next` itself — they ship in lockstep. `eslint-plugin-react-hooks` and `typescript-eslint` must be re-added explicitly because `eslint-config-next` was their only transitive consumer.

### 3. Rewrite `eslint.config.mjs`

**Before:**
```js
import { defineConfig } from 'eslint/config';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';

export default defineConfig([
  ...nextCoreWebVitals,
  js.configs.recommended,
  { plugins: { prettier }, rules: { 'prettier/prettier': 'error' } },
  { ignores: ['.next/**', 'out/**', 'build/**'] }
]);
```

**After:**
```js
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintReact from '@eslint-react/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default defineConfig([
  ...tseslint.configs.recommended,
  nextPlugin.configs['core-web-vitals'],
  {
    files: ['**/*.{js,jsx,mjs,ts,tsx}'],
    extends: [eslintReact.configs.recommended],
    plugins: { 'react-hooks': reactHooks, prettier },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'prettier/prettier': 'error'
    }
  },
  prettierConfig,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts'])
]);
```

Notes:
- `nextPlugin.configs['core-web-vitals']` is a flat-config object that self-registers `@next/next` and applies its rule set.
- `@eslint-react`'s `recommended` preset auto-injects `settings["react-x"]` for version detection. Don't add a `settings.react.version` block.
- `eslint-config-prettier` must come last; it disables stylistic rules from earlier configs that conflict with Prettier.
- Preserve the `globalIgnores` exactly — removing `out/**` causes ESLint to walk the static export and hang.
- This project uses `"trailingComma": "none"` in `.prettierrc` — do not add trailing commas to the config or `prettier/prettier` will error on the config file itself.

### 4. Plugins carried forward vs deferred

`eslint-config-next` bundles five plugins. Status after migration:

| Plugin | Action | Reason |
|---|---|---|
| `@next/eslint-plugin-next` | Re-added directly | Next-specific rules (`@next/next/*`); ships in lockstep with `next` |
| `eslint-plugin-react` | Replaced with `@eslint-react/eslint-plugin` | ESLint 10–ready successor |
| `eslint-plugin-react-hooks` | Re-added directly | Standard React hooks rules; works with ESLint 10 |
| `eslint-plugin-import` | Deferred | Caps at `eslint ^9`; ERESOLVE on ESLint 10; not firing on this codebase |
| `eslint-plugin-jsx-a11y` | Deferred | Same blocker: caps at `eslint ^9`; not firing on this codebase |

Both `eslint-plugin-import` and `eslint-plugin-jsx-a11y` can be revisited when:
- An ESLint 10–compatible release ships, or
- The codebase grows to the point where their signal is worth the `@eslint/compat` + `--legacy-peer-deps` workaround.

## Examples

Post-migration `npm run lint` (ESLint 10.4.1, exit 0):

```
✖ 4 problems (0 errors, 4 warnings)
```

Pre-migration baseline: `npm run lint` crashed with `ERR_MODULE_NOT_FOUND: @eslint/js` because the dependency tree was broken (ESLint 10 declared but npm resolved ESLint 9 to satisfy legacy plugins).

New warnings after swap:
- 1× `@eslint-react/no-context-provider` — React 19 prefers `<Context>` over `<Context.Provider>`
- 1× `@eslint-react/no-use-context` — React 19 prefers `use(Context)` over `useContext`
- 1× `@eslint-react/use-state` — lazy initial state for `useState` with a function call
- 1× `@eslint-react/set-state-in-effect` — `setState` called synchronously in an effect

These are real codebase findings (not false positives), worth addressing in a follow-up PR.

## What Didn't Work

### 1. `@eslint/compat` + `fixupPluginRules()` shim

Considered and rejected: the shim polyfills the removed `context.getFilename()` API but still requires `--legacy-peer-deps` for the npm peer-dep range. The `eslint-plugin-react` plugin arrives transitively via `eslint-config-next`, meaning the shim would need to reach into `eslint-config-next`'s exported config array and mutate a plugin object inside it. Brittle against Next's internal plugin layout changes.

Hand-rolling ~35 lines of flat config is simpler and more durable.

### 2. Waiting for upstream

vercel/next.js#89764 has been open since early 2026 without a fix shipping. PR #90068 (community `@eslint/compat` fix) has been open since Feb 17 2026 without maintainer review. No upstream timeline.

## Rollback

If `eslint-config-next` ships ESLint 10 support:

1. `git revert <this-commit-sha>`
2. `npm install`
3. `npm run lint` to confirm green

The change is contained to `eslint.config.mjs` and `package.json` — self-contained and reversible.

## Related

- vercel/next.js#89764 — ESLint v10 runtime crash, label `linear: next`, open as of June 7 2026
- vercel/next.js#90068 — community `@eslint/compat` fix, open without maintainer review since Feb 17 2026
- `seamuslowry/siobhan-oca` — same migration pattern, validated May 10 2026; see `docs/solutions/tooling-decisions/eslint-config-next-removal-for-eslint-10-2026-05-10.md`
- `seamuslowry/hundred-and-ten-web` — earlier Vite-based precedent (direct `eslint-plugin-react` swap, no `eslint-config-next`); see `docs/solutions/tooling-decisions/eslint-plugin-react-to-eslint-react-upgrade-2026-05-09.md`
- [`@eslint-react/eslint-plugin` on npm](https://www.npmjs.com/package/@eslint-react/eslint-plugin)
- [`@next/eslint-plugin-next` on npm](https://www.npmjs.com/package/@next/eslint-plugin-next)
