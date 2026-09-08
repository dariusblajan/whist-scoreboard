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

export function Home() {
  const { game, stats, discardGame } = useGameStore()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const hasActiveGame = Boolean(game && game.status === 'active')

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

      <Stack direction="row" spacing={3}>
        <Stat label="Games played" value={stats.gamesPlayed} />
        <Stat label="Games finished" value={stats.gamesFinished} />
      </Stack>

      {hasActiveGame ? (
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
      ) : (
        <Button component={RouterLink} to="/new" variant="contained" size="large">
          New game
        </Button>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Discard the game in progress?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Starting a new game deletes the current one. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Keep playing</Button>
          <Button onClick={startNew} color="error">
            Discard and start new
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

function Stat({ label, value }) {
  return (
    <Stack>
      <Typography variant="h5">{value}</Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  )
}
