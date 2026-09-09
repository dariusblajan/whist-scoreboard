# Whist Scoreboard

A frontend-only PWA for keeping score during a game of Romanian whist.
See [`docs/project-brief.md`](docs/project-brief.md) for the spec and
[`docs/plans/`](docs/plans) for the iteration-by-iteration plan.

## Features

- Guided setup: 3–6 players, short/long variant, seating + first dealer, optional
  ±10 promotion streak bonus.
- Hand-play flow with a tap-only bid pad and trick steppers — the on-screen
  keyboard only ever appears for entering player names.
- Live paper-style scoreboard: pinned first column, horizontal scroll for wide
  tables, tap any played hand to back-edit; totals re-compute downstream.
- Game-over standings with per-player made / over / under tallies and tie-aware
  ranking. "End game early" finishes without counting as a completed game.
- Installable, offline-first PWA. Screen stays awake during a game (Wake Lock,
  where supported).
- System / light / dark theme, contrast-checked, follows the OS live while on
  "system".
- Resilient persistence: a corrupt or tampered saved game is discarded with a
  toast rather than crashing.
- Accessibility: labelled controls, managed focus between steps, `axe`-clean
  screens, `prefers-reduced-motion` honoured.

## Stack

- React 19 + Vite 8
- MUI (`@mui/material`) with `mdi-material-ui` icons
- `react-router-dom` for screen routing
- Vitest + Testing Library for tests

## Develop

```bash
yarn install
yarn dev          # start the dev server
yarn test         # run the unit/component tests once
yarn test:watch   # watch mode
yarn coverage     # tests + coverage report
yarn lint         # eslint
yarn build        # production build to dist/
```

## Layout

```
src/
  rules/       pure, framework-free game engine (M1)
  state/       game store + persistence (M2)
  screens/     Home, NewGame, HandPlay, Scoreboard, GameOver
  components/  shared UI (app shell, theme toggle, number pad, bottom bar)
  hooks/       useWakeLock
  theme/       MUI theme + light/dark mode provider
  pwa/         install prompt + update prompt
  test/        Vitest setup + shared render helpers
```
