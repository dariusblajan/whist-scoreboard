import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  GAME_VERSION,
  clearGame,
  consumeGameLoadError,
  loadGame,
  loadStats,
  saveGame,
  saveStats,
} from './persistence.js'
import { buildGame, makeConfig } from '../test/utils.jsx'

const sampleGame = () => {
  const game = buildGame(makeConfig({ count: 3, promotions: true }))
  return { ...game, id: 'g1' }
}

describe('persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    consumeGameLoadError()
  })

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

  it('returns null for corrupt JSON and flags a load error', () => {
    localStorage.setItem('whist:game:v1', '{not json')
    expect(loadGame()).toBeNull()
    expect(consumeGameLoadError()).toBe(true)
  })

  it('returns null for an unknown schema version', () => {
    localStorage.setItem('whist:game:v1', JSON.stringify({ version: 999, ...sampleGame() }))
    expect(loadGame()).toBeNull()
  })

  it('rejects a tampered player count / hand sequence and flags a load error', () => {
    const game = sampleGame()
    game.players.push({ id: 'p3', name: 'D', seatIndex: 3 }) // now 4 players, hands still a 3-player sequence
    localStorage.setItem('whist:game:v1', JSON.stringify({ version: GAME_VERSION, ...game }))
    expect(loadGame()).toBeNull()
    expect(consumeGameLoadError()).toBe(true)
  })

  it('rejects an unknown variant', () => {
    const game = sampleGame()
    game.variant = 'medium'
    localStorage.setItem('whist:game:v1', JSON.stringify({ version: GAME_VERSION, ...game }))
    expect(loadGame()).toBeNull()
  })

  it('clamps an out-of-range currentHandIndex', () => {
    const game = sampleGame()
    game.currentHandIndex = 999
    localStorage.setItem('whist:game:v1', JSON.stringify({ version: GAME_VERSION, ...game }))
    expect(loadGame().currentHandIndex).toBe(game.hands.length - 1)
  })

  it('does not flag a load error when nothing is stored', () => {
    expect(loadGame()).toBeNull()
    expect(consumeGameLoadError()).toBe(false)
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
