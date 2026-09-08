import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildGame, makeConfig, renderApp, seedGame } from '../test/utils.jsx'
import { loadStats } from '../state/persistence.js'

function seedFinished(entriesByHand, over) {
  const game = buildGame(makeConfig(over))
  entriesByHand.forEach((entries, i) => {
    for (const [id, [bid, taken]] of Object.entries(entries)) {
      game.hands[i].entries[id] = { bid, taken }
    }
  })
  game.status = 'complete'
  seedGame(game, { gamesPlayed: 1, gamesFinished: 1 })
  return game
}

describe('GameOver', () => {
  it('renders shared ranks when players tie', () => {
    // p0 and p1 both make their 1-card bid (+6); p2 misses (-1).
    seedFinished([{ p0: [1, 1], p1: [1, 1], p2: [0, 1] }])
    renderApp({ route: '/over' })

    const tied = screen.getAllByText(/1st \(tie\)/)
    expect(tied).toHaveLength(2)
    expect(screen.getByText(/3rd/)).toBeInTheDocument()
  })

  it('shows made / over / under tallies', () => {
    seedFinished([
      { p0: [1, 1], p1: [0, 1], p2: [1, 0] },
      { p0: [1, 1], p1: [0, 1], p2: [1, 0] },
    ])
    renderApp({ route: '/over' })
    expect(screen.getByText(/2 made · 0 over · 0 under/)).toBeInTheDocument()
    expect(screen.getByText(/0 made · 2 over · 0 under/)).toBeInTheDocument()
    expect(screen.getByText(/0 made · 0 over · 2 under/)).toBeInTheDocument()
  })

  it('does not change persisted gamesFinished when visited or re-entered', async () => {
    const user = userEvent.setup()
    seedFinished([{ p0: [1, 1], p1: [0, 0], p2: [0, 0] }])

    const { unmount } = renderApp({ route: '/over' })
    expect(loadStats().gamesFinished).toBe(1)
    await user.click(screen.getByRole('button', { name: 'Home' }))
    expect(loadStats().gamesFinished).toBe(1)
    unmount()

    renderApp({ route: '/over' })
    expect(loadStats().gamesFinished).toBe(1)
  })
})
