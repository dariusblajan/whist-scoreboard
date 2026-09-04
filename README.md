# Whist Scoreboard

A frontend-only PWA for keeping score during a game of Romanian whist.
See [`docs/project-brief.md`](docs/project-brief.md) for the spec and
[`docs/plans/`](docs/plans) for the iteration-by-iteration plan.

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
  components/  shared UI (app shell, theme toggle)
  theme/       MUI theme + light/dark mode provider
  test/        Vitest setup + shared render helpers
```
