/**
 * Derived views over a `Game`. Nothing here is stored — every value is a pure
 * function of the game state, safe to call on each render.
 * @module state/selectors
 */

import {
  cumulativeTotals,
  forbiddenDealerBid,
  handPoints,
  handResults,
  promotionBonuses,
  promotionTotal,
  validateBid,
  validateTakenTotals,
} from '../rules/index.js'

/** The hand the player is currently on. */
export function currentHand(game) {
  return game.hands[game.currentHandIndex]
}

/** A hand is complete once every player has both a bid and a taken count. */
export function handComplete(game, hand) {
  return game.players.every((p) => {
    const entry = hand.entries[p.id]
    return entry.bid != null && entry.taken != null
  })
}

/**
 * Index of the first hand still missing entries — the hand play has reached.
 * Falls back to the last hand when every hand is complete.
 */
export function firstIncompleteHandIndex(game) {
  const idx = game.hands.findIndex((hand) => !handComplete(game, hand))
  return idx === -1 ? game.hands.length - 1 : idx
}

/** Player lookup by id. */
export function playerName(game, playerId) {
  const player = game.players.find((p) => p.id === playerId)
  return player ? player.name : String(playerId)
}

/** Seat index of the dealer for a hand → the dealer player. */
export function dealerPlayer(game, hand) {
  return game.players.find((p) => p.seatIndex === hand.dealerSeatIndex) ?? null
}

/** The non-dealer bids entered so far, in bidding order. `null` slots for gaps. */
function nonDealerBids(hand) {
  return hand.biddingOrder.slice(0, -1).map((id) => hand.entries[id].bid)
}

/**
 * The single bid value the dealer may not pick, or `null` when it is not yet
 * determined (a non-dealer bid is still missing) or nothing is forbidden.
 */
export function forbiddenBid(hand) {
  const bids = nonDealerBids(hand)
  if (bids.some((b) => b == null)) return null
  return forbiddenDealerBid(hand.cardsDealt, bids)
}

/**
 * Whether the dealer's stored bid is now the forbidden value — e.g. after an
 * earlier hand was back-edited. Non-blocking: surfaced as a warning, never
 * auto-cleared. `false` until every non-dealer bid is present.
 */
export function dealerBidIllegal(hand) {
  const order = hand.biddingOrder
  const dealerId = order[order.length - 1]
  const dealerBid = hand.entries[dealerId].bid
  if (dealerBid == null) return false
  const forbidden = forbiddenBid(hand)
  return forbidden != null && dealerBid === forbidden
}

/** Whether every player has a legal bid for the hand. */
export function bidStepComplete(hand) {
  const order = hand.biddingOrder
  return order.every((id, i) => {
    const bid = hand.entries[id].bid
    if (bid == null) return false
    const isDealer = i === order.length - 1
    return validateBid(bid, hand.cardsDealt, {
      isDealer,
      bidsSoFar: order.slice(0, i).map((pid) => hand.entries[pid].bid),
    })
  })
}

/** Whether tricks-taken across the hand form a valid distribution. */
export function takenStepComplete(hand) {
  return validateTakenTotals(hand.entries, hand.cardsDealt)
}

/** Running sum of tricks taken entered so far (nulls treated as 0). */
export function takenSoFar(hand) {
  return Object.values(hand.entries).reduce((acc, e) => acc + (e.taken ?? 0), 0)
}

/**
 * Per-hand summary rows plus the cumulative total each player reaches once this
 * hand is counted, and any promotion bonus that lands on this hand.
 * @returns {{ rows: Array<{playerId: string|number, bid: number, taken: number,
 *   points: number, outcome: 'made'|'over'|'under'}>,
 *   totals: Object.<string, number>,
 *   bonuses: Object.<string, number> }}
 */
export function handSummary(game, handIndex) {
  const hand = game.hands[handIndex]
  const rows = game.players.map((p) => {
    const { bid, taken } = hand.entries[p.id]
    const outcome = taken === bid ? 'made' : taken > bid ? 'over' : 'under'
    return { playerId: p.id, bid, taken, points: handPoints({ bid, taken }), outcome }
  })

  const through = { ...game, hands: game.hands.slice(0, handIndex + 1) }
  const totals = cumulativeTotals(through)

  const bonuses = {}
  if (game.options.promotions) {
    for (const [id, list] of Object.entries(promotionBonuses(game))) {
      const landed = list.find((b) => b.handIndex === handIndex)
      if (landed) bonuses[id] = landed.delta
    }
  }

  return { rows, totals, bonuses }
}

/**
 * The full paper-scoreboard model: one row per hand, each with the cards dealt,
 * whether it has been played, and a per-player cell of `{ bid, taken,
 * cumulative, bonus }`. `cumulative` and `bonus` are `null` on unplayed hands
 * and where no ±10 promotion landed. Totals re-derive on every call, so a
 * back-edit is reflected automatically.
 * @returns {{ rows: Array<{handIndex: number, cardsDealt: number, played: boolean,
 *   cells: Object.<string, {bid: number|null, taken: number|null,
 *     cumulative: number|null, bonus: number|null}>}>,
 *   totals: Object.<string, number>,
 *   leaders: Set<string|number> }}
 */
export function scoreboardRows(game) {
  const running = {}
  for (const p of game.players) running[p.id] = 0

  const bonusByHand = {}
  if (game.options.promotions) {
    for (const [id, list] of Object.entries(promotionBonuses(game))) {
      for (const bonus of list) {
        bonusByHand[bonus.handIndex] ??= {}
        bonusByHand[bonus.handIndex][id] = bonus.delta
      }
    }
  }

  const rows = game.hands.map((hand) => {
    const played = handComplete(game, hand)
    const cells = {}
    for (const p of game.players) {
      const entry = hand.entries[p.id]
      const bonus = bonusByHand[hand.index]?.[p.id] ?? null
      if (played) {
        running[p.id] += handPoints({ bid: entry.bid, taken: entry.taken })
        if (bonus != null) running[p.id] += bonus
      }
      cells[p.id] = {
        bid: entry.bid,
        taken: entry.taken,
        cumulative: played ? running[p.id] : null,
        bonus,
      }
    }
    return { handIndex: hand.index, cardsDealt: hand.cardsDealt, played, cells }
  })

  const totals = cumulativeTotals(game)
  const best = Math.max(...Object.values(totals))
  const leaders = new Set(
    game.players.filter((p) => totals[p.id] === best).map((p) => p.id),
  )

  return { rows, totals, leaders }
}

/**
 * Per-player game tallies for the Game Over screen: how many hands were made,
 * over, and under, plus the net promotion points (0 when promotions are off).
 * @returns {Object.<string, {made: number, over: number, under: number, promotion: number}>}
 */
export function playerTallies(game) {
  const out = {}
  for (const p of game.players) out[p.id] = { made: 0, over: 0, under: 0, promotion: 0 }
  for (const rows of handResults(game)) {
    for (const row of rows) {
      const bucket = row.taken === row.bid ? 'made' : row.taken > row.bid ? 'over' : 'under'
      out[row.playerId][bucket] += 1
    }
  }
  if (game.options.promotions) {
    for (const [id, delta] of Object.entries(promotionTotal(game))) {
      out[id].promotion = delta
    }
  }
  return out
}
