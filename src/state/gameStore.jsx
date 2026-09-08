/**
 * The single source of truth for the active game and lifetime counters: a
 * `useReducer` store behind React context, with every state change mirrored to
 * `localStorage` by one effect.
 * @module state/gameStore
 */

import { useEffect, useMemo, useReducer, useState } from 'react'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { GameStoreContext } from './gameStoreContext.js'
import { createInitialState, gameReducer } from './gameReducer.js'
import { clearGame, consumeGameLoadError, saveGame, saveStats } from './persistence.js'

export function GameStoreProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)
  // `createInitialState` has already run `loadGame`, so this reads the result.
  const [loadError, setLoadError] = useState(consumeGameLoadError)

  useEffect(() => {
    if (state.game) saveGame(state.game)
    else clearGame()
  }, [state.game])

  useEffect(() => {
    saveStats(state.stats)
  }, [state.stats])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return (
    <GameStoreContext.Provider value={value}>
      {children}
      <Snackbar
        open={loadError}
        autoHideDuration={6000}
        onClose={() => setLoadError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="warning" variant="filled" onClose={() => setLoadError(false)}>
          Couldn&apos;t restore the last game — starting fresh.
        </Alert>
      </Snackbar>
    </GameStoreContext.Provider>
  )
}
