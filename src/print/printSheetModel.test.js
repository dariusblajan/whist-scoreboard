import { describe, expect, it } from 'vitest'
import { printSheetModel } from './printSheetModel.js'
import { cardsDealtSequence } from '../rules/hands.js'

/** The worked example from docs/game-rules.md: Peter / John / Peggy, first 5 hands. */
const EXAMPLE_GAME = {
  players: [
    { id: 'peter', name: 'Peter', seatIndex: 0 },
    { id: 'john', name: 'John', seatIndex: 1 },
    { id: 'peggy', name: 'Peggy', seatIndex: 2 },
  ],
  variant: 'short',
  options: { promotions: false },
  firstDealerSeatIndex: 0,
}

const HANDS = [
  { peter: [1, 1], john: [0, 0], peggy: [0, 1] },
  { peter: [0, 0], john: [0, 0], peggy: [0, 1] },
  { peter: [1, 0], john: [1, 1], peggy: [0, 0] },
  { peter: [0, 0], john: [2, 0], peggy: [2, 2] },
  { peter: [1, 2], john: [0, 0], peggy: [1, 1] },
]

function buildExampleGame() {
  const cards = cardsDealtSequence(3, 'short')
  const hands = cards.map((cardsDealt, index) => {
    const entries = {}
    for (const p of EXAMPLE_GAME.players) entries[p.id] = { bid: null, taken: null }
    const dealerSeatIndex = index % 3
    return { index, cardsDealt, dealerSeatIndex, biddingOrder: ['peter', 'john', 'peggy'], trump: null, entries }
  })
  HANDS.forEach((entries, i) => {
    for (const [id, [bid, taken]] of Object.entries(entries)) {
      hands[i].entries[id] = { bid, taken }
    }
  })
  return { ...EXAMPLE_GAME, hands }
}

/** Compact game builder for promotion streak fixtures, mirrors rules/promotions.test.js. */
function makeStreakGame(cards, sheet, { promotions = true } = {}) {
  const ids = Object.keys(sheet)
  const players = ids.map((id, i) => ({ id, name: id, seatIndex: i }))
  const hands = cards.map((cardsDealt, index) => {
    const entries = {}
    for (const id of ids) {
      const code = sheet[id][index]
      entries[id] = code === 'M' ? { bid: 1, taken: 1 } : { bid: 1, taken: 0 }
    }
    return { index, cardsDealt, dealerSeatIndex: 0, biddingOrder: ids, trump: null, entries }
  })
  return { players, variant: 'short', options: { promotions }, firstDealerSeatIndex: 0, hands }
}

describe('printSheetModel — filled sheet', () => {
  it('carries the documented cumulative numbers for the first 5 hands', () => {
    const model = printSheetModel({ game: buildExampleGame() })
    const expected = {
      0: { peter: 6, john: 5, peggy: -1 },
      1: { peter: 11, john: 10, peggy: -2 },
      2: { peter: 10, john: 16, peggy: 3 },
      3: { peter: 15, john: 14, peggy: 10 },
      4: { peter: 14, john: 19, peggy: 16 },
    }
    for (const [i, byId] of Object.entries(expected)) {
      const row = model.rows[i]
      for (const [id, cumulative] of Object.entries(byId)) {
        expect(row.cells[id].cumulative).toBe(cumulative)
      }
    }
  })

  it('leaves unplayed hands with null cells', () => {
    const model = printSheetModel({ game: buildExampleGame() })
    const row = model.rows[5]
    expect(row.cells.peter).toEqual({ bid: null, cumulative: null, bonus: null })
  })

  it('places a promotion marker on the hand where the streak lands, and none when disabled', () => {
    const cards = Array(5).fill(2)
    const on = printSheetModel({ game: makeStreakGame(cards, { p1: 'MMMMM' }, { promotions: true }) })
    expect(on.rows.map((r) => r.cells.p1.bonus)).toEqual([null, null, null, null, 10])

    const off = printSheetModel({ game: makeStreakGame(cards, { p1: 'MMMMM' }, { promotions: false }) })
    expect(off.rows.map((r) => r.cells.p1.bonus)).toEqual([null, null, null, null, null])
  })

  it('returns totals and ranked standings from the rules engine', () => {
    const model = printSheetModel({ game: buildExampleGame() })
    expect(model.totals).toEqual({ peter: 14, john: 19, peggy: 16 })
    expect(model.standings.find((s) => s.playerId === 'john').rank).toBe(1)
  })
})

describe('printSheetModel — blank sheet', () => {
  it('yields 3N+12 rows with the right cards-dealt sequence and empty cells', () => {
    const model = printSheetModel({ config: { playerCount: 4, variant: 'short' } })
    expect(model.rows).toHaveLength(3 * 4 + 12)
    expect(model.rows.map((r) => r.cardsDealt)).toEqual(cardsDealtSequence(4, 'short'))
    for (const row of model.rows) {
      for (const player of model.players) {
        expect(row.cells[player.id]).toEqual({ bid: null, cumulative: null, bonus: null })
      }
    }
    expect(model.totals).toBeNull()
    expect(model.standings).toBeNull()
  })

  it('places a separator only around the opening and closing 1-card blocks', () => {
    const model = printSheetModel({ config: { playerCount: 3, variant: 'short' } })
    const separatorIndexes = model.rows.flatMap((r, i) => (r.separator ? [i] : []))
    // 3 players, short: [1,1,1] [2..8] [8,8] [7..2] [1,1,1] (indices 0-2, 3-9,
    // 10-11, 12-17, 18-20). Separators sit at the 1→2 and 2→1 transitions.
    expect(separatorIndexes).toEqual([3, 18])
  })

  it('supports the long variant and promotions flag', () => {
    const model = printSheetModel({ config: { playerCount: 5, variant: 'long', promotions: true } })
    expect(model.meta).toEqual({ variant: 'long', playerCount: 5, promotions: true, filled: false })
    expect(model.rows[0].cardsDealt).toBe(8)
  })
})
