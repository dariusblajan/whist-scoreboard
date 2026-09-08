# PWA shell

The app is an installable, offline-first PWA (see
[`docs/plans/05-pwa-shell.md`](plans/05-pwa-shell.md)).

## How it works

- [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) (`vite.config.js`)
  generates `dist/sw.js` + `dist/manifest.webmanifest` on `yarn build`.
- The service worker precaches the whole app shell (`globPatterns`), with
  `navigateFallback: 'index.html'` so deep links work offline.
- `registerType: 'prompt'` (a deliberate deviation from the plan's
  `'autoUpdate'`): `autoUpdate` lets the new worker call `skipWaiting` and
  reload the page on its own, which is unsafe mid-game. `'prompt'` keeps the
  new worker waiting until the player taps "Reload".
- Registration happens in-app via `virtual:pwa-register/react`
  ([`src/pwa/PwaUpdatePrompt.jsx`](../src/pwa/PwaUpdatePrompt.jsx)). When a new
  version is waiting it shows a **dismissible** MUI snackbar — it never
  auto-reloads, since a game may be in progress.
- [`src/pwa/InstallButton.jsx`](../src/pwa/InstallButton.jsx) captures
  `beforeinstallprompt` and shows an "Install app" button on Home; it hides
  after `appinstalled` or when already running standalone.
- No runtime network calls: fonts are a system stack (`src/theme/palette.js`),
  MUI / emotion / mdi-material-ui are all bundled, no CDN. The
  `src/pwa/pwaBuild.test.js` suite fails the build if an external font/CDN/
  analytics origin sneaks in.

`devOptions.enabled: true` serves the SW under `yarn dev` (output in the
git-ignored `dev-dist/`).

## Icons

All icons in `public/` are generated from `src/assets/hero.png` (the v1
placeholder mark — there is no dedicated logo yet):

```sh
yarn icons        # runs scripts/generate-icons.mjs (needs the `sharp` dev dep)
```

Outputs: `pwa-192.png`, `pwa-512.png`, `maskable-512.png` (mark padded onto the
`#16171d` `background_color` for the mask safe-zone), `apple-touch-icon.png`
(180), `favicon.png` (64). Re-run whenever the mark changes and commit the
results. The background colour lives in both `scripts/generate-icons.mjs` and
`vite.config.js` — keep them in sync.

## Manual smoke checks (not automated)

- Lighthouse → PWA: "Installable" + offline checks pass.
- `yarn build && yarn preview`, open DevTools → Network → Offline, reload:
  the app still loads and resumes the in-progress game.
- Android Chrome + iOS Safari: add to home screen, launch standalone.
