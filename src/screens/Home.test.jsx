import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildGame, makeConfig, renderApp, seedGame } from '../test/utils.jsx'
import { loadStats } from '../state/persistence.js'

describe('Home', () => {
  it('offers only New game when there is no stored game', () => {
    renderApp({ route: '/' })
    expect(screen.getByRole('link', { name: /new game/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /resume/i })).not.toBeInTheDocument()
  })

  it('shows lifetime counters from persisted stats', () => {
    seedGame(buildGame(makeConfig()), { gamesPlayed: 5, gamesFinished: 2 })
    renderApp({ route: '/' })
    expect(within(screen.getByText('Games played').closest('div')).getByText('5')).toBeInTheDocument()
    expect(within(screen.getByText('Games finished').closest('div')).getByText('2')).toBeInTheDocument()
  })

  it('resumes a mid-game state on the correct hand with prior entries intact', async () => {
    const user = userEvent.setup()
    const game = buildGame(makeConfig())
    game.currentHandIndex = 7
    game.hands[7].entries.p0.bid = 3
    seedGame(game)

    renderApp({ route: '/' })
    await user.click(screen.getByRole('link', { name: /resume/i }))

    expect(screen.getByRole('heading', { name: /Hand 8 \/ 21/ })).toBeInTheDocument()
    const pad = screen.getByRole('group', { name: 'Bid for Player 1' })
    expect(within(pad).getByRole('button', { name: '3' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('guards New game behind a discard confirmation when a game is in progress', async () => {
    const user = userEvent.setup()
    seedGame(buildGame(makeConfig()))
    renderApp({ route: '/' })

    await user.click(screen.getByRole('button', { name: /new game/i }))
    expect(screen.getByRole('dialog')).toHaveTextContent(/discard the game in progress/i)

    // Cancel is a no-op — still on Home, game still resumable.
    await user.click(screen.getByRole('button', { name: /keep playing/i }))
    expect(await screen.findByRole('link', { name: /resume/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /new game/i }))
    await user.click(screen.getByRole('button', { name: /discard and start new/i }))
    expect(screen.getByRole('heading', { name: /new game/i, level: 2 })).toBeInTheDocument()
  })

  it('starting a new game increments gamesPlayed in persisted stats', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/' })
    await user.click(screen.getByRole('link', { name: /new game/i }))
    await user.click(screen.getByRole('button', { name: '3' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Start' }))
    expect(loadStats().gamesPlayed).toBe(1)
  })
})
