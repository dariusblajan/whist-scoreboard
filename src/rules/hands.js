/**
 * Structural rules: hand-sequence generation, dealer rotation, bidding order,
 * and trump status. Framework-free and side-effect-free.
 * @module rules/hands
 */

const MIN_PLAYERS = 3
const MAX_PLAYERS = 6
const MAX_CARDS = 8
const VARIANTS = ['short', 'long']

/**
 * Inclusive integer range, ascending when `from <= to`, otherwise descending.
 * @param {number} from
 * @param {number} to
 * @returns {number[]}
 */
function range(from, to) {
  const step = from <= to ? 1 : -1
  const out = []
  for (let n = from; step > 0 ? n <= to : n >= to; n += step) out.push(n)
  return out
}

/**
 * The full ordered `cardsDealt` sequence for a game. Length is `3 * playerCount + 12`.
 *
 * Short: `N×1`, ramp `2..8`, `(N-1)×8`, ramp `7..2`, `N×1`.
 * Long:  `N×8`, ramp `7..1`, `(N-1)×1`, ramp `2..7`, `N×8`.
 *
 * @param {number} playerCount
 * @param {'short'|'long'} variant
 * @returns {number[]}
 */
export function cardsDealtSequence(playerCount, variant) {
  const n = playerCount
  if (variant === 'short') {
    return [
      ...Array(n).fill(1),
      ...range(2, MAX_CARDS),
      ...Array(n - 1).fill(MAX_CARDS),
      ...range(MAX_CARDS - 1, 2),
      ...Array(n).fill(1),
    ]
  }
  return [
    ...Array(n).fill(MAX_CARDS),
    ...range(MAX_CARDS - 1, 1),
    ...Array(n - 1).fill(1),
    ...range(2, MAX_CARDS - 1),
    ...Array(n).fill(MAX_CARDS),
  ]
}

/**
 * Seat index of the dealer for a given hand. Dealer rotates one seat clockwise
 * per hand, wrapping around the table.
 * @param {number} handIndex
 * @param {number} playerCount
 * @param {number} firstDealerSeatIndex
 * @returns {number}
 */
export function dealerForHand(handIndex, playerCount, firstDealerSeatIndex) {
  return (firstDealerSeatIndex + handIndex) % playerCount
}

/**
 * Seat indices in bidding order for a dealer: the seat to the dealer's left
 * first, proceeding clockwise, dealer last. Private — callers and the stored
 * `Hand.biddingOrder` field both go through `biddingOrder()`.
 * @param {number} dealerSeatIndex
 * @param {number} playerCount
 * @returns {number[]}
 */
function seatBiddingOrder(dealerSeatIndex, playerCount) {
  const out = []
  for (let i = 1; i <= playerCount; i += 1) {
    out.push((dealerSeatIndex + i) % playerCount)
  }
  return out
}

/**
 * Player ids in bidding order for a hand: the seat to the dealer's left first,
 * proceeding clockwise, dealer last. This is the single source of truth — it
 * populates `Hand.biddingOrder` at generation time and is the primitive to
 * recompute after a seating change or back-edit.
 * @param {import('./types.js').Hand} hand
 * @param {import('./types.js').Player[]} players
 * @returns {Array<string|number>}
 */
export function biddingOrder(hand, players) {
  const idBySeat = new Map(players.map((p) => [p.seatIndex, p.id]))
  return seatBiddingOrder(hand.dealerSeatIndex, players.length).map((seat) => idBySeat.get(seat))
}

/**
 * Whether a hand of the given size has a turned trump card.
 * Hands of 1–7 cards have a trump; 8-card hands are no-trump.
 * @param {number} cardsDealt
 * @returns {'none'|'trump'}
 */
export function trumpStatus(cardsDealt) {
  return cardsDealt === MAX_CARDS ? 'none' : 'trump'
}

/**
 * Generate the full ordered hand list for a game. `entries` is keyed by
 * `Player.id` and `biddingOrder` holds `Player.id`s; `dealerSeatIndex` stays a
 * seat index because the dealer is a rotating position, not a fixed person.
 * @param {import('./types.js').Player[]} players 3–6 players, `seatIndex` 0..N-1
 * @param {'short'|'long'} variant
 * @param {number} firstDealerSeatIndex
 * @returns {import('./types.js').Hand[]}
 */
export function generateHands(players, variant, firstDealerSeatIndex) {
  const playerCount = players.length
  if (playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
    throw new RangeError(`player count must be ${MIN_PLAYERS}-${MAX_PLAYERS}, got ${playerCount}`)
  }
  if (!VARIANTS.includes(variant)) {
    throw new RangeError(`variant must be one of ${VARIANTS.join(', ')}, got ${variant}`)
  }
  return cardsDealtSequence(playerCount, variant).map((cardsDealt, index) => {
    const dealerSeatIndex = dealerForHand(index, playerCount, firstDealerSeatIndex)
    const entries = {}
    for (const player of players) entries[player.id] = { bid: null, taken: null }
    const hand = { index, cardsDealt, dealerSeatIndex, biddingOrder: null, trump: null, entries }
    hand.biddingOrder = biddingOrder(hand, players)
    return hand
  })
}
