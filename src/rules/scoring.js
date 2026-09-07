/**
 * Per-hand scoring and bid/result validation. Pure functions.
 * @module rules/scoring
 */

/** @param {number[]} nums */
const sum = (nums) => nums.reduce((acc, n) => acc + n, 0)

/**
 * The single bid value the dealer (last bidder) may not choose, because it would
 * make the sum of all bids equal to `cardsDealt`. Returns null when no value in
 * `0..cardsDealt` is forbidden.
 * @param {number} cardsDealt
 * @param {number[]} bidsSoFar Bids of every non-dealer player.
 * @returns {number|null}
 */
export function forbiddenDealerBid(cardsDealt, bidsSoFar) {
  const forbidden = cardsDealt - sum(bidsSoFar)
  return forbidden >= 0 && forbidden <= cardsDealt ? forbidden : null
}

/**
 * Points for one player's hand: made the contract exactly → `5 + taken`;
 * otherwise lose one point per trick over or under.
 * @param {{bid: number, taken: number}} entry
 * @returns {number}
 */
export function handPoints({ bid, taken }) {
  return taken === bid ? 5 + taken : -Math.abs(taken - bid)
}

/**
 * True iff every entry's `taken` is an integer in `0..cardsDealt` and the values
 * sum to exactly `cardsDealt`.
 * @param {Object.<string, {bid: number|null, taken: number|null}>} entries
 * @param {number} cardsDealt
 * @returns {boolean}
 */
export function validateTakenTotals(entries, cardsDealt) {
  const takens = Object.values(entries).map((e) => e.taken)
  if (!takens.every((t) => Number.isInteger(t) && t >= 0 && t <= cardsDealt)) return false
  return sum(takens) === cardsDealt
}

/**
 * Whether a bid is legal: an integer in `0..cardsDealt`, and — for the dealer —
 * not the forbidden value.
 * @param {number} bid
 * @param {number} cardsDealt
 * @param {{isDealer: boolean, bidsSoFar: number[]}} ctx
 * @returns {boolean}
 */
export function validateBid(bid, cardsDealt, { isDealer, bidsSoFar }) {
  if (!Number.isInteger(bid) || bid < 0 || bid > cardsDealt) return false
  if (isDealer && bid === forbiddenDealerBid(cardsDealt, bidsSoFar)) return false
  return true
}
