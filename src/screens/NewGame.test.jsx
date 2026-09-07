import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../test/utils.jsx'
import { loadGame } from '../state/persistence.js'

async function stepThrough(user, { count, variant, promotions, rename } = {}) {
  // Step 1 — player count
  if (count) await user.click(screen.getByRole('button', { name: String(count) }))
  await user.click(screen.getByRole('button', { name: 'Next' }))

  // Step 2 — variant + promotions
  if (variant) await user.click(screen.getByRole('button', { name: new RegExp(variant, 'i') }))
  if (promotions) await user.click(screen.getByRole('switch'))
  await user.click(screen.getByRole('button', { name: 'Next' }))

  // Step 3 — names
  if (rename) {
    const field = screen.getByLabelText('Player 1')
    await user.clear(field)
    await user.type(field, rename)
  }
  await user.click(screen.getByRole('button', { name: 'Next' }))

  // Step 4 — seating
}

describe('NewGame wizard', () => {
  it('creates a 24-hand long game with the entered name', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/new' })
    await stepThrough(user, { count: 4, variant: 'long', rename: 'Alice' })
    await user.click(screen.getByRole('button', { name: 'Start' }))

    const game = loadGame()
    expect(game.variant).toBe('long')
    expect(game.hands).toHaveLength(24)
    expect(game.players.map((p) => p.name)).toContain('Alice')
  })

  it('defaults promotions OFF and stores the toggle state', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/new' })

    await user.click(screen.getByRole('button', { name: '3' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('switch')).not.toBeChecked()
    expect(
      screen.getByText(/hands in a row you make \/ miss/i),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Start' }))

    expect(loadGame().options.promotions).toBe(false)
  })

  it('turning promotions on stores it as true', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/new' })
    await stepThrough(user, { count: 3, promotions: true })
    await user.click(screen.getByRole('button', { name: 'Start' }))
    expect(loadGame().options.promotions).toBe(true)
  })

  it('has no keyboard-raising control outside the Names step', async () => {
    const user = userEvent.setup()
    const { container } = renderApp({ route: '/new' })
    const banned = 'input[type="text"], input[type="number"], [contenteditable="true"]'

    expect(container.querySelector(banned)).toBeNull() // step 1
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(container.querySelector(banned)).toBeNull() // step 2
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(container.querySelectorAll(banned).length).toBeGreaterThan(0) // step 3: names
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(container.querySelector(banned)).toBeNull() // step 4
  })

  it('randomize keeps the same set of seats', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/new' })
    await user.click(screen.getByRole('button', { name: '4' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Randomize' }))
    await user.click(screen.getByRole('button', { name: 'Start' }))
    expect(loadGame().players.map((p) => p.seatIndex).sort()).toEqual([0, 1, 2, 3])
  })
})
