# Project Brief — Romanian Whist Scoreboard (PWA)

## 1. Summary

A frontend-only Progressive Web App for keeping score during a game of
Romanian whist. The app replaces the paper score table: it generates the
correct sequence of hands for the number of players, captures each
player's bid and tricks taken per hand, applies the scoring rules
automatically, and shows a running cumulative total. It works fully
offline, installs to the home screen, and stores game state locally so an
interrupted game can be resumed.

- **Type:** Single-page PWA, no backend
- **Stack:** React 19 + Vite 8 (already scaffolded), MUI for components
- **Persistence:** `localStorage` / IndexedDB (device-local only)
- **Audience:** Players at the table — one shared device passed around, or
  the dealer/scorekeeper running it

## 2. Goals

1. Eliminate manual arithmetic and rule-tracking errors during play.
2. Enforce the structural rules of the game (hand sequence, the forbidden
   bid for the last bidder).
3. Be usable one-handed on a phone, at a table, with no network — minimal
   taps per hand and no on-screen keyboard for scoring.
4. Resume a game after the app or browser is closed.

## Non-goals

- No online multiplayer, accounts, sync, or sharing to a server.
- No card-play logic or trick adjudication — the app tracks *outcomes*
  players enter, not the play itself.
- No AI/opponents. No historical stats across many games (v1).

## 3. Game rules the app must encode

Derived from `src/assets/game-rules.md`.

### Players and deck

- 3 to 6 players, each playing alone. (7-player "dead hand" and 56-card
  variants are **out of scope for v1** — cap at 6.)
- 8 cards per player available in the deck; max hand size is therefore 8.

### Hand sequence

For `N` players the game is a fixed list of hands defined by cards dealt.
The app supports two variants, chosen at game setup:

**Short game (default)** — starts and ends with 1-card hands:

