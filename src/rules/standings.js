/**
 * Derived, never-stored aggregates: per-hand results, cumulative totals, and
 * ranked standings (with promotion bonuses folded in when enabled).
 * @module rules/standings
 */

import { handPoints } from './scoring.js'
import { promotionTotal } from './promotions.js'

/**
 * A hand is complete once every player has both a bid and a taken count.
 * @param {import('./types.js').Hand} hand
 * @param {import('./types.js').Player[]} players
 * @returns {boolean}
 */
function isHandComplete(hand, players) {
  return players.every((p) => {
    const entry = hand.entries[p.id]
    return entry.bid != null && entry.taken != null
  })
}

/**
 * Per completed hand, a row per player with `{ playerId, bid, taken, points }`.
 * @param {import('./types.js').Game} game
 * @returns {Array<Array<{playerId: string|number, bid: number, taken: number, points: number}>>}
 */
export function handResults(game) {
  return game.hands
    .filter((hand) => isHandComplete(hand, game.players))
    .map((hand) =>
      game.players.map((p) => {
        const { bid, taken } = hand.entries[p.id]
        return { playerId: p.id, bid, taken, points: handPoints({ bid, taken }) }
      }),
    )
}

/**
 * Cumulative total per player: base points over completed hands, plus promotion
 * bonuses when `game.options.promotions` is enabled.
 * @param {import('./types.js').Game} game
 * @returns {Object.<string, number>}
 */
export function cumulativeTotals(game) {
  /** @type {Object.<string, number>} */
  const totals = {}
  for (const p of game.players) totals[p.id] = 0
  for (const rows of handResults(game)) {
    for (const row of rows) totals[row.playerId] += row.points
  }
  if (game.options.promotions) {
    for (const [id, delta] of Object.entries(promotionTotal(game))) {
      totals[id] += delta
    }
  }
  return totals
}

/**
 * Players ranked by total, descending. Equal totals share a rank; the next rank
 * is `1 + (players strictly above)`, so ranks skip (1, 1, 3).
 * @param {import('./types.js').Game} game
 * @returns {Array<{playerId: string|number, total: number, rank: number}>}
 */
export function standings(game) {
  const totals = cumulativeTotals(game)
  const rows = game.players
    .map((p) => ({ playerId: p.id, total: totals[p.id] }))
    .sort((a, b) => b.total - a.total)
  return rows.map((row) => ({
    ...row,
    rank: 1 + rows.filter((other) => other.total > row.total).length,
  }))
}
