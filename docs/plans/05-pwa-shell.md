# Iteration 05 — PWA Shell (M4)

## Goal

The app installs to the home screen, launches standalone, and is fully
functional offline after the first load. No runtime network calls.

## Tasks

1. **Plugin** — add `vite-plugin-pwa` (+ `workbox-build` transitive). Configure
   in `vite.config.js`:
   - `registerType: 'autoUpdate'`.
   - `workbox`: precache the app shell (`globPatterns` for js/css/html/svg/png/
     woff2), `navigateFallback: 'index.html'`, `cleanupOutdatedCaches: true`.
   - `manifest`: `name: "Romanian Whist Scoreboard"`,
     `short_name: "Whist"`, `display: 'standalone'`,
     `orientation: 'portrait'`, `start_url: '/'`, `scope: '/'`,
     `theme_color` / `background_color` from the theme,
     `icons`: 192 + 512 (any) + 512 maskable.
   - `devOptions.enabled: true` for local testing.
2. **Icons** — generate `pwa-192.png`, `pwa-512.png`, `maskable-512.png`,
   `apple-touch-icon.png`, `favicon.png` into `public/` **from
   `src/assets/hero.png`** (the v1 placeholder mark — no dedicated logo).
   - Pad `hero.png` onto a solid `background_color` square for the maskable
     variant (safe-zone), plain resize for the rest.
   - Document the generation command (e.g. `sharp` / `pwa-asset-generator`) in
     `docs/` so icons can be regenerated if the mark changes.
3. **`index.html`** — set `<title>`, `theme-color` meta, `apple-mobile-web-app-*`
   metas, link apple-touch-icon.
4. **Update flow** — `virtual:pwa-register` with a MUI `Snackbar`
   ("New version available — Reload"). Since a game may be in progress, the
   update prompt must be dismissible and never auto-reload mid-game.
5. **Install prompt** — capture `beforeinstallprompt`, stash it, show an
   "Install app" button on Home when available; hide once installed
   (`appinstalled` / `display-mode: standalone`).
6. **Offline audit** — confirm zero external requests at runtime: no Google
   Fonts (self-host Roboto or use a system font stack), no CDN,
   MUI/emotion/mdi-material-ui all bundled.
7. **`.gitignore` / build** — ensure `dev-dist/` ignored; `dist/` contains
   `sw.js` + `manifest.webmanifest` after `yarn build`.

## Tests

- **Manifest test** — after `yarn build`, a Node test reads
  `dist/manifest.webmanifest` and asserts required keys, `display: standalone`,
  `orientation: portrait`, and that all referenced icon files exist with correct
  sizes.
- **Service worker presence** — `dist/sw.js` exists and precache manifest is
  non-empty; `navigateFallback` entry present.
- **No external URLs** — grep the built `dist/assets/*` and `index.html` for
  `http(s)://` origins other than allowed schema/spec URLs; fail on any
  font/CDN/analytics host.
- **Update snackbar** (RTL) — mock `virtual:pwa-register`; firing `onNeedRefresh`
  renders the snackbar; "Reload" calls `updateSW`; dismiss hides it without
  reloading.
- **Install button** (RTL) — dispatch a fake `beforeinstallprompt`; button
  appears on Home; clicking calls `.prompt()`; `appinstalled` hides it.
- **Manual smoke (documented, not automated):** Lighthouse PWA pass; load app,
  go offline (DevTools), reload → app still works and resumes the game.

## Acceptance checklist

- [ ] Installable on Android Chrome + iOS Safari (add-to-home-screen).
- [ ] Offline reload works; game state resumes.
- [ ] Zero runtime network requests (verified in Network tab + test).
- [ ] Update prompt is manual and safe mid-game.
- [ ] Lighthouse "Installable" + offline checks pass.
- [ ] `yarn test` green, `yarn build` ok.
