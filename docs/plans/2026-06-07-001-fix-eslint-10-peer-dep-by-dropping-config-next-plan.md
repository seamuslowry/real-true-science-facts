---
title: 'fix: Resolve ESLint 10 peer-dep failure by replacing eslint-config-next with hand-rolled flat config'
type: fix
status: active
date: 2026-06-07
---

# fix: Resolve ESLint 10 peer-dep failure by replacing eslint-config-next with hand-rolled flat config

## Overview

`eslint-config-next@16.2.7` bundles three plugins that cap their peer-dep range at ESLint 9: `eslint-plugin-react@7.37.5`, `eslint-plugin-jsx-a11y@6.10.2`, and `eslint-plugin-import@2.32.0`. This causes `ERESOLVE` during `npm install` now that `package.json` declares `eslint: "^10"`. The fix — already applied in the sibling repo `seamuslowry/siobhan-oca` (same stack: Next.js 16 + React 19 + TypeScript flat config) — is to drop `eslint-config-next` and compose the flat config directly from the underlying plugins that do support ESLint 10.

---

## Problem Frame

The repo's `package.json` was bumped to `eslint: "^10"` (currently resolving to 10.4.1) but `node_modules` still has 9.39.2 installed because `npm install` cannot resolve the peer-dep conflicts introduced by `eslint-config-next`'s transitive plugin tree:

| Plugin (via eslint-config-next) | Peer dep cap | Conflict |
|---|---|---|
| `eslint-plugin-react@7.37.5` | `eslint ^9.7` | ERESOLVE on ESLint 10 + runtime crash (`context.getFilename` removed) |
| `eslint-plugin-jsx-a11y@6.10.2` | `eslint ^9` | ERESOLVE on ESLint 10 |
| `eslint-plugin-import@2.32.0` | `eslint ^9` | ERESOLVE on ESLint 10 |

