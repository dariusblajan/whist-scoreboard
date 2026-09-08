/**
 * Pure reducer, action creators, and initial-state builder for the game store.
 * No React here so this is unit-testable in isolation; `gameStore.jsx` wires it
 * to context and persistence.
 * @module state/gameReducer
 */

import { generateHands } from '../rules/index.js'
import { loadGame, loadStats } from './persistence.js'

/**
 * @typedef {Object} StoreState
 * @property {import('../rules/types.js').Game | null} game
 * @property {{ gamesPlayed: number, gamesFinished: number }} stats
 */

/** Build the initial store state from whatever is persisted. */
export function createInitialState() {
  return { game: loadGame(), stats: loadStats() }
}

/** Replace one hand in `game.hands` by index, returning a new game object. */
function patchHand(game, handIndex, patch) {
  return {
    ...game,
    hands: game.hands.map((hand) => (hand.index === handIndex ? { ...hand, ...patch } : hand)),
  }
}

/** Replace one player's entry in a hand, returning a new game object. */
function patchEntry(game, handIndex, playerId, patch) {
  const hand = game.hands[handIndex]
  return patchHand(game, handIndex, {
    entries: {
      ...hand.entries,
      [playerId]: { ...hand.entries[playerId], ...patch },
    },
  })
}

/**
 * @param {StoreState} state
 * @param {{ type: string } & Record<string, unknown>} action
 * @returns {StoreState}
 */
export function gameReducer(state, action) {
  switch (action.type) {
    case 'newGame': {
      const { players, variant, firstDealerSeatIndex, promotions = false } = action.config
      const game = {
        id: `g${Date.now()}`,
        createdAt: Date.now(),
        players,
        variant,
        options: { promotions: Boolean(promotions) },
        firstDealerSeatIndex,
        hands: generateHands(players, variant, firstDealerSeatIndex),
        currentHandIndex: 0,
        status: 'active',
      }
      return { game, stats: { ...state.stats, gamesPlayed: state.stats.gamesPlayed + 1 } }
    }

    case 'setBid': {
      if (!state.game) return state
      return {
        ...state,
        game: patchEntry(state.game, action.handIndex, action.playerId, { bid: action.bid }),
      }
    }

    case 'setTaken': {
      if (!state.game) return state
      return {
        ...state,
        game: patchEntry(state.game, action.handIndex, action.playerId, { taken: action.taken }),
      }
    }

    case 'setTrump': {
      if (!state.game) return state
      return { ...state, game: patchHand(state.game, action.handIndex, { trump: action.suit }) }
    }

    case 'commitHand': {
      if (!state.game) return state
      const hand = state.game.hands[action.handIndex]
      if (!hand || hand.trump != null || hand.cardsDealt !== 8) return state
      // 8-card hands are always no-trump; record it so the stored hand is complete.
      return { ...state, game: patchHand(state.game, action.handIndex, { trump: 'none' }) }
    }

    case 'goToHand': {
      if (!state.game) return state
      const last = state.game.hands.length - 1
      const index = Math.max(0, Math.min(last, action.index))
      return { ...state, game: { ...state.game, currentHandIndex: index } }
    }

    case 'finishGame': {
      if (!state.game || state.game.status === 'complete') return state
      return {
        game: { ...state.game, status: 'complete' },
        stats: { ...state.stats, gamesFinished: state.stats.gamesFinished + 1 },
      }
    }

    case 'endGameEarly': {
      if (!state.game || state.game.status === 'complete') return state
      return { ...state, game: { ...state.game, status: 'complete' } }
    }

    case 'discardGame': {
      return { ...state, game: null }
    }

    default:
      return state
  }
}

/** Plain action creators — shared by the bound dispatchers and unit tests. */
export const actions = {
  newGame: (config) => ({ type: 'newGame', config }),
  setBid: (handIndex, playerId, bid) => ({ type: 'setBid', handIndex, playerId, bid }),
  setTaken: (handIndex, playerId, taken) => ({ type: 'setTaken', handIndex, playerId, taken }),
  setTrump: (handIndex, suit) => ({ type: 'setTrump', handIndex, suit }),
  commitHand: (handIndex) => ({ type: 'commitHand', handIndex }),
  goToHand: (index) => ({ type: 'goToHand', index }),
  finishGame: () => ({ type: 'finishGame' }),
  endGameEarly: () => ({ type: 'endGameEarly' }),
  discardGame: () => ({ type: 'discardGame' }),
}
