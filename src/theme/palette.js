import { createTheme } from '@mui/material/styles'

// "Playful Trick-Taking" design language (design-review iteration 09): a
// saturated violet primary with a warm-red secondary standing in for the
// suit colours, rounded-full controls, and a friendly display/body type
// pairing. `primary`/`secondary`/`success`/`error`/`warning` all double as
// *text* colours somewhere (leader highlight, hand summaries, promotion
// chips), not just fills, so every one of them gets a shade tuned per scheme
// to clear 4.5:1 against its paper — light needs darker, dark needs lighter.
const brand = {
  light: { primary: '#6B46F0', secondary: '#C6301F' },
  dark: { primary: '#B49BFF', secondary: '#FF8A7A' },
  info: '#2F80ED',
}

const status = {
  light: { success: '#1E7A50', error: '#C22A1F', warning: '#8A5A00' },
  dark: { success: '#5FD9A4', error: '#FF8FA3', warning: '#F5B547' },
}

// Table/card borders default to a *lightened* divider (MUI's TableCell
// blends it to ~88% toward white in light mode), which reads as nearly
// invisible on a scoreboard people read across a table. These are used
// verbatim instead, so grid lines stay clearly visible without being heavy.
const divider = {
  light: '#D9CCFA',
  dark: '#4A3F6B',
}

const shared = {
  shape: { borderRadius: 20 },
  typography: {
    fontFamily: '"Nunito Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
    h1: { fontFamily: '"Baloo 2", system-ui, sans-serif' },
    h2: { fontFamily: '"Baloo 2", system-ui, sans-serif' },
    h3: { fontFamily: '"Baloo 2", system-ui, sans-serif' },
    h4: { fontFamily: '"Baloo 2", system-ui, sans-serif', fontWeight: 800 },
    h5: { fontFamily: '"Baloo 2", system-ui, sans-serif', fontWeight: 700 },
    h6: { fontFamily: '"Baloo 2", system-ui, sans-serif', fontWeight: 700 },
    subtitle1: { fontFamily: '"Baloo 2", system-ui, sans-serif', fontWeight: 600 },
    subtitle2: { fontFamily: '"Baloo 2", system-ui, sans-serif', fontWeight: 600 },
    button: { fontWeight: 800 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        // Comfortable, thumb-friendly tap targets by default. Rounded-full
        // to match the playful language; ToggleButton opts out below since a
        // pill look reads oddly for a grouped/segmented control.
        root: { minHeight: 44, borderRadius: 999, textTransform: 'none', fontWeight: 700 },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: { borderRadius: 14 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        // Outlined Papers (bid/result/summary cards throughout HandPlay,
        // GameOver, NewGame) get a soft shadow instead of relying on the
        // border alone — closer to the approved direction's card treatment.
        outlined: { boxShadow: '0 6px 16px rgba(124, 92, 250, 0.10)' },
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
      primary: {
        main: brand[scheme].primary,
        // Dark-mode primary is a light lavender (for text-on-dark contrast),
        // so it needs a dark contrast text of its own rather than MUI's
        // auto-picked white.
        ...(scheme === 'dark' ? { contrastText: '#1B1030' } : {}),
      },
      secondary: { main: brand[scheme].secondary },
      success: { main: status[scheme].success },
      error: { main: status[scheme].error },
      warning: { main: status[scheme].warning },
      info: { main: brand.info },
      divider: divider[scheme],
      ...(scheme === 'dark'
        ? { background: { default: '#191527', paper: '#241F38' } }
        : { background: { default: '#F6F3FF', paper: '#ffffff' } }),
    },
    components: {
      ...shared.components,
      MuiTableCell: {
        styleOverrides: {
          // Table borders read directly off `divider` (above) instead of
          // MUI's default lighten/darken blend, which washes the grid lines
          // out almost to invisibility — the scoreboard needs clearly
          // readable row/column lines.
          root: { borderBottom: `1px solid ${divider[scheme]}` },
        },
      },
    },
  })
}
