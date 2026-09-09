/**
 * localStorage persistence for the single active game and the two lifetime
 * counters. Every read is defensive: missing, corrupt, or wrong-version data
 * yields sane defaults rather than throwing.
 * @module state/persistence
 */

import { cardsDealtSequence } from '../rules/index.js'

const GAME_KEY = 'whist:game:v1'
const STATS_KEY = 'whist:stats:v1'

/** Bump when the stored `Game` shape changes incompatibly. */
export const GAME_VERSION = 1

const DEFAULT_STATS = { gamesPlayed: 0, gamesFinished: 0 }
const DEFAULT_OPTIONS = { promotions: false }

// Set when the last `loadGame()` found data it could not restore (unparseable,
// wrong shape, or tampered player count / variant). The UI reads it once via
// `consumeGameLoadError()` to show a "couldn't restore" toast.
let gameLoadError = false

/** Read and clear the "last load failed" flag. */
export function consumeGameLoadError() {
  const had = gameLoadError
  gameLoadError = false
  return had
}

/**
 * Structural re-validation of a restored game. Guards against hand-edited
 * localStorage: player count, variant, and the hand sequence must all agree.
 * @param {any} game
 */
function isRestorableGame(game) {
  if (!game || typeof game !== 'object') return false
  if (!Array.isArray(game.players) || game.players.length < 3 || game.players.length > 6) return false
  if (game.variant !== 'short' && game.variant !== 'long') return false
  if (!game.players.every((p) => p && typeof p.id === 'string' && Number.isInteger(p.seatIndex))) {
    return false
  }
  if (!Array.isArray(game.hands) || game.hands.length === 0) return false
  const expected = cardsDealtSequence(game.players.length, game.variant)
  if (game.hands.length !== expected.length) return false
  return game.hands.every(
    (hand, i) =>
      hand &&
      hand.cardsDealt === expected[i] &&
      hand.entries &&
      typeof hand.entries === 'object' &&
      Array.isArray(hand.biddingOrder),
  )
}

/**
 * Load the stored game, or `null` when there is none, it cannot be parsed, its
 * schema version is not recognised, or it fails re-validation. A game stored
 * without `options` is upgraded in-memory to `{ promotions: false }`. When the
 * data existed but could not be restored, `consumeGameLoadError()` returns true.
 * @returns {import('../rules/types.js').Game | null}
 */
export function loadGame() {
  let raw
  try {
    raw = localStorage.getItem(GAME_KEY)
  } catch {
    return null
  }
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.version !== GAME_VERSION) {
      gameLoadError = true
      return null
    }
    const { version, ...game } = parsed
    void version
    const restored = { ...game, options: { ...DEFAULT_OPTIONS, ...game.options } }
    if (!isRestorableGame(restored)) {
      gameLoadError = true
      return null
    }
    const lastHand = restored.hands.length - 1
    const current = Number.isInteger(restored.currentHandIndex) ? restored.currentHandIndex : 0
    restored.currentHandIndex = Math.min(Math.max(0, current), lastHand)
    return restored
  } catch {
    gameLoadError = true
    return null
  }
}

/**
 * Persist the game, stamping the current schema version. Storage failures
 * (private mode, quota, disabled storage) are swallowed.
 * @param {import('../rules/types.js').Game} game
 */
export function saveGame(game) {
  try {
    localStorage.setItem(GAME_KEY, JSON.stringify({ ...game, version: GAME_VERSION }))
  } catch {
    // no-op
  }
}

/** Remove the stored game. Failures are swallowed. */
export function clearGame() {
  try {
    localStorage.removeItem(GAME_KEY)
  } catch {
    // no-op
  }
}

/**
 * Load the lifetime counters, defaulting each missing field to 0.
 * @returns {{ gamesPlayed: number, gamesFinished: number }}
 */
export function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (!raw) return { ...DEFAULT_STATS }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_STATS }
    return {
      gamesPlayed: Number.isFinite(parsed.gamesPlayed) ? parsed.gamesPlayed : 0,
      gamesFinished: Number.isFinite(parsed.gamesFinished) ? parsed.gamesFinished : 0,
    }
  } catch {
    return { ...DEFAULT_STATS }
  }
}

/**
 * Persist the lifetime counters. Failures are swallowed.
 * @param {{ gamesPlayed: number, gamesFinished: number }} stats
 */
export function saveStats(stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  } catch {
    // no-op
  }
}
