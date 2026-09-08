import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildGame, renderApp, seedGame } from '../test/utils.jsx'

/** The worked example from docs/game-rules.md: Peter / John / Peggy, first 5 hands. */
const EXAMPLE = {
  players: [
    { id: 'peter', name: 'Peter', seatIndex: 0 },
    { id: 'john', name: 'John', seatIndex: 1 },
    { id: 'peggy', name: 'Peggy', seatIndex: 2 },
  ],
  variant: 'short',
  firstDealerSeatIndex: 0,
  promotions: false,
}

const HANDS = [
  { peter: [1, 1], john: [0, 0], peggy: [0, 1] },
  { peter: [0, 0], john: [0, 0], peggy: [0, 1] },
  { peter: [1, 0], john: [1, 1], peggy: [0, 0] },
  { peter: [0, 0], john: [2, 0], peggy: [2, 2] },
  { peter: [1, 2], john: [0, 0], peggy: [1, 1] },
]

function seedExample() {
  const game = buildGame(EXAMPLE)
  HANDS.forEach((entries, i) => {
    for (const [id, [bid, taken]] of Object.entries(entries)) {
      game.hands[i].entries[id] = { bid, taken }
    }
  })
  game.currentHandIndex = 5
  seedGame(game)
  return game
}

const cells = (row) => within(row).getAllByRole('cell')

describe('Scoreboard', () => {
  it('renders the documented cumulative numbers', () => {
    seedExample()
    renderApp({ route: '/scoreboard' })

    // row layout: [cards, peterBid, peterScore, johnBid, johnScore, peggyBid, peggyScore]
    const expected = {
      0: [6, 5, -1],
      1: [11, 10, -2],
      2: [10, 16, 3],
      3: [15, 14, 10],
      4: [14, 19, 16],
    }
    for (const [i, [p, j, pg]] of Object.entries(expected)) {
      const c = cells(screen.getByTestId(`hand-row-${i}`))
      expect(c[2]).toHaveTextContent(String(p))
      expect(c[4]).toHaveTextContent(String(j))
      expect(c[6]).toHaveTextContent(String(pg))
    }
  })

  it('leaves not-yet-played hands blank', () => {
    seedExample()
    renderApp({ route: '/scoreboard' })
    const c = cells(screen.getByTestId('hand-row-6'))
    expect(c[2]).toHaveTextContent('')
    expect(c[1]).toHaveTextContent('')
  })

  it('highlights the current leader and updates after an edit', () => {
    seedExample()
    renderApp({ route: '/scoreboard' })
    // John leads on 19.
    expect(screen.getByRole('columnheader', { name: /John ★/ })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: /Peter ★/ })).not.toBeInTheDocument()
  })

  it('has a horizontal-scroll container and a sticky header', () => {
    seedExample()
    renderApp({ route: '/scoreboard' })
    const table = screen.getByRole('table', { name: 'Scoreboard' })
    expect(table.parentElement).toHaveStyle({ overflowX: 'auto' })
    expect(screen.getByRole('table', { name: 'Scoreboard' }).querySelector('thead')).toBeTruthy()
    // footer total row
    expect(screen.getByRole('cell', { name: 'Total' })).toBeInTheDocument()
  })

  it('clicking a completed hand row opens that hand in the editor', async () => {
    const user = userEvent.setup()
    seedExample()
    renderApp({ route: '/scoreboard' })

    await user.click(screen.getByTestId('hand-row-2'))
    expect(screen.getByRole('heading', { name: /Hand 3 \// })).toBeInTheDocument()
  })

  it('shows no promotion badges when promotions are off', () => {
    seedExample()
    renderApp({ route: '/scoreboard' })
    expect(screen.queryByText('+10')).not.toBeInTheDocument()
    expect(screen.queryByText('−10')).not.toBeInTheDocument()
  })
})
