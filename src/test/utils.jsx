import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import { ThemeModeProvider } from '../theme/ThemeModeProvider.jsx'
import { GameStoreProvider } from '../state/gameStore.jsx'
import { actions, gameReducer } from '../state/gameReducer.js'
import { saveGame, saveStats } from '../state/persistence.js'
import { AppRoutes } from '../routes.jsx'

const NO_STATS = { gamesPlayed: 0, gamesFinished: 0 }

/** Build a `Game` object straight from the reducer's `newGame` path. */
export function buildGame(config) {
  return gameReducer({ game: null, stats: NO_STATS }, actions.newGame(config)).game
}

/** Persist a game (and optional stats) so a fresh render resumes from it. */
export function seedGame(game, stats = { gamesPlayed: 1, gamesFinished: 0 }) {
  saveGame(game)
  saveStats(stats)
}

/** A minimal N-player config for `buildGame`. */
export function makeConfig({ count = 3, ...over } = {}) {
  return {
    players: Array.from({ length: count }, (_, i) => ({
      id: `p${i}`,
      name: `Player ${i + 1}`,
      seatIndex: i,
    })),
    variant: 'short',
    firstDealerSeatIndex: 0,
    promotions: false,
    ...over,
  }
}

/** Render the full routed app at a given entry path, inside all providers. */
export function renderApp({ route = '/' } = {}) {
  return render(
    <ThemeModeProvider>
      <GameStoreProvider>
        <MemoryRouter initialEntries={[route]}>
          <AppRoutes />
        </MemoryRouter>
      </GameStoreProvider>
    </ThemeModeProvider>,
  )
}

/**
 * Stub window.matchMedia so tests can pin the OS colour-scheme preference.
 * Call before rendering. Returns nothing; setup.js restores the default stub
 * isn't automatic, so pass the value you need per test.
 */
export function mockPrefersColorScheme(prefersDark) {
  window.matchMedia = (query) => ({
    matches: query.includes('dark') ? prefersDark : !prefersDark,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })
}
