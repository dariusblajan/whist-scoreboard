import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../test/utils.jsx'

describe('AppLayout — top bar', () => {
  it('places the language switcher left of the theme toggle, inside the banner', () => {
    renderApp({ route: '/' })
    const banner = screen.getByRole('banner')
    const buttons = within(banner).getAllByRole('button')
    const names = buttons.map((b) => b.getAttribute('aria-label'))

    const languageIndex = names.findIndex((n) => n?.startsWith('Language:'))
    const themeIndex = names.findIndex((n) => n?.startsWith('Theme:'))
    expect(languageIndex).toBeGreaterThanOrEqual(0)
    expect(themeIndex).toBeGreaterThan(languageIndex)
  })

  it('is reachable from every routed screen, not just Home', async () => {
    renderApp({ route: '/new' })
    expect(
      within(screen.getByRole('banner')).getByRole('button', { name: /^Language:/ }),
    ).toBeInTheDocument()
  })

  it('cycling it updates the header title live', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/' })

    await user.click(screen.getByRole('button', { name: 'Language: English' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Scor Whist')
    // The label itself is localized too, so it now reads in Romanian.
    expect(screen.getByRole('button', { name: 'Limbă: Română' })).toBeInTheDocument()
  })
})
