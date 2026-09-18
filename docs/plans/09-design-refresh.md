# Iteration 09 — Design refresh: Playful Trick-Taking (M8)

## Goal

Apply the "Playful Trick-Taking" design language — chosen from three
proposed directions (Card Table Classic / Modern Minimal Scoreboard /
Playful Trick-Taking) — across the app: rounded-full controls, a saturated
violet primary with a warm-red secondary, a friendly display/body type
pairing, and a scoreboard table whose grid lines are actually easy to read.

## Tasks

### Theme (`src/theme/palette.js`)

- New primary/secondary hues, tuned **per light/dark scheme** (not one
  brand hex shared across both) so every colour that doubles as text
  — leader highlight, hand-summary text, promotion chips — clears 4.5:1
  against its paper.
- `shape.borderRadius` 12 → 20; `MuiButton` rounded-full (999px);
  `MuiToggleButton` a smaller 14px radius (a pill reads oddly for a
  segmented control); `MuiPaper`'s `outlined` variant gets a soft violet
  drop-shadow instead of relying on the border alone.
- Table borders: MUI's `TableCell` default blends `divider` ~88% toward
  the paper colour in light mode, which made the scoreboard grid nearly
  invisible — overridden to use the (now more saturated) `divider` colour
  directly.

### Typography

- Display headings (`h1`–`h6`, `subtitle1`/`subtitle2`) → Baloo 2; body
  → Nunito Sans.
- **Self-hosted**, not linked from Google Fonts: this is an offline-first
  PWA (`pwaBuild.test.js` forbids external font/CDN origins in the shipped
  build), so `src/assets/fonts/*.woff2` (latin + latin-ext subsets — the
  latter covers the Romanian ă/â/î/ș/ț) ship in the bundle and get
  precached like everything else. `src/theme/fonts.css` declares them,
  imported once from `main.jsx`.

### Scoreboard table contrast (user follow-up)

- Outer container border 1px → 1.5px.
- Bid/Score sub-header row gets a bold 2px bottom border (the real
  head/body separator); the totals row gets a matching 2px top border.
- A 1px `divider`-coloured left border between each player's column pair,
  so Bid+Score stays visually grouped per player without extra clutter.

### Misc

- App bar: rounded bottom corners (`20px`) to match the language.
- `theme-color` meta, PWA manifest `theme_color`/`background_color`, and
  the maskable icon background regenerated to match.

## Tests

- Existing suite (220 tests: rules engine, screens, a11y/axe per screen,
  PWA build output) — no new test files; this is a visual-only change and
  `axe` already asserts colour-contrast per screen.
- `pwaBuild.test.js`'s "no external font/CDN origin" check is the guard
  that caught the first pass (linked Google Fonts) — self-hosting fixed it.

## Acceptance checklist

- [x] `yarn test` green (220/220), `yarn lint` clean, `yarn build` ok.
- [x] No external font/CDN origin in the shipped build.
- [x] axe clean on all screens under the new theme.
- [x] Scoreboard table borders clearly visible (outer border, head/body
      separator, per-player column grouping).
- [x] Primary/secondary/success/error all re-checked ≥ 4.5:1 against their
      paper in both schemes.
