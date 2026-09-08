import { useContext, useMemo } from 'react'
import { GameStoreContext } from './gameStoreContext.js'
import { actions } from './gameReducer.js'

/**
 * Access the store: `{ game, stats }` plus one bound dispatcher per action
 * creator (`newGame`, `setBid`, `goToHand`, …).
 * @returns {{ game: import('../rules/types.js').Game | null,
 *   stats: { gamesPlayed: number, gamesFinished: number } } & Record<string, Function>}
 */
export function useGameStore() {
  const ctx = useContext(GameStoreContext)
  if (!ctx) throw new Error('useGameStore must be used within a GameStoreProvider')
  const { state, dispatch } = ctx

  const bound = useMemo(() => {
    const out = {}
    for (const [name, creator] of Object.entries(actions)) {
      out[name] = (...args) => dispatch(creator(...args))
    }
    return out
  }, [dispatch])

  return { game: state.game, stats: state.stats, ...bound }
}
