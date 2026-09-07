import { Outlet } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import { ThemeToggleButton } from './ThemeToggleButton.jsx'
import heroImg from '../assets/hero.png'

/** App shell: top bar with the mark, title, and theme toggle; routed content below. */
export function AppLayout() {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky" color="primary" enableColorOnDark>
        <Toolbar>
          <Box
            component="img"
            src={heroImg}
            alt=""
            sx={{ width: 28, height: 28, mr: 1.5 }}
          />
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            Whist Scoreboard
          </Typography>
          <ThemeToggleButton />
        </Toolbar>
      </AppBar>
      <Container
        component="main"
        maxWidth="sm"
        sx={{ flexGrow: 1, py: 3, px: 2 }}
      >
        <Outlet />
      </Container>
    </Box>
  )
}
