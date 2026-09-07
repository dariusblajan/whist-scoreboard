/**
 * The single source of truth for the active game and lifetime counters: a
 * `useReducer` store behind React context, with every state change mirrored to
 * `localStorage` by one effect.
 * @module state/gameStore
 */

import { useEffect, useMemo, useReducer } from 'react'
import { GameStoreContext } from './gameStoreContext.js'
import { createInitialState, gameReducer } from './gameReducer.js'
import { clearGame, saveGame, saveStats } from './persistence.js'

export function GameStoreProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)

  useEffect(() => {
    if (state.game) saveGame(state.game)
    else clearGame()
  }, [state.game])

  useEffect(() => {
    saveStats(state.stats)
  }, [state.stats])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <GameStoreContext.Provider value={value}>{children}</GameStoreContext.Provider>
}
