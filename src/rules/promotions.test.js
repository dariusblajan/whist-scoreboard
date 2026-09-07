import { describe, expect, it } from 'vitest'
import { promotionBonuses, promotionTotal } from './promotions.js'

/**
 * Build a game from a compact spec. `sheet` maps playerId → array of results,
 * one per hand, aligned with `cards`:
 *   'M'  made      'X'  missed      '.'  not yet entered      'H'  bid only (dangling)
 */
function makeGame(cards, sheet, { promotions = true } = {}) {
  const ids = Object.keys(sheet)
  const players = ids.map((id, i) => ({ id, name: id, seatIndex: i }))
  const hands = cards.map((cardsDealt, index) => {
    const entries = {}
    for (const id of ids) {
      const code = sheet[id][index]
      if (code === 'M') entries[id] = { bid: 1, taken: 1 }
      else if (code === 'X') entries[id] = { bid: 1, taken: 0 }
      else if (code === 'H') entries[id] = { bid: 1, taken: null }
      else entries[id] = { bid: null, taken: null }
    }
    return { index, cardsDealt, dealerSeatIndex: 0, biddingOrder: ids, trump: null, entries }
  })
  return { players, variant: 'short', options: { promotions }, firstDealerSeatIndex: 0, hands }
}

describe('promotionBonuses', () => {
  it('returns all-empty when promotions are disabled', () => {
    const game = makeGame(Array(10).fill(2), { p1: 'MMMMMMMMMM' }, { promotions: false })
    expect(promotionBonuses(game)).toEqual({ p1: [] })
    expect(promotionTotal(game)).toEqual({ p1: 0 })
  })

  it('emits +10 at the 5th and 10th made multi-card hand, nothing on the 6th', () => {
    const game = makeGame(Array(10).fill(2), { p1: 'MMMMMMMMMM' })
    expect(promotionBonuses(game).p1).toEqual([
      { handIndex: 4, delta: 10 },
      { handIndex: 9, delta: 10 },
    ])
    expect(promotionTotal(game)).toEqual({ p1: 20 })
  })

  it('emits -10 for a five-hand missed streak', () => {
    const game = makeGame(Array(5).fill(2), { p1: 'XXXXX' })
    expect(promotionBonuses(game).p1).toEqual([{ handIndex: 4, delta: -10 }])
  })

  it('a broken streak of four earns nothing and restarts the counter', () => {
    const game = makeGame(Array(6).fill(2), { p1: 'MMMMXX' })
    expect(promotionBonuses(game).p1).toEqual([])
  })

  it('a 1-card hand in the middle resets a would-be five-streak', () => {
    const game = makeGame([2, 2, 1, 2, 2, 2], { p1: 'MMMMMM' })
    expect(promotionBonuses(game).p1).toEqual([])
  })

  it('1-card hands are never emitted and never counted', () => {
    // Five made multi-card hands interleaved with 1-card hands still never reach 5.
    const game = makeGame([2, 1, 2, 1, 2, 1, 2, 1, 2], { p1: 'MMMMMMMMM' })
    expect(promotionBonuses(game).p1).toEqual([])
  })

  it('only the player who hits the streak is rewarded', () => {
    const game = makeGame(Array(5).fill(2), { a: 'MMMMM', b: 'MXMXM' })
    expect(promotionBonuses(game)).toEqual({
      a: [{ handIndex: 4, delta: 10 }],
      b: [],
    })
  })

  it('incomplete trailing hands do not produce phantom bonuses', () => {
    // 5 made then the 6th hand only has a bid entered → walk stops after hand 4.
    const dangling = makeGame(Array(7).fill(2), { p1: 'MMMMMH.' })
    expect(promotionBonuses(dangling).p1).toEqual([{ handIndex: 4, delta: 10 }])

    // 4 made then nothing → no bonus at all.
    const short = makeGame(Array(7).fill(2), { p1: 'MMMM...' })
    expect(promotionBonuses(short).p1).toEqual([])
  })
})
