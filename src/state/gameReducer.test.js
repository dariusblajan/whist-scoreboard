import { describe, expect, it } from 'vitest'
import { actions, gameReducer } from './gameReducer.js'

const players = (n) =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `Player ${i + 1}`, seatIndex: i }))

const config = (over = {}) => ({
  players: players(3),
  variant: 'short',
  firstDealerSeatIndex: 0,
  promotions: false,
  ...over,
})

const freshState = () => ({ game: null, stats: { gamesPlayed: 0, gamesFinished: 0 } })

const started = (over) => gameReducer(freshState(), actions.newGame(config(over)))

/** Fill every entry of a hand with bid=taken so the hand is "complete". */
function completeHand(state, handIndex) {
  let next = state
  const hand = state.game.hands[handIndex]
  const ids = state.game.players.map((p) => p.id)
  ids.forEach((id, i) => {
    const taken = i === 0 ? hand.cardsDealt : 0
    next = gameReducer(next, actions.setBid(handIndex, id, taken))
    next = gameReducer(next, actions.setTaken(handIndex, id, taken))
  })
  return next
}

describe('gameReducer', () => {
  it('newGame builds 3N+12 hands and bumps gamesPlayed', () => {
    const state = started()
    expect(state.game.hands).toHaveLength(3 * 3 + 12)
    expect(state.game.status).toBe('active')
    expect(state.game.currentHandIndex).toBe(0)
    expect(state.stats.gamesPlayed).toBe(1)
    expect(state.stats.gamesFinished).toBe(0)
  })

  it('newGame stores options.promotions from config', () => {
    expect(started({ promotions: true }).game.options.promotions).toBe(true)
    expect(started().game.options.promotions).toBe(false)
  })

  it('setBid and setTaken update only the targeted entry', () => {
    let state = started()
    state = gameReducer(state, actions.setBid(2, 'p1', 3))
    state = gameReducer(state, actions.setTaken(2, 'p1', 2))
    expect(state.game.hands[2].entries.p1).toEqual({ bid: 3, taken: 2 })
    expect(state.game.hands[2].entries.p0).toEqual({ bid: null, taken: null })
    expect(state.game.hands[1].entries.p1).toEqual({ bid: null, taken: null })
  })

  it('goToHand clamps to the valid range', () => {
    const state = started()
    expect(gameReducer(state, actions.goToHand(-5)).game.currentHandIndex).toBe(0)
    expect(gameReducer(state, actions.goToHand(999)).game.currentHandIndex).toBe(
      state.game.hands.length - 1,
    )
  })

  it('finishGame sets status complete and bumps gamesFinished exactly once', () => {
    let state = started()
    state = gameReducer(state, actions.finishGame())
    state = gameReducer(state, actions.finishGame())
    expect(state.game.status).toBe('complete')
    expect(state.stats.gamesFinished).toBe(1)
  })

  it('endGameEarly completes the game without bumping gamesFinished', () => {
    const state = gameReducer(started(), actions.endGameEarly())
    expect(state.game.status).toBe('complete')
    expect(state.stats.gamesFinished).toBe(0)
  })

  it('discardGame clears the game but leaves stats intact', () => {
    const state = gameReducer(started(), actions.discardGame())
    expect(state.game).toBeNull()
    expect(state.stats.gamesPlayed).toBe(1)
  })

  it('commitHand records no-trump on 8-card hands only', () => {
    let state = started()
    const eight = state.game.hands.findIndex((h) => h.cardsDealt === 8)
    const one = state.game.hands.findIndex((h) => h.cardsDealt === 1)
    state = gameReducer(state, actions.commitHand(eight))
    state = gameReducer(state, actions.commitHand(one))
    expect(state.game.hands[eight].trump).toBe('none')
    expect(state.game.hands[one].trump).toBeNull()
  })

  it('completing every hand and finishing bumps gamesFinished once', () => {
    let state = started()
    for (let i = 0; i < state.game.hands.length; i += 1) state = completeHand(state, i)
    state = gameReducer(state, actions.finishGame())
    expect(state.game.status).toBe('complete')
    expect(state.stats.gamesFinished).toBe(1)
  })
})
