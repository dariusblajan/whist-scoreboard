import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeModeProvider } from './ThemeModeProvider.jsx'
import { useThemeMode } from './useThemeMode.js'
import { mockPrefersColorScheme } from '../test/utils.jsx'

function Probe() {
  const { mode, scheme, cycleMode, setMode } = useThemeMode()
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="scheme">{scheme}</span>
      <button onClick={cycleMode}>cycle</button>
      <button onClick={() => setMode('light')}>go-light</button>
    </div>
  )
}

const renderProbe = () =>
  render(
    <ThemeModeProvider>
      <Probe />
    </ThemeModeProvider>,
  )

describe('ThemeModeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to system and resolves to the OS preference', () => {
    mockPrefersColorScheme(true)
    renderProbe()
    expect(screen.getByTestId('mode')).toHaveTextContent('system')
    expect(screen.getByTestId('scheme')).toHaveTextContent('dark')
  })

  it('cycles system → light → dark → system and persists', async () => {
    mockPrefersColorScheme(false)
    renderProbe()
    const cycle = screen.getByRole('button', { name: 'cycle' })

    await userEvent.click(cycle)
    expect(screen.getByTestId('mode')).toHaveTextContent('light')
    expect(localStorage.getItem('whist:themeMode:v1')).toBe('light')

    await userEvent.click(cycle)
    expect(screen.getByTestId('mode')).toHaveTextContent('dark')

    await userEvent.click(cycle)
    expect(screen.getByTestId('mode')).toHaveTextContent('system')
  })

  it('reads a stored override on mount', () => {
    localStorage.setItem('whist:themeMode:v1', 'dark')
    mockPrefersColorScheme(false)
    renderProbe()
    expect(screen.getByTestId('mode')).toHaveTextContent('dark')
    expect(screen.getByTestId('scheme')).toHaveTextContent('dark')
  })

  it('follows live OS changes only while on system', async () => {
    let listener
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      addEventListener: (_e, cb) => {
        listener = cb
      },
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })
    renderProbe()
    expect(screen.getByTestId('scheme')).toHaveTextContent('light')

    act(() => listener({ matches: true }))
    expect(screen.getByTestId('scheme')).toHaveTextContent('dark')

    // Pin to light: OS change should no longer matter.
    await userEvent.click(screen.getByRole('button', { name: 'go-light' }))
    act(() => listener({ matches: false }))
    expect(screen.getByTestId('scheme')).toHaveTextContent('light')
    act(() => listener({ matches: true }))
    expect(screen.getByTestId('scheme')).toHaveTextContent('light')
  })
})
