import { describe, expect, it } from 'vitest'
import {
  biddingOrder,
  cardsDealtSequence,
  dealerForHand,
  generateHands,
  trumpStatus,
} from './hands.js'

/** Independent reference builder for the cards-dealt sequence. */
function expectedSequence(n, variant) {
  const seq = []
  const repeat = (value, count) => {
    for (let i = 0; i < count; i += 1) seq.push(value)
  }
  if (variant === 'short') {
    repeat(1, n)
    for (let c = 2; c <= 8; c += 1) seq.push(c)
    repeat(8, n - 1)
    for (let c = 7; c >= 2; c -= 1) seq.push(c)
    repeat(1, n)
  } else {
    repeat(8, n)
    for (let c = 7; c >= 1; c -= 1) seq.push(c)
    repeat(1, n - 1)
    for (let c = 2; c <= 7; c += 1) seq.push(c)
    repeat(8, n)
  }
  return seq
}

const N4_SHORT = [1, 1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 8, 8, 8, 7, 6, 5, 4, 3, 2, 1, 1, 1, 1]
const N4_LONG = [8, 8, 8, 8, 7, 6, 5, 4, 3, 2, 1, 1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 8, 8, 8]

/** N players seated 0..N-1, ids `p0`..`p{N-1}`. */
const makePlayers = (n) =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `Player ${i + 1}`, seatIndex: i }))

describe('cardsDealtSequence / generateHands', () => {
  it('matches the brief examples for N=4', () => {
    expect(cardsDealtSequence(4, 'short')).toEqual(N4_SHORT)
    expect(cardsDealtSequence(4, 'long')).toEqual(N4_LONG)
  })

  for (const n of [3, 4, 5, 6]) {
    for (const variant of ['short', 'long']) {
      it(`N=${n} ${variant}: exact sequence and length 3N+12`, () => {
        const hands = generateHands(makePlayers(n), variant, 0)
        const seq = hands.map((h) => h.cardsDealt)
        expect(seq).toEqual(expectedSequence(n, variant))
        expect(seq).toHaveLength(3 * n + 12)
        expect(hands.map((h) => h.index)).toEqual(seq.map((_, i) => i))
      })
    }
  }

  it('every hand carries per-player entries keyed by id and a null trump', () => {
    const hands = generateHands(makePlayers(3), 'short', 0)
    for (const hand of hands) {
      expect(hand.trump).toBeNull()
      expect(Object.keys(hand.entries)).toEqual(['p0', 'p1', 'p2'])
      for (const entry of Object.values(hand.entries)) {
        expect(entry).toEqual({ bid: null, taken: null })
      }
    }
  })

  it('throws for an out-of-range player count', () => {
    expect(() => generateHands(makePlayers(2), 'short', 0)).toThrow(RangeError)
    expect(() => generateHands(makePlayers(7), 'short', 0)).toThrow(RangeError)
  })

  it('throws for an unknown variant', () => {
    expect(() => generateHands(makePlayers(4), 'medium', 0)).toThrow(RangeError)
  })
})

describe('dealerForHand', () => {
  it('hand 0 is the first dealer; rotation wraps clockwise', () => {
    expect(dealerForHand(0, 4, 2)).toBe(2)
    expect(dealerForHand(1, 4, 2)).toBe(3)
    expect(dealerForHand(2, 4, 2)).toBe(0)
    expect(dealerForHand(5, 4, 2)).toBe(3)
  })

  it('generated hands use the rotating dealer', () => {
    const hands = generateHands(makePlayers(3), 'short', 1)
    expect(hands.map((h) => h.dealerSeatIndex).slice(0, 4)).toEqual([1, 2, 0, 1])
  })
})

describe('biddingOrder', () => {
  const players = [
    { id: 'a', name: 'A', seatIndex: 0 },
    { id: 'b', name: 'B', seatIndex: 1 },
    { id: 'c', name: 'C', seatIndex: 2 },
    { id: 'd', name: 'D', seatIndex: 3 },
  ]

  it('starts left of the dealer and puts the dealer last', () => {
    expect(biddingOrder({ dealerSeatIndex: 2 }, players)).toEqual(['d', 'a', 'b', 'c'])
  })

  it('wraps correctly for every dealer seat', () => {
    for (let seat = 0; seat < 4; seat += 1) {
      const order = biddingOrder({ dealerSeatIndex: seat }, players)
      expect(order).toHaveLength(4)
      expect(order.at(-1)).toBe(players[seat].id)
      expect(order[0]).toBe(players[(seat + 1) % 4].id)
      expect(new Set(order).size).toBe(4)
    }
  })

  it('generated hands store an id bidding order that matches biddingOrder()', () => {
    const players = makePlayers(4)
    const hands = generateHands(players, 'short', 0)
    for (const hand of hands) {
      expect(hand.biddingOrder).toHaveLength(4)
      expect(hand.biddingOrder.at(-1)).toBe(`p${hand.dealerSeatIndex}`)
      expect(hand.biddingOrder).toEqual(biddingOrder(hand, players))
    }
  })
})

describe('trumpStatus', () => {
  it('1..7 have a trump, 8 is no-trump', () => {
    for (let c = 1; c <= 7; c += 1) expect(trumpStatus(c)).toBe('trump')
    expect(trumpStatus(8)).toBe('none')
  })
})
