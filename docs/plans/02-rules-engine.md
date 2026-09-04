# Iteration 02 — Rules Engine (M1)

## Goal

A framework-free module that encodes every structural and scoring rule of
Romanian whist, with exhaustive unit tests. Nothing in `src/rules/` imports
React or touches the DOM or `localStorage`.

## Modules (`src/rules/`)

### `hands.js`

- `generateHands(playerCount, variant, firstDealerSeatIndex) -> Hand[]`
  - `playerCount`: 3–6 (throw on out-of-range).
  - `variant`: `'short'` | `'long'`.
  - **Short:** `N×1`, ramp `2..8`, `(N-1)×8`, ramp `7..2`, `N×1`.
  - **Long:** `N×8`, ramp `7..1`, `(N-1)×1`, ramp `2..7`, `N×8`.
  - Total hand count is `3N + 12` for both.
  - Each `Hand`: `{ index, cardsDealt, dealerSeatIndex, biddingOrder,
    trump: null, entries: {} }` with `entries[playerId] = { bid: null, taken: null }`
    for every player.
- `dealerForHand(handIndex, playerCount, firstDealerSeatIndex)`
  - `(firstDealerSeatIndex + handIndex) % playerCount`.
- `biddingOrder(hand, players)`
  - Seats clockwise starting at `(dealerSeatIndex + 1) % N`, dealer last.
  - Returns array of `playerId`.
- `trumpStatus(cardsDealt) -> 'none' | 'trump'` (`8 -> 'none'`).

### `scoring.js`

- `forbiddenDealerBid(cardsDealt, bidsSoFar) -> number | null`
  - `bidsSoFar` = bids of all non-dealer players.
  - Forbidden value `= cardsDealt - sum(bidsSoFar)`; return it only when it is in
    `0..cardsDealt`, else `null`.
- `handPoints({ bid, taken }) -> number`
  - `taken === bid` → `5 + taken`; else `-Math.abs(taken - bid)`.
- `validateTakenTotals(entries, cardsDealt) -> boolean`
  - `true` iff every `taken` is a filled integer `0..cardsDealt` and the sum
    equals `cardsDealt`.
- `validateBid(bid, cardsDealt, { isDealer, bidsSoFar }) -> boolean`
  - integer `0..cardsDealt`, and if `isDealer` not equal to `forbiddenDealerBid`.

### `promotions.js`

- `promotionBonuses(game) -> { [playerId]: [{ handIndex, delta }] }`
  - Returns `{}` (all empty) when `game.options.promotions` is falsy.
  - For each player, walk hands in order maintaining a streak counter and a
    streak sign (`'made'` | `'missed'` | none):
    - **1-card hands** (`cardsDealt === 1`): reset counter to 0, sign to none;
      emit nothing.
    - Multi-card hands with both entries filled: outcome is `'made'` if
      `taken === bid` else `'missed'`. If it matches the current sign, increment
      the counter; otherwise start a new streak (counter = 1, sign = outcome).
    - Each time the counter becomes a positive multiple of 5, emit
      `{ handIndex, delta: sign === 'made' ? +10 : -10 }`.
    - Hands with incomplete entries stop the walk for that player (later hands
      not yet scored).
- `promotionTotal(game) -> { [playerId]: number }` — sum of `delta`s per player.

### `standings.js`

- `handResults(game) -> perHand[][]` — for each completed hand, per-player
  `{ playerId, bid, taken, points }`.
- `cumulativeTotals(game) -> { [playerId]: number }` (sum of base points over
  completed hands **plus** `promotionTotal` when promotions are enabled).
- `standings(game) -> [{ playerId, total, rank }]`
  - Sorted by total desc; equal totals share a rank; next rank is
    `1 + count of players strictly above` (so ranks skip: 1,1,3).

### `index.js`

- Re-export the public surface.

## Types

Add a `src/rules/types.js` JSDoc `@typedef` block for `Game` / `Hand` / `Player`
matching the brief's data model (including `Game.options.promotions`), so
editors get hints without TS.

## Tests (`src/rules/*.test.js`)

**`hands.test.js`**
- For each `N` in 3..6 and each variant: assert exact `cardsDealt` sequence
  (hard-code the `N=4` examples from the brief; compute-and-compare pattern for
  the rest), length `3N + 12`.
- `generateHands` throws for `N=2` and `N=7`.
- `dealerForHand` rotates and wraps; hand 0 == `firstDealerSeatIndex`.
- `biddingOrder`: dealer is always last; length `N`; starts left of dealer;
  wraps correctly for every dealer seat.
- `trumpStatus`: `1..7 -> 'trump'`, `8 -> 'none'`.

**`scoring.test.js`**
- `forbiddenDealerBid`: brief example (6 cards, bids `[3,1]` → forbidden `2`);
  returns `null` when the difference is negative or `> cardsDealt`; boundary at
  `0` and `cardsDealt`.
- `handPoints`: made (`bid 3 taken 3 → 8`), `bid 0 taken 0 → 5`, undertrick
  (`bid 3 taken 2 → -1`), overtrick (`bid 3 taken 4 → -1`), two off (`-2`),
  three off (`-3`) — the exact cases from `game-rules.md`.
- `validateTakenTotals`: passes on exact sum, fails on over/under, fails on a
  `null`/non-integer/out-of-range entry.
- `validateBid`: dealer forbidden value rejected, allowed values accepted,
  non-dealer unconstrained, range enforced.

**`promotions.test.js`**
- `options.promotions` false → `promotionBonuses` returns all-empty regardless
  of results.
- 5 consecutive made multi-card hands → one `+10` at the 5th hand's index; a
  6th made hand → nothing; the 10th → another `+10`.
- 5 consecutive missed multi-card hands → one `-10`.
- A streak of 4 made hands broken by a missed hand → no bonus; counter restarts.
- A 1-card hand in the middle of a would-be 5-streak resets it (e.g. made,
  made, 1-card, made, made, made → no bonus; the run after the 1-card is only 3).
- 1-card hands are never emitted and never counted.
- Mixed players: only the player who hits the streak gets the bonus.
- Incomplete trailing hands don't produce phantom bonuses.

**`standings.test.js`**
- Reproduce the `game-rules.md` worked table (Peter/John/Peggy, first 5 hands)
  and assert cumulative totals match (`6/11/10/15/14`, `5/10/16/14/19`,
  `-1/-2/3/10/16`).
- `standings` ranking: all distinct; two-way tie for 1st → `[1,1,3]`; three-way
  tie; tie for last.
- `cumulativeTotals` ignores hands with incomplete entries.
- `cumulativeTotals` with promotions enabled adds the ±10 bonuses; with it
  disabled matches the base-points-only total.
- `standings` ordering reflects a promotion bonus that flips the lead.

Target: 100% branch coverage of `src/rules/`.

## Acceptance checklist

- [ ] All rules functions implemented as pure functions, no side effects.
- [ ] `yarn coverage` shows `src/rules/` at 100% (or documented exception).
- [ ] The `game-rules.md` worked example is a passing test.
- [ ] `promotionBonuses` covers made/missed streaks, 1-card resets, multiples of
      5, and the disabled case.
- [ ] `yarn lint` clean.
