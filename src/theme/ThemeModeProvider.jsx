import { useCallback, useEffect, useMemo, useState } from 'react'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeModeContext } from './ThemeModeContext.js'
import { buildTheme } from './palette.js'
import {
  getStoredMode,
  nextMode,
  resolveScheme,
  storeMode,
  systemPrefersDark,
} from './themeMode.js'

/**
 * Provides the MUI theme plus a small API for reading and changing the
 * light/dark preference. Preference persists to localStorage; 'system' tracks
 * the OS setting live.
 */
export function ThemeModeProvider({ children }) {
  const [mode, setModeState] = useState(getStoredMode)
  const [prefersDark, setPrefersDark] = useState(systemPrefersDark)

  // Follow the OS while (and only while) the preference is 'system'.
  useEffect(() => {
    let mql
    try {
      mql = window.matchMedia('(prefers-color-scheme: dark)')
    } catch {
      return
    }
    const onChange = (e) => setPrefersDark(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  const setMode = useCallback((next) => {
    setModeState(next)
    storeMode(next)
  }, [])

  const cycleMode = useCallback(() => {
    setModeState((current) => {
      const next = nextMode(current)
      storeMode(next)
      return next
    })
  }, [])

  const scheme = resolveScheme(mode, prefersDark)
  const theme = useMemo(() => buildTheme(scheme), [scheme])

  const value = useMemo(
    () => ({ mode, scheme, setMode, cycleMode }),
    [mode, scheme, setMode, cycleMode],
  )

  return (
    <ThemeModeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeModeContext.Provider>
  )
}
