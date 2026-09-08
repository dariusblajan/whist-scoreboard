import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { buildGame, makeConfig, renderApp, seedGame } from './utils.jsx'

/** axe on a container, scoped to the rules we can meaningfully check in jsdom. */
async function noViolations(container) {
  const results = await axe(container)
  expect(results).toHaveNoViolations()
}

describe('accessibility (axe)', () => {
  it('Home — first run', async () => {
    const { container } = renderApp({ route: '/' })
    await noViolations(container)
  })

  it('Home — with an active game', async () => {
    seedGame(buildGame(makeConfig()))
    const { container } = renderApp({ route: '/' })
    await noViolations(container)
  })

  it('NewGame — every step', async () => {
    const user = userEvent.setup()
    const { container } = renderApp({ route: '/new' })
    await noViolations(container)
    for (let stepPastFirst = 0; stepPastFirst < 3; stepPastFirst += 1) {
      await user.click(screen.getByRole('button', { name: /next/i }))
      await noViolations(container)
    }
  })

  it('HandPlay — bid and result steps', async () => {
    const user = userEvent.setup()
    const game = buildGame(makeConfig())
    game.currentHandIndex = 7
    seedGame(game)
    const { container } = renderApp({ route: '/play' })
    await noViolations(container)

    for (const name of ['Player 3', 'Player 1', 'Player 2']) {
      const pad = screen.getByRole('group', { name: `Bid for ${name}` })
      await user.click(within(pad).getByRole('button', { name: '0' }))
    }
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await noViolations(container)
  })

  it('Scoreboard', async () => {
    seedGame(buildGame(makeConfig({ count: 6 })))
    const { container } = renderApp({ route: '/scoreboard' })
    await noViolations(container)
  })

  it('GameOver', async () => {
    const game = buildGame(makeConfig())
    game.status = 'complete'
    for (const hand of game.hands) {
      for (const p of game.players) hand.entries[p.id] = { bid: 0, taken: 0 }
      hand.entries.p0.taken = hand.cardsDealt
      hand.trump = 'none'
    }
    seedGame(game, { gamesPlayed: 1, gamesFinished: 1 })
    const { container } = renderApp({ route: '/over' })
    await noViolations(container)
  })
})
