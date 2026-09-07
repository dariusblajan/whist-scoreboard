import { describe, expect, it } from 'vitest'
import * as rules from './index.js'

describe('rules public surface', () => {
  it('re-exports every rules function', () => {
    expect(Object.keys(rules).sort()).toEqual(
      [
        'biddingOrder',
        'cardsDealtSequence',
        'cumulativeTotals',
        'dealerForHand',
        'forbiddenDealerBid',
        'generateHands',
        'handPoints',
        'handResults',
        'promotionBonuses',
        'promotionTotal',
        'standings',
        'trumpStatus',
        'validateBid',
        'validateTakenTotals',
      ].sort(),
    )
    for (const fn of Object.values(rules)) expect(typeof fn).toBe('function')
  })
})
