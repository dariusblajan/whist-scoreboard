# Iteration 01 — Tooling & Scaffold (pre-M1)

## Goal

Turn the starter Vite page into an app skeleton with a test runner, component
library, routing, and a clean folder structure. No game logic yet.

## Tasks

1. **Dependencies**
   - Add: `@mui/material`, `@emotion/react`, `@emotion/styled`,
     `react-router-dom`.
   - Icons: `mdi-material-ui` (already added). Use it for all icon needs; do
     **not** add `@mui/icons-material`.
   - Dev: `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`,
     `@testing-library/user-event`, `@testing-library/jest-dom`.
   - Remove `@mui/core` alpha — superseded by `@mui/material`.
2. **Scripts** in `package.json`:
   - `"test": "vitest run"`, `"test:watch": "vitest"`,
     `"coverage": "vitest run --coverage"`.
3. **Vitest config** — add `test` block to `vite.config.js`: `environment: 'jsdom'`,
   `globals: true`, `setupFiles: './src/test/setup.js'`, coverage provider `v8`,
   include `src/**`.
   - `src/test/setup.js`: `import '@testing-library/jest-dom'`.
4. **Folder structure** (create with `.gitkeep` where empty):
   ```
   src/
     rules/            # M1 pure engine
     state/            # game store + persistence (M2)
     screens/          # Home, NewGame, HandPlay, Scoreboard, GameOver
     components/       # shared UI
     theme/            # MUI theme + light/dark
     test/             # setup + shared test utils
   ```
5. **Theme** — port existing `theme.js` into `src/theme/` as an MUI theme with
   `light` + `dark` palettes and a `ThemeModeProvider` (context) defaulting to
   `prefers-color-scheme`, persisting the user override to `localStorage`.
6. **Routing** — `react-router-dom` with routes: `/` (Home), `/new` (NewGame),
   `/play` (HandPlay), `/scoreboard` (Scoreboard), `/over` (GameOver).
   Placeholder screen components that just render their name.
7. **Replace** `src/App.jsx` with the router shell + `<CssBaseline>` + theme
   provider. Delete starter demo CSS and the Vite/React SVGs once unreferenced.
   **Keep `src/assets/hero.png`** — it's the placeholder app mark (app bar on
   Home, and the PWA icon source in Iteration 05). No dedicated logo in v1.
8. **README** — short "develop / test / build" section.

## Tests

- `src/test/smoke.test.jsx` — renders `<App>` inside `MemoryRouter`, asserts the
  Home screen placeholder shows.
- `src/theme/themeMode.test.jsx` — provider defaults to system preference;
  toggling updates context value and writes `localStorage`; a stored override is
  read back on mount (mock `matchMedia`).
- Confirm `yarn test` runs and reports coverage.

## Acceptance checklist

- [x] `yarn dev` shows a routed app (Home → New game), no console errors.
- [x] `yarn test` runs Vitest green (8 tests: smoke shell + theme mode).
- [x] `yarn lint` clean (ESLint aware of test globals / node config files).
- [x] `yarn build` succeeds.
- [x] No references to Vite/React starter demo content remain.

## Status: DONE

- Deps: added `@emotion/react`/`@emotion/styled`, `react-router-dom`, Vitest +
  Testing Library (+ `@testing-library/dom`); removed `@mui/core`.
- `src/theme/`: `palette.js` (brand theme builder), `themeMode.js` (persistence +
  cycle helpers), split context / hook / `ThemeModeProvider.jsx`.
- Routing in `src/routes.jsx` under an `AppLayout` shell (app bar + theme
  toggle); placeholder screens for all five routes; unknown routes → Home.
- `favicon.png` is `hero.png` for now; proper icons in Iteration 05.
- Bundle: ~134 kB gzip (MUI) — revisit with code-splitting if it matters later.
- **Icon imports:** Vite 8's Rolldown optimizer mis-unwraps mdi-material-ui's
  CommonJS per-icon default export (renders as `{__esModule, default}` → React
  "Element type is invalid"). Fixed by importing the icons' pure-ESM build via
  `mdi-material-ui/esm/<Name>`, funnelled through a single `src/icons.js`
  re-export module. `src/icons.test.jsx` renders every re-exported icon as a
  regression guard.
