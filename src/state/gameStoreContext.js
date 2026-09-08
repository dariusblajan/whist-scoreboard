import { createContext } from 'react'

/**
 * @typedef {Object} GameStoreValue
 * @property {import('./gameReducer.js').StoreState} state
 * @property {import('react').Dispatch<object>} dispatch
 */

/** @type {import('react').Context<GameStoreValue | null>} */
export const GameStoreContext = createContext(null)
