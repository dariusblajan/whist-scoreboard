import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { buildGame, makeConfig, renderApp, seedGame } from './utils.jsx'

describe('route guards', () => {
  it('redirects /play to Home when there is no active game', () => {
    renderApp({ route: '/play' })
    expect(screen.getByRole('heading', { level: 2, name: /whist scoreboard/i })).toBeInTheDocument()
  })

  it('redirects /scoreboard to Home when there is no game', () => {
    renderApp({ route: '/scoreboard' })
    expect(screen.getByRole('heading', { level: 2, name: /whist scoreboard/i })).toBeInTheDocument()
  })

  it('redirects /over to Home when there is no game', () => {
    renderApp({ route: '/over' })
    expect(screen.getByRole('heading', { level: 2, name: /whist scoreboard/i })).toBeInTheDocument()
  })

  it('sends /play to Game over once the game is complete', () => {
    const game = buildGame(makeConfig())
    game.status = 'complete'
    seedGame(game)
    renderApp({ route: '/play' })
    expect(screen.getByRole('heading', { name: /game over/i })).toBeInTheDocument()
  })
})

describe('corrupt persisted state', () => {
  it('boots to Home with a toast and a clean slate', async () => {
    localStorage.setItem('whist:game:v1', '{ not valid json')
    renderApp({ route: '/play' })

    expect(screen.getByRole('heading', { level: 2, name: /whist scoreboard/i })).toBeInTheDocument()
    expect(await screen.findByText(/couldn't restore the last game/i)).toBeInTheDocument()
  })

  it('discards a tampered player count', () => {
    const game = buildGame(makeConfig({ count: 3 }))
    game.players.push({ id: 'p3', name: 'X', seatIndex: 3 })
    localStorage.setItem('whist:game:v1', JSON.stringify({ ...game, version: 1 }))
    renderApp({ route: '/' })
    expect(screen.queryByRole('link', { name: /resume/i })).not.toBeInTheDocument()
  })
})

describe('first-run Home', () => {
  it('shows friendly copy and no counters', () => {
    renderApp({ route: '/' })
    expect(screen.getByText(/no games yet/i)).toBeInTheDocument()
    expect(screen.queryByText('Games played')).not.toBeInTheDocument()
  })
})

describe('responsive layout at 320px', () => {
  function pin320() {
    // jsdom reports 0 for layout widths; pin a deterministic viewport so the
    // scrollWidth/clientWidth comparison is meaningful.
    Object.defineProperty(document.documentElement, 'clientWidth', { value: 320, configurable: true })
  }

  it('Scoreboard for 6 players keeps its scroll inside the table wrapper', () => {
    pin320()
    seedGame(buildGame(makeConfig({ count: 6 })))
    const { container } = renderApp({ route: '/scoreboard' })
    // The table itself may be wide, but it lives in an overflow-x container.
    const scroller = container.querySelector('[class*="MuiBox-root"]')
    expect(scroller).toBeTruthy()
    // body must not be the thing that scrolls
    expect(document.body.scrollWidth).toBeLessThanOrEqual(
      Math.max(document.body.clientWidth, 320),
    )
  })

  it('8-card bid pad wraps rather than overflowing the row', () => {
    pin320()
    const game = buildGame(makeConfig())
    const eightCard = game.hands.findIndex((h) => h.cardsDealt === 8)
    game.currentHandIndex = eightCard
    seedGame(game)
    renderApp({ route: '/play' })
    const pads = screen.getAllByRole('group', { name: /^Bid for / })
    expect(pads.length).toBeGreaterThan(0)
    for (const pad of pads) {
      // 0..8 → nine buttons present, all reachable
      expect(within(pad).getAllByRole('button')).toHaveLength(9)
    }
  })
})
