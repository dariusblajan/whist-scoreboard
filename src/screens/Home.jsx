import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import { useGameStore } from '../state/useGameStore.js'
import { InstallButton } from '../pwa/InstallButton.jsx'

export function Home() {
  const { game, stats, discardGame } = useGameStore()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const isActive = Boolean(game && game.status === 'active')
  const isFinished = Boolean(game && game.status === 'complete')
  const firstRun = !game && stats.gamesPlayed === 0 && stats.gamesFinished === 0

  // Whichever kind of saved game this is, "New game" always discards it first —
  // a finished game left un-discarded would otherwise leak into the next
  // wizard's blank-sheet preview and the Home screen alike.
  const startNew = () => {
    discardGame()
    setConfirmOpen(false)
    navigate('/new')
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h2">
        Whist Scoreboard
      </Typography>
      <Typography color="text.secondary">
        Keep score for a game of Romanian whist.
      </Typography>

      {firstRun ? (
        <Typography color="text.secondary">
          No games yet. Start a new one — pick the players, and it tracks every
          bid, trick, and running total for you.
        </Typography>
      ) : (
        <Stack direction="row" spacing={3}>
          <Stat label="Games played" value={stats.gamesPlayed} />
          <Stat label="Games finished" value={stats.gamesFinished} />
        </Stack>
      )}

      {isActive && (
        <Stack spacing={1.5}>
          <Button component={RouterLink} to="/play" variant="contained" size="large">
            Resume game
          </Button>
          <Button component={RouterLink} to="/scoreboard" size="large">
            View scoreboard
          </Button>
          <Button onClick={() => setConfirmOpen(true)} size="large">
            New game
          </Button>
        </Stack>
      )}

      {isFinished && (
        <Stack spacing={1.5}>
          <Button component={RouterLink} to="/over" variant="contained" size="large">
            View last game
          </Button>
          <Button onClick={() => setConfirmOpen(true)} size="large">
            New game
          </Button>
        </Stack>
      )}

      {!isActive && !isFinished && (
        <Button component={RouterLink} to="/new" variant="contained" size="large">
          New game
        </Button>
      )}

      <InstallButton />

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{isActive ? 'Discard the game in progress?' : 'Start a new game?'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {isActive
              ? 'Starting a new game deletes the current one. This cannot be undone.'
              : 'This clears the finished game from the scoreboard.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>
            {isActive ? 'Keep playing' : 'Cancel'}
          </Button>
          <Button onClick={startNew} color="error">
            {isActive ? 'Discard and start new' : 'New game'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

function Stat({ label, value }) {
  return (
    <Stack>
      <Typography variant="h5" component="p">{value}</Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  )
}
