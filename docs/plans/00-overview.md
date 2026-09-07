# Implementation Plan — Romanian Whist Scoreboard PWA

Source of truth: [`docs/project-brief.md`](../project-brief.md) and
[`docs/game-rules.md`](../game-rules.md).

## Approach

Build bottom-up: a framework-free, fully unit-tested rules engine first, then
the UI flows on top of it, then the PWA shell, then polish. Every iteration
ships with its own tests and leaves `main` in a working state.

Current state: fresh Vite 8 + React 19 scaffold (`src/App.jsx` is the starter
page). App deps so far: `@mui/core` alpha (to be replaced by `@mui/material`)
and `mdi-material-ui` (icons). No test runner, router, or PWA plugin yet.
`src/assets/hero.png` is the v1 placeholder app mark (no dedicated logo).

## Iterations

| File | Milestone | Deliverable |
|------|-----------|-------------|
| [`01-tooling-and-scaffold.md`](01-tooling-and-scaffold.md) | (pre-M1) | Vitest + Testing Library, MUI, routing, folder structure, CI-ready `test`/`lint` scripts |
| [`02-rules-engine.md`](02-rules-engine.md) | M1 | Pure rules engine + exhaustive unit tests |
| [`03-setup-and-hand-play.md`](03-setup-and-hand-play.md) | M2 | New-game setup wizard + hand-play flow + localStorage persistence + resume |
| [`04-scoreboard-and-back-edit.md`](04-scoreboard-and-back-edit.md) | M3 | Full scoreboard table, back-edit with downstream recompute, game-over ranking |
| [`05-pwa-shell.md`](05-pwa-shell.md) | M4 | Manifest, service worker, offline, installable, icons |
| [`06-polish.md`](06-polish.md) | M5 | Wake lock, responsive pass, theme toggle, empty/error states, a11y |

## Cross-cutting conventions

- **Language:** JavaScript (matches current scaffold; no TS migration in v1).
- **State:** single `Game` object + `Stats` record, both persisted to
  `localStorage` on every mutation. Derived values are never stored.
- **Rules engine:** `src/rules/` — no React, no DOM imports. 100% branch
  coverage is the target.
- **Testing:** Vitest for units; `@testing-library/react` +
  `@testing-library/user-event` for component/flow tests; `jsdom` environment.
- **Test layout:** co-located `*.test.js(x)` next to the unit under test.
- **UX principles (brief §5.1):** every screen honours them — no keyboard for
  numeric entry (pads / steppers), one tap per player per step where possible,
  autofocus the first control on each step, primary action in the thumb zone.
  Enforced per-iteration and re-audited in iteration 06.
- **Definition of done per iteration:** `yarn test` green, `yarn lint` clean,
  `yarn build` succeeds, acceptance checklist in the iteration file ticked.
