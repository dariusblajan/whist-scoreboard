import { describe, expect, it } from 'vitest'
import { cumulativeTotals, handResults, standings } from './standings.js'

function game(players, cards, rows, { promotions = false } = {}) {
  const playerObjs = players.map((id, i) => ({ id, name: id, seatIndex: i }))
  const hands = cards.map((cardsDealt, index) => {
    const entries = {}
    for (const id of players) {
      const cell = rows[id][index]
      entries[id] = cell ? { bid: cell[0], taken: cell[1] } : { bid: null, taken: null }
    }
    return { index, cardsDealt, dealerSeatIndex: 0, biddingOrder: players, trump: null, entries }
  })
  return { players: playerObjs, variant: 'short', options: { promotions }, firstDealerSeatIndex: 0, hands }
}

/** Per-player running cumulative totals from handResults. */
function runningTotals(g) {
  const totals = {}
  for (const p of g.players) totals[p.id] = []
  let acc = Object.fromEntries(g.players.map((p) => [p.id, 0]))
  for (const hand of handResults(g)) {
    for (const row of hand) {
      acc[row.playerId] += row.points
      totals[row.playerId].push(acc[row.playerId])
    }
  }
  return totals
}

describe('the game-rules.md worked example', () => {
  const worked = game(
    ['Peter', 'John', 'Peggy'],
    [1, 1, 1, 2, 3],
    {
      Peter: [[1, 1], [0, 0], [1, 0], [0, 0], [1, 2]],
      John: [[0, 0], [0, 0], [1, 1], [2, 0], [0, 0]],
      Peggy: [[1, 0], [0, 1], [0, 0], [2, 2], [1, 1]],
    },
  )

  it('reproduces the printed cumulative columns', () => {
    const totals = runningTotals(worked)
    expect(totals.Peter).toEqual([6, 11, 10, 15, 14])
    expect(totals.John).toEqual([5, 10, 16, 14, 19])
    expect(totals.Peggy).toEqual([-1, -2, 3, 10, 16])
  })

  it('cumulativeTotals matches the final row', () => {
    expect(cumulativeTotals(worked)).toEqual({ Peter: 14, John: 19, Peggy: 16 })
  })
})

describe('cumulativeTotals', () => {
  it('ignores hands with incomplete entries', () => {
    const g = game(
      ['a', 'b'],
      [2, 2],
      { a: [[1, 1], [2, 2]], b: [[1, 1], null] },
    )
    // Only hand 0 is complete → a: +6, b: -1 (bid 1, taken 1 is made for a; b missed).
    expect(cumulativeTotals(g)).toEqual({ a: 6, b: 6 })
  })
})

/** One fabricated hand that hands each player an exact point value. */
function totalsGame(pointsById, { promotions = false } = {}) {
  const ids = Object.keys(pointsById)
  const rows = {}
  for (const id of ids) {
    const pts = pointsById[id]
    // made → 5 + taken; miss → -|taken - bid|
    rows[id] = pts >= 5 ? [[pts - 5, pts - 5]] : [[Math.abs(pts), 0]]
  }
  return game(ids, [8], rows, { promotions })
}

describe('standings ranking', () => {
  it('all distinct totals rank 1,2,3', () => {
    expect(standings(totalsGame({ a: 8, b: 7, c: 6 })).map((r) => r.rank)).toEqual([1, 2, 3])
  })

  it('two-way tie for first → 1,1,3', () => {
    const s = standings(totalsGame({ a: 8, b: 8, c: 6 }))
    expect(s.map((r) => r.rank)).toEqual([1, 1, 3])
  })

  it('three-way tie → 1,1,1', () => {
    expect(standings(totalsGame({ a: 6, b: 6, c: 6 })).map((r) => r.rank)).toEqual([1, 1, 1])
  })

  it('tie for last → 1,2,2', () => {
    expect(standings(totalsGame({ a: 8, b: 6, c: 6 })).map((r) => r.rank)).toEqual([1, 2, 2])
  })
})

describe('promotions and standings', () => {
  const flip = (promotions) =>
    game(
      ['p1', 'p2'],
      [1, 1, 1, 2, 2, 2, 2, 2],
      {
        p1: [[1, 1], [1, 1], [1, 1], [2, 0], [2, 0], [2, 0], [2, 0], [2, 0]],
        p2: [[0, 1], [0, 1], [0, 1], [2, 0], [2, 2], [2, 0], [2, 2], [2, 0]],
      },
      { promotions },
    )

  it('base totals match with promotions disabled; p1 leads', () => {
    expect(cumulativeTotals(flip(false))).toEqual({ p1: 8, p2: 5 })
    expect(standings(flip(false))[0].playerId).toBe('p1')
  })

  it('a -10 missed-streak bonus flips the lead to p2', () => {
    expect(cumulativeTotals(flip(true))).toEqual({ p1: -2, p2: 5 })
    const s = standings(flip(true))
    expect(s[0].playerId).toBe('p2')
    expect(s.map((r) => r.rank)).toEqual([1, 2])
  })
})
