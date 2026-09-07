import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import { ThemeModeProvider } from '../theme/ThemeModeProvider.jsx'
import { AppRoutes } from '../routes.jsx'

/** Render the full routed app at a given entry path, inside all providers. */
export function renderApp({ route = '/' } = {}) {
  return render(
    <ThemeModeProvider>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
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
