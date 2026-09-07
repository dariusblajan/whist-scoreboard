/**
 * Shared data-model typedefs for the rules engine. JSDoc only — no runtime code,
 * so editors get hints without pulling in TypeScript.
 * @module rules/types
 */

/**
 * @typedef {Object} Player
 * @property {string|number} id      Stable identifier used as the key in `Hand.entries`.
 * @property {string} name
 * @property {number} seatIndex      Clockwise seat position, 0-based.
 */

/**
 * @typedef {Object} HandEntry
 * @property {number|null} bid        Tricks bid, or null until entered.
 * @property {number|null} taken      Tricks taken, or null until entered.
 */

/**
 * @typedef {Object} Hand
 * @property {number} index
 * @property {number} cardsDealt
 * @property {number} dealerSeatIndex
 * @property {Array<string|number>} biddingOrder   Player ids, dealer last.
 * @property {'none'|string|null} trump            null = not recorded.
 * @property {Object.<string, HandEntry>} entries  Keyed by player id.
 */

/**
 * @typedef {Object} GameOptions
 * @property {boolean} promotions    Opt-in ±10 streak bonus. Default false.
 */

/**
 * @typedef {Object} Game
 * @property {string} [id]
 * @property {number} [createdAt]
 * @property {Player[]} players
 * @property {'short'|'long'} variant
 * @property {GameOptions} options
 * @property {number} firstDealerSeatIndex
 * @property {Hand[]} hands
 * @property {number} [currentHandIndex]
 * @property {'active'|'complete'} [status]
 */

export {}
