/**
 * localStorage persistence for the single active game and the two lifetime
 * counters. Every read is defensive: missing, corrupt, or wrong-version data
 * yields sane defaults rather than throwing.
 * @module state/persistence
 */

const GAME_KEY = 'whist:game:v1'
const STATS_KEY = 'whist:stats:v1'

/** Bump when the stored `Game` shape changes incompatibly. */
export const GAME_VERSION = 1

const DEFAULT_STATS = { gamesPlayed: 0, gamesFinished: 0 }
const DEFAULT_OPTIONS = { promotions: false }

/**
 * Load the stored game, or `null` when there is none, it cannot be parsed, or
 * its schema version is not recognised. A game stored without `options` is
 * upgraded in-memory to `{ promotions: false }`.
 * @returns {import('../rules/types.js').Game | null}
 */
export function loadGame() {
  try {
    const raw = localStorage.getItem(GAME_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.version !== GAME_VERSION) return null
    const { version, ...game } = parsed
    void version
    return { ...game, options: { ...DEFAULT_OPTIONS, ...game.options } }
  } catch {
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
