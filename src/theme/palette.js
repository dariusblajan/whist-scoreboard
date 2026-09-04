import { createTheme } from '@mui/material/styles'

// Brand colours carried over from the original scaffold's theme.
const brand = {
  primary: '#00ADB5',
  secondary: '#F16623',
  success: '#1BB99A',
  error: '#FF5D48',
  warning: '#F5A623',
  info: '#2F80ED',
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
      success: { main: brand.success },
      error: { main: brand.error },
      warning: { main: brand.warning },
      info: { main: brand.info },
      ...(scheme === 'dark'
        ? { background: { default: '#16171d', paper: '#1f2028' } }
        : { background: { default: '#fafafa', paper: '#ffffff' } }),
    },
  })
}