Even forcing `--legacy-peer-deps` does not fully resolve the problem: `eslint-plugin-react@7.x` calls `context.getFilename()`, which was removed in ESLint 10, causing a runtime crash on the first `npm run lint` invocation (vercel/next.js#89764). There is no upstream timeline for an ESLint-10-compatible `eslint-config-next` release.

The sibling repo `seamuslowry/siobhan-oca` solved this identically on 2026-05-10 and documented the migration thoroughly in `docs/solutions/tooling-decisions/eslint-config-next-removal-for-eslint-10-2026-05-10.md`.

---

## Requirements Trace

- R1. `npm install` on a clean checkout completes without `ERESOLVE` errors (peer-dep warnings are acceptable).
- R2. `npm run lint` exits 0 on the current source tree with ESLint 10. New warnings from `@eslint-react`'s stricter rule set are acceptable; new errors are not.
- R3. `package.json` no longer lists `eslint-config-next`. ESLint version stays `^10`.
- R4. `eslint.config.mjs` imports nothing from `eslint-config-next`.
- R5. Prettier enforcement via `eslint-plugin-prettier` is unchanged.
- R6. The `Code Quality / NPM Lint` CI job (`.github/workflows/lint.yml`, Node 22.22.0) passes on the PR.

---

## Scope Boundaries

- Not enabling `recommended-type-checked` or `recommended-typescript` presets for `@eslint-react` — no typed linting, minimal-diff migration.
- Not resolving any new warnings surfaced by `@eslint-react`'s stricter rule set — those go in a follow-up PR if needed.
- Not re-adding `eslint-plugin-import` or `eslint-plugin-jsx-a11y` — both cap at ESLint 9; neither is currently firing on this small codebase.
- Not changing `next.config.mjs`, deployment configuration, or any non-ESLint tooling.
- Not touching `package.json` `engines.node` minimum unless it blocks install (current floor is `>=18.17.0`; Node 22.22.0 is already in use locally and in CI).

### Deferred to Follow-Up Work

- Resolving new lint warnings introduced by `@eslint-react/recommended` (expected: `no-array-index-key` and similar): separate PR after CI is green.
- Re-evaluating return to `eslint-config-next` once Vercel ships ESLint 10 support: tracked informally, no scheduled work.

---

## Context & Research

### Relevant Code and Patterns

- `eslint.config.mjs` — current flat config; imports `eslint-config-next/core-web-vitals` and `@eslint/js`, registers `eslint-plugin-prettier`.
- `package.json` — declares `eslint: "^10"`, `eslint-config-next: 16.2.7`, `eslint-config-prettier: ^10.1.8`, `eslint-plugin-prettier: ^5.5.6`. No direct dep on `eslint-plugin-react` or `eslint-plugin-react-hooks` — both arrive transitively via `eslint-config-next`.
- `.github/workflows/lint.yml` — reusable workflow via `seamuslowry/workflows`; uses Node 22.22.0. Node floor satisfies ESLint 10 engine requirements (`^22.13.0`).

### Reference Implementation (siobhan-oca)

The pattern to follow is documented in:

- `~/git/siobhan-oca/docs/solutions/tooling-decisions/eslint-config-next-removal-for-eslint-10-2026-05-10.md` — authoritative solution doc
- `~/git/siobhan-oca/docs/plans/2026-05-10-001-chore-eslint-10-upgrade-plan.md` — the plan this one mirrors
- `~/git/siobhan-oca/eslint.config.mjs` — post-migration config to reference
- `~/git/hundred-and-ten-web/docs/solutions/tooling-decisions/eslint-plugin-react-to-eslint-react-upgrade-2026-05-09.md` — earlier Vite-based precedent

**Key siobhan-oca findings to carry forward:**

1. `@eslint-react/recommended` preset is slightly stricter than `eslint-plugin-react/recommended` — expect new warnings (no-array-index-key, etc.) but not new errors on a typical small codebase.
2. `@eslint-react/static-components` can false-positive on JSX dynamic-tag patterns (`const { tag: Tag } = ...`). Fix with a function-block-scoped disable, not `eslint-disable-next-line`.
3. `globalIgnores` must be preserved — dropping it causes ESLint to walk `out/` and `.next/` directories which either hangs or takes minutes.
4. `@eslint/compat` + `fixupPluginRules()` was considered and rejected: it doesn't fix the npm peer-dep range, still requires `--legacy-peer-deps`, and leaves a brittle shim against `eslint-config-next` internals.
5. Install order matters: bump ESLint → uninstall `eslint-config-next` → add new plugins. Reversing the order produces ERESOLVE.

### Institutional Learnings

- No `docs/solutions/` directory exists in this repo yet. The plan creates the first entry.

---

## Key Technical Decisions

- **Drop `eslint-config-next` entirely; do not shim with `@eslint/compat`.** The Next.js-specific lint rules come from `@next/eslint-plugin-next` which this config will depend on directly. `eslint-config-next` is only a wrapper that bundles that plugin alongside the three ESLint-9-capped plugins we cannot use.
- **Use `@eslint-react/eslint-plugin` `recommended` preset, not `recommended-typescript` or `recommended-type-checked`.** At the current version, `recommended` and `recommended-typescript` are functionally identical; `recommended-type-checked` requires typed linting (slower) and is not worth adding for a static-export site.
- **Pin `@next/eslint-plugin-next` to the same minor as `next` (16.2.7 or closest available).** They ship in lockstep; mismatched versions can produce confusing rule errors.
- **Defer `eslint-plugin-import` and `eslint-plugin-jsx-a11y`.** Both cap at ESLint 9. Neither is currently surfacing findings on this small source tree. Adding them would re-introduce the same peer-dep blocker.
- **Keep `eslint-plugin-prettier` and `eslint-config-prettier`.** Both already support ESLint 10 and are unchanged.
- **Keep current Node 22.22.0** — already satisfies ESLint 10's engine floor (`^22.13.0`). No `.nvmrc` or CI changes needed.

---

## Open Questions

### Resolved During Planning

- *Does Node 22.22.0 satisfy ESLint 10's engine requirement?* Yes — ESLint 10 requires `^20.19.0 || ^22.13.0 || >=24`. 22.22.0 satisfies the `^22.13.0` range. No Node bump needed (unlike siobhan-oca which started on 22.12.0).
- *Does `next build` invoke ESLint and risk breaking the Azure SWA deploy?* No — as of Next 15+, `next build` no longer runs ESLint by default and `next.config.mjs` does not opt back in.
- *Is there a `@eslint/js` equivalent to carry forward?* The current config spreads `js.configs.recommended`. After dropping `eslint-config-next`, this can remain or be removed — the `@eslint-react` and `typescript-eslint` presets already cover JS-level rules. Defer the decision to implementation (keep it if lint passes, remove it if it creates conflicts).
- *Should `package.json` `engines.node` be updated?* The current floor is `>=18.17.0`. ESLint 10 requires a higher floor, but the floor is advisory and does not block npm install. Leave as-is — it is an informational field and this PR's scope is ESLint tooling only.

### Deferred to Implementation

- Exact peer-dep warnings on `npm install` after the swap — acceptable as long as they are warnings, not errors.
- Whether `@eslint-react/recommended` surfaces new errors (not just warnings) on this codebase. If errors appear, fix them in this PR or downgrade the specific rule to `warn` and document in U4.
- Whether `@eslint/js`'s `recommended` config should be kept alongside the new plugin set — resolve at implementation time by observing `npm run lint` output.

---

## Implementation Units

- U1. **Record baseline lint output**

**Goal:** Capture current `npm run lint` exit code and warning/error count on ESLint 9 before changing anything, so U3 can confirm the delta.

**Requirements:** R2

**Dependencies:** None

**Files:**
- Modify: none — capture in PR description only

**Approach:**
- Run `npm run lint` against the current working tree (after a clean `npm install` that forces ESLint 9 — or note the current state from existing `node_modules`).
- Note exit code and any warnings/errors for comparison in U3.

**Test scenarios:** Test expectation: none — measurement step, no behavioral change.

**Verification:**
- Baseline count recorded and available for U3 comparison.

---

- U2. **Update package.json: bump ESLint, remove eslint-config-next, add replacement plugins**

**Goal:** Resolve the `ERESOLVE` peer-dep failure by removing `eslint-config-next` and introducing its ESLint-10-compatible replacements.

**Requirements:** R1, R3

**Dependencies:** U1

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json` (regenerated by npm)

**Approach:**
- Execute installs in this exact order (matching siobhan-oca's pattern — reversing the order produces ERESOLVE):
  1. `npm install --save-dev eslint@^10` (or `eslint@^10.3.0` to match sibling repos)
  2. `npm uninstall eslint-config-next`
  3. `npm install --save-dev @eslint-react/eslint-plugin@^5.7.5 @next/eslint-plugin-next@16.2.7`
- After step 2, confirm whether `eslint-plugin-react-hooks` and `typescript-eslint` remain in the tree (they arrive transitively via `eslint-config-next`). If pruned, add them explicitly:
  - `npm install --save-dev eslint-plugin-react-hooks@^7.0.0`
  - `npm install --save-dev typescript-eslint@^8.46.0`
- Run `npm install` on a clean checkout to confirm no `ERESOLVE` errors.

**Patterns to follow:**
- `~/git/siobhan-oca` commit `6068fde` ("chore(eslint): upgrade to ESLint 10 by replacing eslint-config-next") — same install sequence.

**Test scenarios:**
- Happy path: `npm install` on a clean checkout exits 0 with no `ERESOLVE` errors. Peer-dep *warnings* are acceptable.
- Happy path: `npm ls eslint` reports `10.x` at the top level.
- Happy path: `npm ls eslint-config-next` reports the package is not installed.
- Edge case: If `eslint-plugin-react-hooks` or `typescript-eslint` were pruned (not pulled by any remaining package), they were re-added explicitly in this step.

**Verification:**
- `npm install` exits 0 on a fresh `node_modules`-free checkout.
- `eslint-config-next` does not appear anywhere in `package-lock.json`.
- `eslint` version in lockfile is `10.x`.

---

- U3. **Rewrite eslint.config.mjs as a hand-rolled flat config**

**Goal:** Replace the `eslint-config-next/core-web-vitals` import with direct plugin composition that delivers equivalent lint coverage on ESLint 10.

**Requirements:** R2, R4, R5

**Dependencies:** U2

**Files:**
- Modify: `eslint.config.mjs`

**Approach:**
- Remove the `import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'` import and its usage.
- Remove the `import js from '@eslint/js'` if redundant (evaluate after the new config is assembled; typescript-eslint and @eslint-react cover the JS rules already).
- Import directly: `@eslint-react/eslint-plugin`, `eslint-plugin-react-hooks`, `@next/eslint-plugin-next`, `typescript-eslint`, `eslint-plugin-prettier`, `eslint-config-prettier`.
- Compose the flat config following the siobhan-oca post-migration shape:
  - Spread `tseslint.configs.recommended` for TypeScript rules.
  - Add a config block for React/Next rules with `extends: [eslintReact.configs.recommended]`, `files: ['**/*.{js,jsx,mjs,ts,tsx}']`, and manual plugin registration for `react-hooks`, `@next/next`, and `prettier`.
  - Spread `reactHooks.configs.recommended.rules` and `nextPlugin.configs['core-web-vitals'].rules` into `rules`.
  - Add `'prettier/prettier': 'error'`.
  - Append `eslint-config-prettier` (imported default) to disable stylistic rules that conflict with Prettier.
- Preserve the `ignores` block verbatim: `['.next/**', 'out/**', 'build/**']`. The sibling repo solution doc warns explicitly that removing `out/**` causes ESLint to walk the static export directory and hang.
- Do not add `settings.react.version` — `@eslint-react` uses `settings["react-x"]` which the `recommended` preset auto-injects.
- If any `@eslint-react/static-components` false-positive appears on a JSX dynamic-tag pattern (`const { tag: Tag } = ...`), suppress with a function-block-scoped disable comment, not a line-level `eslint-disable-next-line`.

**Patterns to follow:**
- `~/git/siobhan-oca/eslint.config.mjs` (post-migration) — direct reference config.
- `~/git/siobhan-oca/docs/solutions/tooling-decisions/eslint-config-next-removal-for-eslint-10-2026-05-10.md` Section 3 "Rewrite eslint.config.mjs" — before/after diff.

**Test scenarios:**
- Happy path: `npm run lint` on the unchanged source tree exits 0.
- Happy path: `npm run lint -- --print-config app/page.tsx` resolves and prints a config without errors (confirms all plugins loaded correctly).
- Edge case: If `@eslint-react/static-components` fires on any dynamic JSX tag pattern in the source tree, a function-block-scoped disable comment is in place and lint still exits 0.
- Error path: If any plugin import fails (wrong default vs named export), the ESLint error message names the import — fix at this step.

**Verification:**
- `npm run lint` exits 0 on the working tree.
- No import in `eslint.config.mjs` references `eslint-config-next`.
- The `ignores` block is unchanged.
- Warning count delta vs baseline (from U1) is documented.

---

- U4. **Verify CI and capture institutional learning**

**Goal:** Confirm the CI lint job passes with the new config, then capture the migration decision as a solution doc.

**Requirements:** R6

**Dependencies:** U3

**Files:**
- Create: `docs/solutions/tooling-decisions/eslint-config-next-removal-for-eslint-10-2026-06-07.md`
- Reference: `.github/workflows/lint.yml` (read-only; no changes expected)

**Approach:**
- Push the branch and observe the `Code Quality / NPM Lint` GitHub Actions job. The workflow uses Node 22.22.0 — no changes to `.github/workflows/lint.yml` are expected.
- If CI fails on `npm install` (ERESOLVE that didn't appear locally), iterate on U2's dependency set rather than adding `--legacy-peer-deps`.
- If CI fails on `npm run lint`, return to U3 and fix the config error.
- Once CI is green, create a solution doc mirroring the siobhan-oca format:
  - Frontmatter with `applies_when`, `symptoms`, and `tags` matching this stack (Next.js 16, ESLint 10, flat config).
  - Cover: why `eslint-config-next` was dropped, the three blocking plugins (react, jsx-a11y, import), the install order, the resulting `eslint.config.mjs` shape, the count and identity of new warnings surfaced, and a rollback recipe.
  - Link to vercel/next.js#89764 and the siobhan-oca solution doc as related resources.

**Test scenarios:**
- Integration: GitHub Actions `Code Quality / NPM Lint` job exits 0 on the PR.
- Integration: `npm install` step in CI emits no `ERESOLVE` errors.

**Verification:**
- CI lint check is green before merge.
- Solution doc exists at `docs/solutions/tooling-decisions/eslint-config-next-removal-for-eslint-10-2026-06-07.md`.

---

## System-Wide Impact

- **Interaction graph:** `npm run lint` is the only consumer of ESLint config. `next build` (used by the Azure SWA deploy workflow in `.github/workflows/deploy.yml`) does not invoke ESLint as of Next 15+ and `next.config.mjs` does not opt back in.
- **Error propagation:** A peer-dep `ERESOLVE` error would block both CI and local `npm install`. Lint errors flow only to the `Code Quality` CI job.
- **State lifecycle risks:** None — this is tooling-only. No application state, database, or deployed artifact is affected.
- **Unchanged invariants:** `next build`, `next dev`, the static export to `out/`, the Azure SWA deploy workflow, Prettier formatting rules (`.prettierrc`), Tailwind CSS, and all application code are unchanged. Only the ESLint dependency tree and flat config composition change.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `@eslint-react/recommended` surfaces new *errors* (not just warnings), failing CI | Run `npm run lint` locally during U3 before pushing. If errors appear, downgrade the specific rule to `warn` in the config and document in U4's solution doc. New warnings are acceptable per R2. |
| `@next/eslint-plugin-next` version mismatch with `next` produces confusing rule errors | Pin `@next/eslint-plugin-next` to the same minor version as `next` (16.2.7 or as close as npm resolves). |
| `eslint-plugin-react-hooks` or `typescript-eslint` is pruned when `eslint-config-next` is removed, causing config import errors | U2 explicitly checks for both and re-adds them if pruned. |
| Hand-rolled config drifts from what `eslint-config-next` will eventually ship for ESLint 10 | Solution doc (U4) records rollback recipe. Change is one config file — trivially reversible via `git revert`. |

---

## Documentation / Operational Notes

- No AGENTS.md or CLAUDE.md exists in this repo — no stale ESLint references to update.
- `docs/solutions/tooling-decisions/` is a new directory created by U4. This is the first solution doc for this repo.
- Rollback: `git revert` the merge commit, run `npm install`. No data, no users, no deployed artifact affected.

---

## Sources & References

- Reference solution doc: `~/git/siobhan-oca/docs/solutions/tooling-decisions/eslint-config-next-removal-for-eslint-10-2026-05-10.md`
- Reference plan: `~/git/siobhan-oca/docs/plans/2026-05-10-001-chore-eslint-10-upgrade-plan.md`
- Reference config: `~/git/siobhan-oca/eslint.config.mjs`
- Upstream bug: vercel/next.js#89764 — ESLint v10 runtime crash (`context.getFilename` removed), open as of plan date
- Community fix (rejected): vercel/next.js#90068 — `@eslint/compat` shim, unmerged since Feb 17 2026
- `~/git/hundred-and-ten-web/docs/solutions/tooling-decisions/eslint-plugin-react-to-eslint-react-upgrade-2026-05-09.md` — earlier Vite-based precedent
- `@eslint-react/eslint-plugin` npm: https://www.npmjs.com/package/@eslint-react/eslint-plugin
- `@next/eslint-plugin-next` npm: https://www.npmjs.com/package/@next/eslint-plugin-next
