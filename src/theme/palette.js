import { createTheme } from '@mui/material/styles'

// Brand hues carried over from the original scaffold. `primary`/`secondary` are
// only ever used as fills (with computed contrast text), so one value each is
// fine. `success`/`error`/`warning` double as *text* colours on the page
// background (hand summaries, promotion chips), so each scheme gets a shade
// tuned to clear 4.5:1 against its paper — light needs darker, dark needs
// lighter.
const brand = {
  primary: '#00ADB5',
  secondary: '#F16623',
  info: '#2F80ED',
}

const status = {
  light: { success: '#0F7D68', error: '#C62121', warning: '#8A5A00' },
  dark: { success: '#4FD6BB', error: '#FF8A7A', warning: '#F5B547' },
}

const shared = {
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        // Comfortable, thumb-friendly tap targets by default.
        root: { minHeight: 44, textTransform: 'none', fontWeight: 600 },
      },
    },
  },
}

/**
 * Build an MUI theme for a resolved colour scheme.
 * @param {'light' | 'dark'} scheme
 */
export function buildTheme(scheme) {
  return createTheme({
    ...shared,
    palette: {
      mode: scheme,
      primary: { main: brand.primary },
      secondary: { main: brand.secondary },
      success: { main: status[scheme].success },
      error: { main: status[scheme].error },
      warning: { main: status[scheme].warning },
      info: { main: brand.info },
      ...(scheme === 'dark'
        ? { background: { default: '#16171d', paper: '#1f2028' } }
        : { background: { default: '#fafafa', paper: '#ffffff' } }),
    },
  })
}
