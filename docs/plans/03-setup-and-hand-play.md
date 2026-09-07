# Iteration 03 — Setup & Hand-Play Flow (M2)

## Goal

A playable game end-to-end (minus the full scoreboard table): create a game,
walk every hand entering bids and tricks, see per-hand results, and resume after
a reload. State persists on every mutation.

## State layer (`src/state/`)

### `persistence.js`

- `loadGame() / saveGame(game) / clearGame()` — key `whist:game:v1`.
- `loadStats() / saveStats(stats)` — key `whist:stats:v1`, shape
  `{ gamesPlayed, gamesFinished }`, defaults to `{0,0}`.
- Wrap all reads/writes in `try/catch`; corrupt/missing → defaults.
- Schema `version` field on the stored game; unknown version → discard.

### `gameStore.jsx`

- React context + reducer (`useReducer`) holding `{ game, stats }`.
- Actions: `newGame(config)`, `setBid(handIndex, playerId, bid)`,
  `setTaken(handIndex, playerId, taken)`, `setTrump(handIndex, suit)`,
  `commitHand(handIndex)`, `goToHand(index)`, `endGameEarly()`, `discardGame()`,
  `finishGame()`.
- Every action that changes `game`/`stats` triggers a persistence write
  (subscribe in an effect on state change — single source).
- `newGame`: builds `Game` via `generateHands`, stores
  `options: { promotions }` from the setup config (default `false`), sets
  `currentHandIndex = 0`, `status: 'active'`, increments `stats.gamesPlayed`.
- `finishGame` (reached when last hand committed): `status: 'complete'`,
  increments `stats.gamesFinished`.
- Derived selectors (memoized helpers, not stored): current hand, forbidden
  dealer bid given entered bids, taken-total validity, cumulative totals,
  promotion bonuses (when `options.promotions`).

## Screens

### Home (`src/screens/Home`)

- Shows lifetime counters (`gamesPlayed`, `gamesFinished`).
- If a stored active game exists: **Resume** (→ `/play` at `currentHandIndex`)
  and **New game** (→ confirm discard, then `/new`).
- Else: **New game** only.
- Theme toggle in the app bar (system / light / dark).

> **Input ergonomics (brief §5.1) — applies to every screen below.**
> Numeric values come from tap targets, never a text field: no control in the
> setup wizard or hand-play flow raises the on-screen keyboard except the player
> **Names** step. Each step autofocuses its first control. Committing an
> unambiguous entry advances focus automatically (bid tapped → next bidder;
> last bidder → result step; etc.). "Next" / "Back" live in a sticky bottom bar.

### New Game setup (`src/screens/NewGame`) — wizard, 4 steps

1. **Player count** 3–6 (segmented buttons, large tap targets).
2. **Variant** Short (default) / Long — show resulting hand count (`3N+12`) and
   a scrollable preview of the cards-dealt sequence.
   - **Promotions** switch (default OFF) with a one-line explanation
     ("±10 for every 5 hands in a row you make / miss; 1-card hands reset it").
3. **Names** — one text field per player, defaults `Player 1..N`; the whole
   step is skippable (defaults are valid). First field autofocused; `enterKeyHint="next"`.
4. **Seating / first dealer** — reorderable list (drag or up/down buttons) +
   **Randomize**. The list order defines `seatIndex`; a "deals first" marker
   selects `firstDealerSeatIndex`.
- **Start** → `newGame(config)` → navigate `/play`.

### Hand Play (`src/screens/HandPlay`) — two sub-steps per hand

- **Header:** hand `n / total`, cards this hand, dealer name, trump status
  (`No trump` for 8-card hands, else "Trump card turned"), bidding order.
- **Bid step:** for each player in bidding order, a number pad `0..cardsThisHand`
  (buttons, not an input). One tap sets that player's bid and moves focus to the
  next bidder; the active player's row is highlighted.
  - The dealer's forbidden value is rendered disabled with helper text
    (`"Bids sum to {cardsDealt} — not allowed"`).
  - "Next" enabled only when every player has a valid bid; after the last
    bidder's tap, focus lands on "Next".
- **Result step:** tricks taken per player via a `−/+` stepper (or the same pad),
  no text field, no keyboard. First player's control autofocused.
  - Live running total vs `cardsDealt`; "Next" blocked until
    `validateTakenTotals` passes.
  - Optional trump suit selector (icon buttons; skip for 8-card hands).
- **Per-hand summary:** made / over / under and points delta per player, then
  new cumulative total. When promotions are on and a ±10 bonus landed on this
  hand, call it out in the summary ("Promotion! +10 — 5 made in a row").
- **Advance:** `commitHand` then `goToHand(n+1)`; on the last hand → `finishGame`
  → navigate `/over`.
- **Back:** navigate to previous hand for editing (full downstream recompute is
  covered in M3; here at least allow re-opening a committed hand and re-saving).
- Persist after every bid/taken keystroke-commit (per-field, not per-hand).

## Tests

**State (`src/state/*.test.js`)**
- `persistence`: round-trips game (incl. `options.promotions`) and stats;
  a stored game missing `options` loads with `promotions: false`; corrupt JSON → defaults; wrong
  `version` → `loadGame` returns `null`; `localStorage` throwing is swallowed.
- `gameStore` (reducer unit tests, no React):
  - `newGame` builds the right hand count and bumps `gamesPlayed`.
  - `setBid` / `setTaken` update the right entry.
  - committing the final hand sets `status:'complete'` and bumps
    `gamesFinished` exactly once.
  - `discardGame` clears game, leaves stats intact.
  - `endGameEarly` does **not** bump `gamesFinished`.

**Flow tests (`src/screens/*.test.jsx`, RTL + user-event)**
- **NewGame wizard:** pick 4 players → Long → rename one player → randomize
  seating → Start; assert store has a 24-hand game with the entered names.
- **Promotions toggle:** defaults OFF; leaving it off → `options.promotions`
  false in the created game; turning it on → true; the explanation text renders.
- **HandPlay bid step:** in a 3-player 6-card hand, enter bids `3` then `1`;
  assert the dealer's `2` button is disabled with the explanatory text; entering
  an allowed value enables "Next".
- **HandPlay result step:** "Next" stays disabled until taken totals equal
  `cardsDealt`; per-hand summary shows correct deltas via `handPoints`.
- **Input ergonomics:** HandPlay (both steps) and the wizard render no
  keyboard-raising control except the Names step — assert no `type="text"` /
  `type="number"` / `contenteditable` outside NewGame step 3; tapping a bid
  moves focus to the next bidder; each step autofocuses its first control.
- **Resume:** render app with a persisted mid-game state; Home shows "Resume";
  clicking it lands on the correct hand with prior entries intact.
- **Counters:** starting a game increments `gamesPlayed` in the persisted stats;
  reaching the final hand increments `gamesFinished`.

## Acceptance checklist

- [ ] Full game playable start→finish on a phone-width viewport.
- [ ] Reload at any point resumes with no data loss.
- [ ] Forbidden dealer bid cannot be entered; reason shown.
- [ ] Promotions toggle in setup; default OFF; stored on the game; when on, a
      landed ±10 bonus is shown in the per-hand summary and cumulative total.
- [ ] "Next" gating on both steps matches the rules engine.
- [ ] No on-screen keyboard anywhere except the Names step; each step
      autofocuses its first control; a clean hand takes one tap per player per step.
- [ ] Stats counters behave per the brief (early-end / discard don't count).
- [ ] `yarn test` green, `yarn lint` clean, `yarn build` ok.
