# Iteration 06 — Polish (M5)

## Goal

Make it pleasant and robust on a real phone at a real table: screen stays awake,
layout holds down to 320px, theme toggle finished, and every empty/error state
is handled.

## Tasks

### Wake Lock

- `src/hooks/useWakeLock.js` — request `navigator.wakeLock.request('screen')`
  while a game is active and the tab is visible; re-acquire on `visibilitychange`;
  release on game end / unmount. Best-effort: absence of the API is a no-op, no
  error surfaced.
- Small indicator in the app bar when active (optional).

### Responsive pass

- Audit every screen at 320 / 360 / 414 / tablet widths.
- Tap targets ≥ 44px (bid pad, trick inputs, wizard controls).
- Bid number pad wraps/scrolls for 8-card hands without overflowing the viewport.
- Scoreboard: pinned first column + horizontal scroll verified for 6 players.
- One-handed reachability: primary actions ("Next", "Back") in thumb zone
  (bottom of screen), sticky.

### Input-ergonomics audit (brief §5.1)

- Walk every screen: no control raises the on-screen keyboard except NewGame's
  Names step. Bids/tricks are pads or steppers; trump/variant/count are buttons.
- Every step autofocuses its first control; focus advances on commit
  (bid → next bidder → "Next"; bid step → result step).
- Count taps for a clean 4-player hand end-to-end; note and trim any redundant
  confirm taps.
- `inputmode="numeric"` / `enterKeyHint` set on the Names fields; no stray
  `type="number"` spinners anywhere.

### Theme

- Finish light + dark palettes (contrast-checked, ≥ 4.5:1 for text).
- Toggle cycles system → light → dark; persisted; respects live OS change while
  on "system".

### Empty / error / edge states

- Home with no game and zero stats — friendly first-run copy.
- Corrupt persisted state → toast "Couldn't restore the last game" + clean slate.
- "End game early" and "Discard game" → confirm dialogs; wording distinguishes
  them (early keeps nothing but is a deliberate finish; discard is abandon).
- Attempt to open `/play` / `/scoreboard` with no active game → redirect Home.
- Guard against `playerCount`/variant tampering in persisted state (re-validate
  on load).

### Accessibility

- Labels on all inputs; number pad buttons have `aria-label` incl. disabled
  reason.
- Focus management between wizard steps and bid→result transitions.
- `prefers-reduced-motion` respected for any transitions.
- Run `axe` in a test on each screen.

### Housekeeping

- Remove dead starter CSS/assets.
- `README` screenshots + feature list.
- Final `yarn coverage` review; fill gaps in engine + store.

## Tests

- **`useWakeLock`** — mock `navigator.wakeLock`: requested on mount when game
  active; released on unmount; re-requested after simulated `visibilitychange`;
  missing API → no throw.
- **Responsive** — RTL render at 320px width (set `matchMedia` / container
  style); assert no element wider than viewport for HandPlay (8-card) and
  Scoreboard (6 players) via scrollWidth checks on the layout root vs container.
- **Theme toggle** — three-way cycle; OS change propagates only in "system"
  mode; persisted value restored.
- **Input ergonomics** — render each screen; assert no keyboard-raising element
  (`type="text"`/`"number"`, `contenteditable`) outside NewGame's Names step;
  first control of each step has focus on entry; tapping a bid advances focus.
- **Route guards** — visiting `/play` with no game redirects to `/`.
- **Corrupt state** — poisoned `localStorage` → app boots to Home with a toast,
  no crash.
- **Confirm dialogs** — "Discard" requires confirmation; cancel is a no-op;
  confirm clears the game and leaves stats.
- **axe** — `expect(await axe(container)).toHaveNoViolations()` for Home,
  NewGame (each step), HandPlay (both steps), Scoreboard, GameOver.

## Acceptance checklist

- [ ] Screen stays awake during a game on a supporting device.
- [ ] No horizontal body scroll on any screen at 320px.
- [ ] All tap targets ≥ 44px.
- [ ] No on-screen keyboard except the Names step; every step autofocuses its
      first control; no redundant confirm taps in the hand-play flow.
- [ ] Light + dark both pass contrast; toggle + system-follow work.
- [ ] Every error/empty/edge state has defined behaviour and a test.
- [ ] axe clean on all screens.
- [ ] `yarn test` green, `yarn lint` clean, `yarn build` ok, coverage reviewed.
