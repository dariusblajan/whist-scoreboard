/**
 * Derived views over a `Game`. Nothing here is stored — every value is a pure
 * function of the game state, safe to call on each render.
 * @module state/selectors
 */

import {
  cumulativeTotals,
  forbiddenDealerBid,
  handPoints,
  promotionBonuses,
  validateBid,
  validateTakenTotals,
} from '../rules/index.js'

/** The hand the player is currently on. */
export function currentHand(game) {
  return game.hands[game.currentHandIndex]
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
