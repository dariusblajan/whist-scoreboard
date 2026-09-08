import { describe, expect, it } from 'vitest'
import { actions, gameReducer } from './gameReducer.js'
import {
  bidStepComplete,
  dealerBidIllegal,
  forbiddenBid,
  handSummary,
  playerTallies,
  scoreboardRows,
  takenSoFar,
} from './selectors.js'

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

describe('scoreboardRows — back-edit recompute', () => {
  /** Fill hands 0..3 (1,1,1,2 cards) with everyone bidding/taking 0 except p0. */
  function fourHands() {
    let game = start()
    game = play(game, 0, { p0: [1, 1], p1: [0, 0], p2: [0, 0] })
    game = play(game, 1, { p0: [0, 0], p1: [1, 1], p2: [0, 0] })
    game = play(game, 2, { p0: [1, 1], p1: [0, 0], p2: [0, 0] })
    game = play(game, 3, { p0: [2, 2], p1: [0, 0], p2: [0, 0] })
    return game
  }

  it('editing hand 1 re-totals hands 1..end and leaves later raw entries alone', () => {
    const game = fourHands()
    const before = scoreboardRows(game)
    expect(before.rows[3].cells.p0.cumulative).toBe(6 + 5 + 6 + 7)

    const edited = play(game, 1, { p0: [1, 0] }) // p0 now misses hand 1: -1 instead of +5
    const after = scoreboardRows(edited)

    expect(after.rows[0].cells.p0.cumulative).toBe(6) // unchanged
    expect(after.rows[1].cells.p0.cumulative).toBe(6 - 1)
    expect(after.rows[3].cells.p0.cumulative).toBe(6 - 1 + 6 + 7)
    // hands 2 and 3 raw entries untouched
    expect(edited.hands[2].entries.p0).toEqual({ bid: 1, taken: 1 })
    expect(edited.hands[3].entries.p0).toEqual({ bid: 2, taken: 2 })
  })

  it('recompute is pure — no mutation, same input same output', () => {
    const game = fourHands()
    const snapshot = JSON.stringify(game)
    const a = scoreboardRows(game)
    const b = scoreboardRows(game)
    expect(JSON.stringify(game)).toBe(snapshot)
    expect(a).toEqual(b)
  })

  it('a mid-streak edit removes an earned +10 and drops every later total by 10', () => {
    let game = start({ promotions: true })
    const multi = game.hands.map((h, i) => ({ i, c: h.cardsDealt })).filter((h) => h.c !== 1).slice(0, 6)
    for (const { i } of multi) {
      game = play(game, i, {
        p0: [1, 1],
        p1: [0, 0],
        p2: [i === multi[0].i ? game.hands[i].cardsDealt - 1 : 0, game.hands[i].cardsDealt - 1],
      })
    }
    const landing = multi[4].i
    const last = multi[5].i
    const withBonus = scoreboardRows(game)
    expect(withBonus.rows[landing].cells.p0.bonus).toBe(10)
    const lastTotal = withBonus.rows[last].cells.p0.cumulative

    // p0 misses hand 3 of the streak (bid 1 → took 0): the made→miss swing is
    // -7 on that hand, and the +10 streak bonus is lost: -17 overall.
    const broken = play(game, multi[2].i, { p0: [1, 0] })
    const after = scoreboardRows(broken)
    expect(after.rows[landing].cells.p0.bonus).toBeNull()
    expect(after.rows[last].cells.p0.cumulative).toBe(lastTotal - 17)

    // re-editing back restores the bonus
    const restored = scoreboardRows(play(broken, multi[2].i, { p0: [1, 1] }))
    expect(restored.rows[landing].cells.p0.bonus).toBe(10)
    expect(restored.rows[last].cells.p0.cumulative).toBe(lastTotal)
  })

  it('carries no promotion badges when the option is off', () => {
    const game = fourHands()
    const { rows } = scoreboardRows(game)
    expect(rows.every((r) => Object.values(r.cells).every((c) => c.bonus === null))).toBe(true)
  })
})

describe('playerTallies & dealerBidIllegal', () => {
  it('counts made/over/under and folds promotion totals', () => {
    let game = start()
    game = play(game, 0, { p0: [1, 1], p1: [0, 1], p2: [1, 0] })
    const t = playerTallies(game)
    expect(t.p0).toEqual({ made: 1, over: 0, under: 0, promotion: 0 })
    expect(t.p1).toMatchObject({ over: 1 })
    expect(t.p2).toMatchObject({ under: 1 })
  })

  it('flags a stored dealer bid that is now the forbidden value', () => {
    let game = start()
    const hi = game.hands.findIndex((h) => h.cardsDealt === 6)
    const [b0, b1, dealer] = game.hands[hi].biddingOrder
    game = play(game, hi, { [b0]: [3, 0], [b1]: [1, 0], [dealer]: [2, 0] })
    expect(dealerBidIllegal(game.hands[hi])).toBe(true)
    game = play(game, hi, { [dealer]: [0, 0] })
    expect(dealerBidIllegal(game.hands[hi])).toBe(false)
  })
})
