# Iteration 07 — Printable Scoreboard (M6)

> **Status: PLANNED — do not implement yet.** Scoped here so the earlier
> iterations don't paint us into a corner. Depends on M3 (Scoreboard).

## Goal

Let a group play on paper but still use the app's generated hand sequence and
rules: produce a clean, printer-friendly score sheet for the current game
(or a fresh game config) that can be printed or saved as PDF from the browser,
with no backend and no extra dependencies.

Two uses:

1. **Blank sheet** — the correct hand grid (cards-dealt column, dealer per row,
   one bid/score column pair per player) with empty cells to fill in by hand.
   A backup for when the phone battery dies or someone prefers paper.
2. **Filled sheet** — the same grid populated from the live game state
   (bids, per-hand scores, cumulative totals, promotion badges, current
   standings), as an end-of-game record or mid-game snapshot.

## Approach

- **Print via CSS, not a library.** A dedicated route `/print` renders a
  self-contained, high-contrast, black-on-white layout; a `@media print`
  stylesheet hides the app chrome (app bar, nav, bottom action bar) and the
  browser's own Print dialog does the PDF/paper output.
- Add a **"Print / Save as PDF"** action:
  - on the Scoreboard screen (prints the current game, filled),
  - on the Game Over screen (final record),
  - on Home / NewGame review step (blank sheet for a chosen player count +
    variant, without starting a game).
- The print route takes its data from the game store when a game is active,
  otherwise from query params (`?players=4&variant=short&promotions=0`) so a
  blank sheet needs no game.

## Screen (`src/screens/PrintScoreboard`)

- **Title block:** "Romanian Whist" · date · variant · player count ·
  promotions on/off.
- **Player header:** names across the top; each player spans a `Bid | Score`
  column pair (blank sheet: just the pair headers).
- **Rows:** one per hand — hand number, cards dealt, dealer name/initial.
  - Filled: bid and running cumulative score per player; a small `+10` / `−10`
    marker in the score cell where a promotion bonus landed.
  - Blank: empty cells sized for handwriting (min row height ~9mm).
- **Ramp separators:** thin rule between the 1-card blocks and the ramps so the
  structure is readable on paper (matches `game-rules.md` layout).
- **Footer:** totals row; final standings with shared ranks (filled only).
- **Page fit:** must fit A4 **and** US Letter portrait for 3–6 players without
  clipping; 6 players may use a slightly condensed font. Repeat the player
  header on each printed page (`thead` + `display: table-header-group`).
- Pure layout, no interactivity; safe to render server-agnostic.

## Tasks

1. `src/print/printSheetModel.js` — pure builder: `(game | config) ->
   { title, players, rows, totals, standings }`. Reuses `generateHands`,
   `handResults`, `cumulativeTotals`, `promotionBonuses`, `standings`. No React.
2. `src/screens/PrintScoreboard/` — the print route + component, its own
   `print.css` (or MUI `@media print` `GlobalStyles`).
3. `@media print` rules app-wide: hide `AppLayout` chrome, force light palette,
   remove shadows/animations, `break-inside: avoid` on rows.
4. "Print / Save as PDF" buttons on Scoreboard, GameOver, and the NewGame
   review step; each navigates to `/print` with the right source, then calls
   `window.print()` after paint (or just opens the print view with a visible
   "Print" button — decide during impl; must work on iOS Safari, which has no
   `beforeprint` reliability).
5. Route guard: `/print` with neither an active game nor valid query params →
   redirect Home.
6. Offline-safe: no fonts or assets beyond what the PWA already precaches.

## Tests

- **`printSheetModel`** — for the `game-rules.md` first-5-hands data, rows carry
  the documented cumulative numbers; blank config yields the right row count
  (`3N+12`), correct cards-dealt sequence, and empty cells; promotion markers
  land on the right hand when enabled and are absent when disabled.
- **RTL** — `/print` renders a `<table>` with `players×2 + 3` columns; header is
  in a `thead`; app chrome (app bar, bottom bar) is not in the DOM on this
  route. Query-param mode renders a blank sheet with no game in the store.
- **Route guard** — `/print` with no game and no params redirects to `/`.
- **Print CSS smoke** — a jsdom test asserts the print stylesheet is present and
  targets the chrome selectors (can't verify pagination in jsdom; note the
  manual check below).
- **Manual (documented):** Chrome + iOS Safari — print preview fits A4 and
  Letter for N=3 and N=6, header repeats on page 2, no horizontal clipping,
  colours degrade to legible greyscale.

## Acceptance checklist

- [ ] Blank sheet printable for any player count / variant without starting a
      game; hand grid matches the engine.
- [ ] Filled sheet matches the on-screen scoreboard numbers and promotion badges.
- [ ] Fits A4 and US Letter portrait, 3–6 players, header repeats per page.
- [ ] No app chrome in print output; light/greyscale legible.
- [ ] Works offline; no new runtime dependencies or network calls.
- [ ] `/print` guarded when there's nothing to show.
- [ ] `yarn test` green, `yarn lint` clean, `yarn build` ok.
