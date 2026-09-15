import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { buildGame, makeConfig, renderApp, seedGame } from '../../test/utils.jsx'
import { saveLocale } from '../../i18n/localePersistence.js'

describe('PrintScoreboard', () => {
  it('renders a filled sheet from the active game, with no app chrome', () => {
    const game = buildGame(makeConfig({ count: 4 }))
    seedGame(game)
    renderApp({ route: '/print' })

    const table = screen.getByRole('table', { name: 'Score sheet' })
    // 3 fixed columns (hand, cards, dealer) + a bid/score pair per player,
    // spelled out as separate cells on the second header row.
    expect(table.querySelectorAll('thead tr')[1].children).toHaveLength(3 + 4 * 2)
    expect(table.querySelector('thead')).toBeTruthy()
    expect(screen.queryByRole('banner')).not.toBeInTheDocument() // AppBar
    expect(screen.queryByText('Whist Scoreboard')).not.toBeInTheDocument()
  })

  it('renders a blank sheet from query params with no game in the store', () => {
    renderApp({ route: '/print?players=5&variant=long&promotions=1' })

    const table = screen.getByRole('table', { name: 'Score sheet' })
    expect(table.querySelectorAll('tbody tr')).toHaveLength(3 * 5 + 12)
    expect(screen.getByText(/Long variant/)).toBeInTheDocument()
    expect(screen.getByText(/5 players/)).toBeInTheDocument()
    expect(screen.getByText(/Promotions on/)).toBeInTheDocument()
    // Blank sheet: no totals row, no scores filled in.
    expect(screen.queryByText('Total')).not.toBeInTheDocument()
  })

  it('redirects home with neither an active game nor valid query params', () => {
    renderApp({ route: '/print' })
    expect(screen.getByRole('link', { name: 'New game' })).toBeInTheDocument()
  })

  it('redirects home when the query params are invalid', () => {
    renderApp({ route: '/print?players=9&variant=short' })
    expect(screen.getByRole('link', { name: 'New game' })).toBeInTheDocument()
  })

  it('a valid query string wins over a stale game left in the store (NewGame blank-sheet leak)', () => {
    // A finished game sitting in the store (e.g. Home's "New game" not yet
    // clicked) must never leak into the wizard's blank-sheet preview.
    const finished = buildGame(makeConfig({ count: 4 }))
    finished.status = 'complete'
    for (const hand of finished.hands) {
      for (const p of finished.players) hand.entries[p.id] = { bid: 0, taken: hand.cardsDealt / 4 || 0 }
    }
    seedGame(finished)

    renderApp({ route: '/print?players=3&variant=short&promotions=0' })

    expect(screen.getByText(/3 players/)).toBeInTheDocument()
    expect(screen.getByText(/Short variant/)).toBeInTheDocument()
    const table = screen.getByRole('table', { name: 'Score sheet' })
    expect(table.querySelectorAll('tbody tr')).toHaveLength(3 * 3 + 12)
    expect(screen.queryByText('Total')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Final standings' })).not.toBeInTheDocument()
  })

  it('localizes the blank sheet\'s placeholder player names, not just its chrome', () => {
    saveLocale('ro')
    renderApp({ route: '/print?players=3&variant=short&promotions=0' })

    const headerRow = screen.getByRole('table', { name: 'Fișă de scor' }).querySelectorAll('thead tr')[0]
    expect(headerRow).toHaveTextContent('Jucătorul 1')
    expect(headerRow).toHaveTextContent('Jucătorul 3')
    expect(screen.queryByText('Player 1')).not.toBeInTheDocument()
  })
})
