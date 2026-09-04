# Iteration 04 — Scoreboard & Back-Edit (M3)

## Goal

The paper-table scoreboard view, safe editing of any past hand with automatic
recompute of everything downstream, and the game-over ranking screen.

## Scoreboard (`src/screens/Scoreboard`)

- **Table:** rows = hands, columns = players.
  - Left column: cards dealt for that hand.
  - Per player per hand: `bid` and cumulative score (two sub-columns), matching
    the `game-rules.md` layout.
  - Rows for hands not yet played are shown empty/greyed.
  - **Promotions (when enabled):** on the hand where a player's ±10 bonus
    landed, show a `+10` / `−10` badge on that cell; the cumulative score in
    that row and below already includes it (via `cumulativeTotals`). Hidden
    entirely when `options.promotions` is false.
- **Sticky:** header row (player names) and a footer total row.
- **Current leader** highlighted (from `standings`).
- Tap a completed hand row → open that hand in HandPlay edit mode.
- Reachable from a nav button in HandPlay and from Home (when a game is active).
- Horizontal scroll container for 6 players at 320px width; hand/cards column
  stays pinned.

## Back-edit + downstream recompute

- Editing is already per-hand in the store; cumulative totals are **derived**
  (`cumulativeTotals` / `handResults` / `promotionBonuses`), so recompute is
  automatic as long as the scoreboard and summaries read from selectors, never
  from cached totals. In particular, editing one hand can move where a
  promotion streak reaches 5, so promotion badges must re-derive on every edit.
- Add guard: re-committing an edited hand must re-validate bids (including the
  forbidden dealer bid) and taken totals for **that** hand only; downstream
  hands keep their entries and simply re-total.
- If an edit makes a later hand's stored bid now illegal (e.g. dealer bid),
  surface a non-blocking warning banner on that hand — do not auto-clear.
- "Return to current hand" affordance after editing an older one.

## Game Over (`src/screens/GameOver`)

- Final ranking from `standings` — shared ranks rendered as `1 · 1 · 3`.
- Show each player's total and made/over/under tallies for the game; when
  promotions were enabled, also show total promotion points (e.g. `+20`).
- Actions: **New game** (→ confirm, `discardGame` + `/new`), **View scoreboard**.
- Entering this screen is what triggered `finishGame` in M2; ensure idempotent
  (re-visiting doesn't double-count `gamesFinished`).

## Tests

**Selectors (`src/rules` / `src/state`)**
- Editing hand 2's taken values changes hand 2..end cumulative scores and the
  standings, and leaves raw entries of hands 3+ untouched.
- Recompute is pure: same game object in → same totals out, no mutation.
- **Promotions:** with `options.promotions` on, editing a mid-streak hand so a
  player now misses instead of makes removes a previously-earned `+10` and all
  downstream cumulative scores drop by 10; the badge disappears. Re-editing it
  back restores the bonus.
- Scoreboard renders no promotion badges/columns when `options.promotions` is
  false.

**Scoreboard (RTL)**
- Given a game with the `game-rules.md` first-5-hands data, the rendered table
  cells match the documented cumulative numbers.
- Leader highlight tracks the top of `standings`; updates after an edit.
- Sticky header/footer present; table scrolls horizontally at 320px (assert
  overflow container, not pixel-perfect).
- Clicking a completed hand row navigates to that hand's editor.

**Back-edit (flow)**
- Play 4 hands, go back to hand 1, change a bid+taken, return: scoreboard totals
  for hands 1–4 all reflect the change; hand 2–4 bids unchanged.
- Editing hand 1 so a later dealer bid becomes illegal shows the warning banner
  on that later hand and does not block navigation.

**Game Over**
- Standings with a tie render shared ranks.
- Navigating away and back to `/over` does not change persisted
  `gamesFinished`.

## Acceptance checklist

- [ ] Scoreboard matches the paper layout and the worked example numbers.
- [ ] Any past hand editable; all downstream totals + standings recompute.
- [ ] No cached/duplicated total state anywhere — single derived source.
- [ ] Illegal-after-edit bids warned, not silently changed.
- [ ] Promotions: badges shown only when enabled, land on the right hand, and
      re-derive correctly after a back-edit (incl. a bonus being removed).
- [ ] Game-over ranking correct incl. shared ranks; `finishGame` idempotent.
- [ ] `yarn test` green, `yarn lint` clean, `yarn build` ok.
