/**
 * Optional "promotions" house rule: a ±10 bonus each time a player's streak of
 * consecutive multi-card hands with the same outcome reaches a multiple of 5.
 * 1-card hands never count and reset the streak.
 * @module rules/promotions
 */

const STREAK_BLOCK = 5

/** @param {import('./types.js').Game} game */
const playerIds = (game) => game.players.map((p) => p.id)

/**
 * Per-player list of streak bonuses, each `{ handIndex, delta }` with delta ±10.
 * Every player gets an (often empty) array. All empty when promotions are off.
 * @param {import('./types.js').Game} game
 * @returns {Object.<string, Array<{handIndex: number, delta: number}>>}
 */
export function promotionBonuses(game) {
  /** @type {Object.<string, Array<{handIndex: number, delta: number}>>} */
  const result = {}
  for (const id of playerIds(game)) result[id] = []
  if (!game.options.promotions) return result

  for (const id of playerIds(game)) {
    let counter = 0
    /** @type {'made'|'missed'|null} */
    let sign = null
    for (const hand of game.hands) {
      if (hand.cardsDealt === 1) {
        counter = 0
        sign = null
        continue
      }
      const entry = hand.entries[id]
      if (entry.bid == null || entry.taken == null) break
      const outcome = entry.taken === entry.bid ? 'made' : 'missed'
      if (outcome === sign) {
        counter += 1
      } else {
        counter = 1
        sign = outcome
      }
      if (counter % STREAK_BLOCK === 0) {
        result[id].push({ handIndex: hand.index, delta: sign === 'made' ? 10 : -10 })
      }
    }
  }
  return result
}

/**
 * Sum of a player's promotion deltas.
 * @param {import('./types.js').Game} game
 * @returns {Object.<string, number>}
 */
export function promotionTotal(game) {
  /** @type {Object.<string, number>} */
  const totals = {}
  for (const [id, list] of Object.entries(promotionBonuses(game))) {
    totals[id] = list.reduce((acc, bonus) => acc + bonus.delta, 0)
  }
  return totals
}
