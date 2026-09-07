import { describe, expect, it } from 'vitest'
import {
  forbiddenDealerBid,
  handPoints,
  validateBid,
  validateTakenTotals,
} from './scoring.js'

describe('forbiddenDealerBid', () => {
  it('brief example: 6 cards, bids [3,1] → forbidden 2', () => {
    expect(forbiddenDealerBid(6, [3, 1])).toBe(2)
  })

  it('null when the difference is negative', () => {
    expect(forbiddenDealerBid(6, [4, 5])).toBeNull()
  })

  it('null when the difference exceeds cardsDealt', () => {
    expect(forbiddenDealerBid(6, [-1])).toBeNull()
  })

  it('boundaries 0 and cardsDealt are forbidden values, not null', () => {
    expect(forbiddenDealerBid(6, [6])).toBe(0)
    expect(forbiddenDealerBid(6, [0])).toBe(6)
    expect(forbiddenDealerBid(6, [])).toBe(6)
  })
})

describe('handPoints', () => {
  it.each([
    [3, 3, 8],
    [0, 0, 5],
    [3, 2, -1],
    [3, 4, -1],
    [3, 1, -2],
    [3, 5, -2],
    [3, 0, -3],
    [3, 6, -3],
  ])('bid %i taken %i → %i', (bid, taken, points) => {
    expect(handPoints({ bid, taken })).toBe(points)
  })
})

describe('validateTakenTotals', () => {
  const entries = (...takens) =>
    Object.fromEntries(takens.map((taken, i) => [`p${i}`, { bid: 0, taken }]))

  it('passes when every taken is in range and the sum matches', () => {
    expect(validateTakenTotals(entries(1, 2, 0), 3)).toBe(true)
  })

  it('fails when the sum is over or under', () => {
    expect(validateTakenTotals(entries(2, 2, 0), 3)).toBe(false)
    expect(validateTakenTotals(entries(1, 1, 0), 3)).toBe(false)
  })

  it('fails on a null, non-integer, or out-of-range entry', () => {
    expect(validateTakenTotals(entries(1, null, 2), 3)).toBe(false)
    expect(validateTakenTotals(entries(1.5, 1, 0.5), 3)).toBe(false)
    expect(validateTakenTotals(entries(-1, 2, 2), 3)).toBe(false)
    expect(validateTakenTotals(entries(4, 0, 0), 3)).toBe(false)
  })
})

describe('validateBid', () => {
  const nonDealer = { isDealer: false, bidsSoFar: [3, 1] }
  const dealer = { isDealer: true, bidsSoFar: [3, 1] }

  it('rejects non-integers and out-of-range values', () => {
    expect(validateBid(1.5, 6, nonDealer)).toBe(false)
    expect(validateBid(-1, 6, nonDealer)).toBe(false)
    expect(validateBid(7, 6, nonDealer)).toBe(false)
  })

  it('rejects the dealer forbidden value, accepts the rest', () => {
    expect(validateBid(2, 6, dealer)).toBe(false)
    expect(validateBid(3, 6, dealer)).toBe(true)
    expect(validateBid(0, 6, dealer)).toBe(true)
  })

  it('does not constrain a non-dealer', () => {
    expect(validateBid(2, 6, nonDealer)).toBe(true)
  })
})
