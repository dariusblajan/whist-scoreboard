import { describe, expect, it, vi } from 'vitest'
import {
  GAME_VERSION,
  clearGame,
  loadGame,
  loadStats,
  saveGame,
  saveStats,
} from './persistence.js'

const sampleGame = () => ({
  id: 'g1',
  players: [
    { id: 'p0', name: 'A', seatIndex: 0 },
    { id: 'p1', name: 'B', seatIndex: 1 },
    { id: 'p2', name: 'C', seatIndex: 2 },
  ],
  variant: 'short',
  options: { promotions: true },
  firstDealerSeatIndex: 0,
  hands: [{ index: 0, cardsDealt: 1, dealerSeatIndex: 0, biddingOrder: ['p1', 'p2', 'p0'], trump: null, entries: {} }],
  currentHandIndex: 0,
  status: 'active',
})

describe('persistence', () => {
  it('round-trips a game including options.promotions', () => {
    const game = sampleGame()
    saveGame(game)
    expect(loadGame()).toEqual(game)
  })

  it('round-trips stats', () => {
    saveStats({ gamesPlayed: 3, gamesFinished: 1 })
    expect(loadStats()).toEqual({ gamesPlayed: 3, gamesFinished: 1 })
  })

  it('defaults stats to zeroes when nothing is stored', () => {
    expect(loadStats()).toEqual({ gamesPlayed: 0, gamesFinished: 0 })
  })

  it('loads a stored game without options as promotions: false', () => {
    const game = sampleGame()
    delete game.options
    localStorage.setItem('whist:game:v1', JSON.stringify({ version: GAME_VERSION, ...game }))
    expect(loadGame().options).toEqual({ promotions: false })
  })

  it('returns null for corrupt JSON', () => {
    localStorage.setItem('whist:game:v1', '{not json')
    expect(loadGame()).toBeNull()
  })

  it('returns null for an unknown schema version', () => {
    localStorage.setItem('whist:game:v1', JSON.stringify({ version: 999, ...sampleGame() }))
    expect(loadGame()).toBeNull()
  })

  it('swallows localStorage failures on read and write', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(loadGame()).toBeNull()
    expect(loadStats()).toEqual({ gamesPlayed: 0, gamesFinished: 0 })
    expect(() => saveGame(sampleGame())).not.toThrow()
    expect(() => saveStats({ gamesPlayed: 1, gamesFinished: 0 })).not.toThrow()
    getItem.mockRestore()
    setItem.mockRestore()
  })

  it('clears the stored game', () => {
    saveGame(sampleGame())
    clearGame()
    expect(loadGame()).toBeNull()
  })
})
