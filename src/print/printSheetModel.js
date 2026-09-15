/**
 * Pure builder for the printable score sheet: derives a flat row/column model
 * from either a live `Game` (filled sheet) or a `{ playerCount, variant,
 * promotions }` config (blank sheet, no game required). No React, no DOM —
 * safe to render server-agnostic.
 * @module print/printSheetModel
 */

import { generateHands } from '../rules/hands.js'
import { handPoints } from '../rules/scoring.js'
import { promotionBonuses } from '../rules/promotions.js'
import { cumulativeTotals, standings } from '../rules/standings.js'

/** Seat-ordered players for a blank sheet: no names to show, just "Player N".
 * `playerLabel(n)` names seat `n` (1-based) — callers pass a localized one;
 * defaults to English so this stays usable without a translator. */
function placeholderPlayers(playerCount, playerLabel = (n) => `Player ${n}`) {
  return Array.from({ length: playerCount }, (_, i) => ({
    id: `p${i}`,
    name: playerLabel(i + 1),
    seatIndex: i,
  }))
}

/** Player at a seat, or null if the seat is out of range. */
function playerAtSeat(players, seatIndex) {
  return players.find((p) => p.seatIndex === seatIndex) ?? null
}

/**
 * A thin rule belongs between the opening/closing 1-card blocks and the ramps
 * either side of them — never between the two long flat blocks in the middle.
 */
function separatesFromOnesBlock(prevCardsDealt, cardsDealt) {
  return prevCardsDealt != null && (prevCardsDealt === 1) !== (cardsDealt === 1)
}

/**
 * Build the row list shared by both blank and filled sheets.
 * `entriesFor(hand)` returns the per-player `{ bid, cumulative, bonus }` cells
 * for that hand — all-null for a blank sheet.
 */
function buildRows(hands, players, entriesFor) {
  let prevCardsDealt = null
  return hands.map((hand) => {
    const dealer = playerAtSeat(players, hand.dealerSeatIndex)
    const row = {
      handIndex: hand.index,
      cardsDealt: hand.cardsDealt,
      dealerName: dealer ? dealer.name : '',
      separator: separatesFromOnesBlock(prevCardsDealt, hand.cardsDealt),
      cells: entriesFor(hand),
    }
    prevCardsDealt = hand.cardsDealt
    return row
  })
}

/** Blank sheet: the correct hand grid, empty cells, no game required. */
function fromConfig({ playerCount, variant, promotions = false, playerLabel }) {
  const players = placeholderPlayers(playerCount, playerLabel)
  const hands = generateHands(players, variant, 0)
  const emptyCells = () => {
    const cells = {}
    for (const p of players) cells[p.id] = { bid: null, cumulative: null, bonus: null }
    return cells
  }
  return {
    title: 'Romanian Whist',
    meta: { variant, playerCount, promotions: Boolean(promotions), filled: false },
    players,
    rows: buildRows(hands, players, emptyCells),
    totals: null,
    standings: null,
  }
}

/** Filled sheet: live numbers straight off the rules engine. */
function fromGame(game) {
  const bonusByHand = {}
  if (game.options.promotions) {
    for (const [id, list] of Object.entries(promotionBonuses(game))) {
      for (const bonus of list) {
        bonusByHand[bonus.handIndex] ??= {}
        bonusByHand[bonus.handIndex][id] = bonus.delta
      }
    }
  }

  const running = {}
  for (const p of game.players) running[p.id] = 0

  const entriesFor = (hand) => {
    const played = game.players.every((p) => {
      const entry = hand.entries[p.id]
      return entry.bid != null && entry.taken != null
    })
    const cells = {}
    for (const p of game.players) {
      const entry = hand.entries[p.id]
      const bonus = bonusByHand[hand.index]?.[p.id] ?? null
      if (played) {
        running[p.id] += handPoints({ bid: entry.bid, taken: entry.taken })
        if (bonus != null) running[p.id] += bonus
      }
      cells[p.id] = { bid: entry.bid, cumulative: played ? running[p.id] : null, bonus }
    }
    return cells
  }

  return {
    title: 'Romanian Whist',
    meta: {
      variant: game.variant,
      playerCount: game.players.length,
      promotions: game.options.promotions,
      filled: true,
    },
    players: game.players,
    rows: buildRows(game.hands, game.players, entriesFor),
    totals: cumulativeTotals(game),
    standings: standings(game),
  }
}

/**
 * @param {{ game?: import('../rules/types.js').Game,
 *   config?: { playerCount: number, variant: 'short'|'long', promotions?: boolean,
 *     playerLabel?: (seat: number) => string } }} source `config.playerLabel`
 *   names a blank sheet's placeholder seats (1-based); defaults to English
 *   "Player N" — pass a localized one from the caller.
 * @returns {?{ title: string, meta: object, players: Array, rows: Array,
 *   totals: ?Object.<string, number>, standings: ?Array }}
 */
export function printSheetModel({ game, config } = {}) {
  if (game) return fromGame(game)
  if (config) return fromConfig(config)
  return null
}
