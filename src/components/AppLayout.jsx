import { Outlet, useLocation } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import { ThemeToggleButton } from './ThemeToggleButton.jsx'
import { LanguageSwitcher } from './LanguageSwitcher.jsx'
import { useTranslation } from '../i18n/useTranslation.js'
import heroImg from '../assets/logo.png'

/** App shell: top bar with the mark, title, and theme toggle; routed content below. */
export function AppLayout() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  // Every other screen is a single-column form/card flow that reads best
  // (and keeps its buttons a sane tap-target width) narrow, even on a wide
  // screen. The scoreboard is tabular data — it's the one screen that
  // genuinely benefits from the extra horizontal room a larger viewport has
  // to give.
  const isScoreboard = pathname === '/scoreboard'
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="sticky"
        color="primary"
        enableColorOnDark
        className="no-print"
        sx={{ borderRadius: '0 0 20px 20px' }}
      >
        <Toolbar>
          <Box
            component="img"
            src={heroImg}
            alt=""
            sx={{ width: 28, height: 28, mr: 1.5 }}
          />
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            {t('common.appTitle')}
          </Typography>
          <LanguageSwitcher />
          <ThemeToggleButton />
        </Toolbar>
      </AppBar>
      <Container
        component="main"
        maxWidth={isScoreboard ? 'lg' : 'sm'}
        sx={{ flexGrow: 1, py: 3, px: 2 }}
      >
        <Outlet />
      </Container>
    </Box>
  )
}
