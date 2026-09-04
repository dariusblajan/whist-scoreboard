import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from './utils.jsx'

describe('app shell', () => {
  it('renders the Home screen at /', () => {
    renderApp({ route: '/' })
    expect(
      screen.getByRole('heading', { level: 2, name: /whist scoreboard/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /new game/i })).toBeInTheDocument()
  })

  it('navigates to New game', async () => {
    renderApp({ route: '/' })
    await userEvent.click(screen.getByRole('link', { name: /new game/i }))
    expect(
      screen.getByRole('heading', { level: 2, name: /new game/i }),
    ).toBeInTheDocument()
  })

  it('redirects unknown routes to Home', () => {
    renderApp({ route: '/nonsense' })
    expect(
      screen.getByRole('heading', { level: 2, name: /whist scoreboard/i }),
    ).toBeInTheDocument()
  })

  it('shows the theme toggle in the app bar', () => {
    renderApp({ route: '/' })
    expect(
      screen.getByRole('button', { name: /theme:/i }),
    ).toBeInTheDocument()
  })
})