- `N` hands of 1 card
- ascending ramp: 2, 3, … , 8
- `N − 1` more hands of 8 cards (so 8-card hands total `N`, counting the
  ramp's 8)
- descending ramp: 7, 6, … , 2
- `N` hands of 1 card

Example, `N = 4` (24 hands):
`1,1,1,1,2,3,4,5,6,7,8,8,8,8,7,6,5,4,3,2,1,1,1,1`

**Long game** — the mirror image: starts and ends with 8-card hands:

- `N` hands of 8 cards
- descending ramp: 7, 6, … , 1
- `N − 1` more hands of 1 card (so 1-card hands total `N`, counting the
  ramp's 1)
- ascending ramp: 2, 3, … , 7
- `N` hands of 8 cards

Example, `N = 4` (24 hands):
`8,8,8,8,7,6,5,4,3,2,1,1,1,1,2,3,4,5,6,7,8,8,8,8`

Both variants have `3N + 12` hands.

### Dealer / turn order

- First dealer chosen arbitrarily (user picks, or app randomizes).
- Dealer rotates one seat clockwise each hand.
- Bidding order starts at the player to the dealer's left and proceeds
  clockwise; the dealer bids last.
- Trump: hands of 1–7 cards have a turned trump card; 8-card hands are
  no-trump. (Display only — app does not need the suit, but v1 may let the
  scorekeeper record it optionally.)

### Bidding constraint

- Each bid is an integer `0 … cardsThisHand`.
- **The sum of all bids may not equal the number of cards dealt this
  hand.** Only the last bidder (dealer) is ever actually constrained; the
  app must forbid the one value that would make the totals equal and show
  why.

### Scoring per hand

For each player, given `bid` and `taken`:

- `taken === bid` → `+5 + taken`
- `taken !== bid` → `-abs(taken - bid)`

Cumulative score is the running sum. Validation: `sum(taken)` across all
players must equal `cardsThisHand`.

### Optional variation: Promotions (opt-in, default OFF)

A subjective house rule, toggled on at game setup. When enabled:

- Track, per player, a running streak of consecutive **multi-card** hands with
  the same outcome — "made" (`taken === bid`) or "missed" (`taken !== bid`).
- Every time that streak reaches a multiple of 5 (5, 10, 15, …), apply a
  one-time bonus at that hand: **+10** for a made-streak, **−10** for a
  missed-streak.
- **1-card hands end a streak:** they never count toward a streak and reset the
  running counter to 0 (the next multi-card hand starts a fresh streak).
- Promotions affect cumulative totals and standings only; per-hand base points
  are unchanged. Like every other total, the bonus is *derived* from the entered
  results, so back-editing a hand recomputes all downstream promotions.

Interpretation note: the source rule ("10 points for every won streak of five
games") is ambiguous about overlap and about what "game" means; v1 fixes it to
non-overlapping blocks of 5 consecutive scored (multi-card) hands, with 1-card
hands as streak-breakers. This is why the feature is optional.

## 4. Core user flows

### New game

1. Choose player count (3–6).
2. Choose game variant: **Short** (starts/ends on 1-card hands, default) or
   **Long** (starts/ends on 8-card hands). Show the resulting hand count
   and a preview of the cards-dealt sequence.
   - Optional toggle: **Promotions** (default OFF) — the ±10 streak bonus
     described in §3. Show a one-line explanation of what it does.
3. Enter player names (default: "Player 1" …).
4. Choose seating order / first dealer (drag to reorder, or "Randomize").
5. Start → app generates the full hand list for the chosen variant.

### Playing a hand

1. Header shows: hand number, cards this hand, dealer, trump status,
   bidding order.
2. **Bid entry:** for each player in bidding order, tap a number.
   The dealer's forbidden value is disabled with a tooltip
   ("Bids sum to 4 — not allowed").
3. **Result entry:** for each player enter tricks taken. Live check that
   the total matches cards dealt; block "Next" until it does.
4. App computes per-hand points and new totals; show a per-hand summary
   (made / over / under, delta).
5. Advance to next hand. Allow going **back** to edit a previous hand
   (recompute everything downstream).

### Scoreboard view

- Table: rows = hands (with cards-dealt column), columns per player
  showing `bid` and cumulative score, matching the paper layout.
- When Promotions is enabled, mark the hand where a bonus landed (e.g. a
  `+10` / `−10` badge on that player's cell) and include it in the cumulative
  total shown from that row down.
- Sticky header and sticky player-total row.
- Current leader highlighted; final screen ranks players.
- **Tie-breaking:** players with equal totals share the same rank (e.g.
  two players on the top score are both 1st, next is 3rd). No count-back.

### Resume / manage

- On launch, if an unfinished game exists, offer "Resume" or "New game".
- "End game early" and "Discard game" actions with confirmation.
- No per-game history is kept. The app maintains only two lifetime
  counters, shown on the home screen: **games played** (incremented when a
  game is started) and **games finished** (incremented when a game reaches
  the final hand; ending early or discarding does not count).

## 5. PWA requirements

- Web app manifest: name, icons (192/512, maskable), `display: standalone`,
  portrait orientation, theme/background colors.
- Service worker (via `vite-plugin-pwa`): precache the app shell; app is
  fully functional offline after first load.
- Installable prompt handling; works when launched from home screen.
- State survives reload and app kill (persisted on every mutation).
- Responsive down to ~320px width; large tap targets (min 44px); keep the
  screen awake during a game (Wake Lock API, best-effort).
- No external network calls at runtime. No analytics in v1.
- **Theme:** ship both light and dark themes with a user toggle; default to
  following the system setting.

### 5.1 UX principles

The app is used one-handed, at a table, on a phone that is passed around. These
are requirements, not aspirations — every screen is checked against them:

- **No on-screen keyboard for numeric entry.** Bids and tricks taken are entered
  via number pads or `−/+` steppers, never a free-text field. Any numeric field
  that cannot be avoided sets `inputmode="numeric"`.
- **Minimise taps to advance a hand.** When a player's entry is unambiguous,
  committing it also advances to the next player / step — no separate per-field
  "confirm" tap. Target: a clean hand is entered in one tap per player per step.
- **Autofocus the next action.** On entering a step, focus its first control
  (first bidder's pad, first name field). The primary action ("Next") sits in
  the thumb zone and is reachable without a hand-shift.
- **Text input only where the value is genuinely text** — player names, and even
  those default to `Player 1…N` so the step can be skipped entirely.
- **Respect motion and focus preferences** — `prefers-reduced-motion` for any
  step transitions; visible focus for keyboard/switch users.

## 6. Data model (sketch)

```
Game {
  id
  createdAt
  players: [{ id, name, seatIndex }]
  variant: 'short' | 'long'
  options: { promotions: boolean }   // default { promotions: false }
  firstDealerSeatIndex
  hands: Hand[]            // generated up front
  currentHandIndex
  status: 'active' | 'complete'
}

Hand {
  index
  cardsDealt
  dealerSeatIndex
  biddingOrder: playerId[]
  trump: 'none' | suit | null   // null = not recorded
  entries: {
    [playerId]: { bid: number|null, taken: number|null }
  }
}
```

Derived (never stored): per-hand points, promotion bonuses and streak
counters, cumulative totals, forbidden dealer bid, validation state.

```
Stats {           // single persisted record, independent of any Game
  gamesPlayed
  gamesFinished
}
```

## 7. Rules engine (pure functions, unit-tested)

- `generateHands(playerCount, variant, firstDealerSeatIndex) -> Hand[]`
  (`variant`: `'short'` | `'long'`)
- `dealerForHand(handIndex, playerCount, firstDealerSeatIndex)`
- `biddingOrder(hand, players)`
- `forbiddenDealerBid(cardsDealt, bidsSoFar) -> number | null`
- `handPoints({ bid, taken }) -> number`
- `validateTakenTotals(entries, cardsDealt) -> boolean`
- `promotionBonuses(game) -> { [playerId]: [{ handIndex, delta }] }` — the ±10
  streak bonuses per player (empty when `options.promotions` is false)
- `standings(game) -> [{ playerId, total, rank }]` (equal totals → equal
  rank; the next rank skips accordingly; includes promotion bonuses when
  enabled)

Keep this layer framework-free so it is trivially testable.

## 8. Screens

1. Home / resume prompt
2. New game setup (count → variant → names → seating/dealer)
3. Hand play (bid step, result step)
4. Scoreboard (full table)
5. Game over (final ranking, "New game")

## 9. Milestones

| # | Deliverable |
|---|-------------|
| M1 | Rules engine + tests (hand generation, scoring, forbidden bid, promotions) |
| M2 | Game setup + hand-play flow with local persistence |
| M3 | Scoreboard table view + back-edit with downstream recompute |
| M4 | PWA shell: manifest, service worker, offline, installable |
| M5 | Polish: wake lock, responsive pass, empty/error states, icons |

## 10. Resolved decisions

- **Game variant:** support both Short and Long games, chosen at setup.
- **Promotions:** optional ±10 streak bonus, toggled at setup, default OFF;
  non-overlapping blocks of 5 consecutive scored multi-card hands, 1-card
  hands break the streak.
- **Theme:** both light and dark, user-toggleable, defaulting to system.
- **Tie-breaking:** shared rank, no count-back.
- **History:** none — only lifetime "games played" / "games finished"
  counters.

Deferred to a possible later version: 7-player "dead hand", recording the
trump suit.
