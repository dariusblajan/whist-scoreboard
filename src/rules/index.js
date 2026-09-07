/**
 * Public surface of the framework-free Romanian-whist rules engine.
 * @module rules
 */

export {
  cardsDealtSequence,
  dealerForHand,
  biddingOrder,
  trumpStatus,
  generateHands,
} from './hands.js'
export {
  forbiddenDealerBid,
  handPoints,
  validateTakenTotals,
  validateBid,
} from './scoring.js'
export { promotionBonuses, promotionTotal } from './promotions.js'
export { handResults, cumulativeTotals, standings } from './standings.js'
