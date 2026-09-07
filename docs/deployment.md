# Deployment

The app is a static Vite/React SPA hosted on **GitHub Pages** as a project site:

<https://dariusblajan.github.io/whist-scoreboard/>

## How it works

Deployment is fully automated via GitHub Actions
([`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)). Every push to
`master` (or a manual **Run workflow**) triggers:

1. `yarn install --frozen-lockfile`
2. `yarn lint`
3. `yarn test`
4. `yarn build` — outputs static files to `dist/`
5. `cp dist/index.html dist/404.html` — SPA fallback so deep links / refreshes work
6. Upload `dist/` and publish it to GitHub Pages

No `gh-pages` branch is used; Pages serves the artifact directly from the workflow.

## One-time GitHub setup

In the repo: **Settings → Pages → Build and deployment → Source = "GitHub Actions"**.

That's the only setting required. The workflow already requests the needed
permissions (`pages: write`, `id-token: write`) and targets the `github-pages`
environment.

## Base path

Because this is a project site served from `/whist-scoreboard/`, the build sets
`base: '/whist-scoreboard/'` ([`vite.config.js`](../vite.config.js)) and the router
uses `basename={import.meta.env.BASE_URL}` ([`src/App.jsx`](../src/App.jsx)). Local
`yarn dev` still runs at `/`. If the repo is ever renamed, update the `base` string.

## Manual build (local check)

```sh
yarn build      # produces dist/
yarn preview    # serves dist/ locally at the production base path
```

## Deploy manually

Push to `master`, or go to **Actions → Deploy to GitHub Pages → Run workflow**.
