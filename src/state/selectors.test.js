import { describe, expect, it } from 'vitest'
import { actions, gameReducer } from './gameReducer.js'
import { bidStepComplete, forbiddenBid, handSummary, takenSoFar } from './selectors.js'

const config = (over = {}) => ({
  players: [
    { id: 'p0', name: 'A', seatIndex: 0 },
    { id: 'p1', name: 'B', seatIndex: 1 },
    { id: 'p2', name: 'C', seatIndex: 2 },
  ],
  variant: 'short',
  firstDealerSeatIndex: 0,
  promotions: false,
  ...over,
})

const start = (over) =>
  gameReducer({ game: null, stats: { gamesPlayed: 0, gamesFinished: 0 } }, actions.newGame(config(over)))
    .game

/** Set bid=taken=value for one player on one hand. */
function play(game, handIndex, values) {
  let state = { game, stats: {} }
  for (const [id, [bid, taken]] of Object.entries(values)) {
    state = gameReducer(state, actions.setBid(handIndex, id, bid))
    state = gameReducer(state, actions.setTaken(handIndex, id, taken))
  }
  return state.game
}

describe('selectors', () => {
  it('forbiddenBid is null until every non-dealer has bid, then the balancing value', () => {
    let game = start()
    const hi = game.hands.findIndex((h) => h.cardsDealt === 6) // index 7
    const hand = () => game.hands[hi]
    const [b0, b1] = hand().biddingOrder

    expect(forbiddenBid(hand())).toBeNull()
    game = play(game, hi, { [b0]: [3, 3] })
    expect(forbiddenBid(hand())).toBeNull()
    game = play(game, hi, { [b1]: [1, 1] })
    expect(forbiddenBid(hand())).toBe(2) // 6 - (3 + 1)
  })

  it('bidStepComplete rejects the dealer taking the forbidden value', () => {
    let game = start()
    const hi = game.hands.findIndex((h) => h.cardsDealt === 6)
    const [b0, b1, dealer] = game.hands[hi].biddingOrder
    game = play(game, hi, { [b0]: [3, 0], [b1]: [1, 0] })
    let state = { game, stats: {} }
    state = gameReducer(state, actions.setBid(hi, dealer, 2))
    expect(bidStepComplete(state.game.hands[hi])).toBe(false)
    state = gameReducer(state, actions.setBid(hi, dealer, 0))
    expect(bidStepComplete(state.game.hands[hi])).toBe(true)
  })

  it('takenSoFar sums entered tricks, treating blanks as zero', () => {
    let game = start()
    game = play(game, 3, { p0: [1, 2] }) // hand 3 is a 2-card hand
    expect(takenSoFar(game.hands[3])).toBe(2)
  })

  it('handSummary reports per-player deltas and the cumulative total', () => {
    let game = start()
    game = play(game, 0, { p0: [1, 1], p1: [0, 0], p2: [0, 0] }) // 1-card hand
    const { rows, totals } = handSummary(game, 0)
    const p0 = rows.find((r) => r.playerId === 'p0')
    expect(p0).toMatchObject({ bid: 1, taken: 1, points: 6, outcome: 'made' })
    expect(totals.p0).toBe(6)
  })

  it('handSummary surfaces a +10 promotion bonus on the hand it lands', () => {
    let game = start({ promotions: true })
    // Multi-card hands start at index 3 (1,1,1,2,3,4,5,...). Make five in a row for p0.
    const multiCard = game.hands
      .map((h, i) => ({ i, cards: h.cardsDealt }))
      .filter((h) => h.cards !== 1)
      .slice(0, 5)
    for (const { i } of multiCard) {
      game = play(game, i, {
        p0: [1, 1],
        p1: [0, 0],
        p2: [i === multiCard[0].i ? game.hands[i].cardsDealt - 1 : 0, game.hands[i].cardsDealt - 1],
      })
    }
    const landing = multiCard[4].i
    const { bonuses } = handSummary(game, landing)
    expect(bonuses.p0).toBe(10)
    // No bonus on the fourth hand of the streak.
    expect(handSummary(game, multiCard[3].i).bonuses.p0).toBeUndefined()
  })
})
