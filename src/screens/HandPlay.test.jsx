import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildGame, makeConfig, renderApp, seedGame } from '../test/utils.jsx'
import { loadStats } from '../state/persistence.js'

/** Short 3-player sequence: 1,1,1,2,3,4,5,6,7,8,8,7,6,5,4,3,2,1,1,1 — index 7 is a 6-card hand. */
function seedAtSixCardHand(over) {
  const game = buildGame(makeConfig(over))
  game.currentHandIndex = 7
  expect(game.hands[7].cardsDealt).toBe(6)
  seedGame(game)
  return game
}

describe('HandPlay — bid step', () => {
  it('forbids the dealer the bid that would make totals equal, then enables Next', async () => {
    const user = userEvent.setup()
    seedAtSixCardHand()
    renderApp({ route: '/play' })

    // Bidding order for this hand is Player 3, Player 1, Player 2 (dealer last).
    const nonDealer1 = screen.getByRole('group', { name: 'Bid for Player 3' })
    await user.click(within(nonDealer1).getByRole('button', { name: '3' }))
    const nonDealer2 = screen.getByRole('group', { name: 'Bid for Player 1' })
    await user.click(within(nonDealer2).getByRole('button', { name: '1' }))

    const dealerPad = screen.getByRole('group', { name: 'Bid for Player 2' })
    expect(within(dealerPad).getByRole('button', { name: '2' })).toBeDisabled()
    expect(screen.getByText('Bids sum to 6 — not allowed')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    await user.click(within(dealerPad).getByRole('button', { name: '0' }))
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
  })

  it('autofocuses the first bidder and moves focus to the next bidder on tap', async () => {
    const user = userEvent.setup()
    seedAtSixCardHand()
    renderApp({ route: '/play' })

    const firstPad = screen.getByRole('group', { name: 'Bid for Player 3' })
    expect(within(firstPad).getByRole('button', { name: '0' })).toHaveFocus()

    await user.click(within(firstPad).getByRole('button', { name: '2' }))
    const secondPad = screen.getByRole('group', { name: 'Bid for Player 1' })
    expect(within(secondPad).getByRole('button', { name: '0' })).toHaveFocus()
  })
})

describe('HandPlay — result step', () => {
  async function reachResultStep(user) {
    const order = ['Player 3', 'Player 1', 'Player 2']
    for (const name of order) {
      const pad = screen.getByRole('group', { name: `Bid for ${name}` })
      await user.click(within(pad).getByRole('button', { name: '0' }))
    }
    await user.click(screen.getByRole('button', { name: 'Next' }))
  }

  it('blocks Next until tricks taken sum to the cards dealt, then shows the summary', async () => {
    const user = userEvent.setup()
    seedAtSixCardHand()
    renderApp({ route: '/play' })
    await reachResultStep(user)

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    const plusForP1 = screen.getByRole('button', { name: 'One more trick for Player 1' })
    for (let i = 0; i < 6; i += 1) await user.click(plusForP1)
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    // Player 1 bid 0, took 6 → -6; summary reflects it.
    expect(screen.getByText(/Bid 0, took 6/)).toBeInTheDocument()
    expect(screen.getByText(/-6 points/)).toBeInTheDocument()
  })
})

describe('HandPlay — finishing', () => {
  it('committing the last hand finishes the game and increments gamesFinished', async () => {
    const user = userEvent.setup()
    const game = buildGame(makeConfig())
    const last = game.hands.length - 1
    game.currentHandIndex = last
    seedGame(game, { gamesPlayed: 1, gamesFinished: 0 })
    renderApp({ route: '/play' })

    // 1-card hand, bidding order Player 1, Player 2, Player 3 (dealer).
    for (const name of ['Player 1', 'Player 2', 'Player 3']) {
      const pad = screen.getByRole('group', { name: `Bid for ${name}` })
      await user.click(within(pad).getByRole('button', { name: '0' }))
    }
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'One more trick for Player 1' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Finish game' }))

    expect(screen.getByRole('heading', { name: /game over/i })).toBeInTheDocument()
    expect(loadStats().gamesFinished).toBe(1)
  })

  it('ending early goes to Game over without counting as finished', async () => {
    const user = userEvent.setup()
    seedAtSixCardHand()
    renderApp({ route: '/play' })

    await user.click(screen.getByRole('button', { name: /end game early/i }))
    await user.click(screen.getByRole('button', { name: 'End game' }))

    expect(screen.getByRole('heading', { name: /game over/i })).toBeInTheDocument()
    expect(loadStats().gamesFinished).toBe(0)
  })
})

describe('HandPlay — input ergonomics', () => {
  it('renders no keyboard-raising control on either step', async () => {
    const user = userEvent.setup()
    seedAtSixCardHand()
    const { container } = renderApp({ route: '/play' })

    const banned = 'input[type="text"], input[type="number"], [contenteditable="true"]'
    expect(container.querySelector(banned)).toBeNull()

    const order = ['Player 3', 'Player 1', 'Player 2']
    for (const name of order) {
      const pad = screen.getByRole('group', { name: `Bid for ${name}` })
      await user.click(within(pad).getByRole('button', { name: '0' }))
    }
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(container.querySelector(banned)).toBeNull()
  })
})
