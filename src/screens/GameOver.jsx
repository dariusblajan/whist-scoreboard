import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import { useGameStore } from '../state/useGameStore.js'
import { standings } from '../rules/index.js'
import { playerName, playerTallies } from '../state/selectors.js'

/** Ordinal for a rank, with ties marked (e.g. two firsts both show "1st (tie)"). */
function rankLabel(rank, shared) {
  const ord = ['1st', '2nd', '3rd', '4th', '5th', '6th'][rank - 1] ?? `${rank}th`
  return shared ? `${ord} (tie)` : ord
}

export function GameOver() {
  const { game, discardGame } = useGameStore()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!game) return <Navigate to="/" replace />

  const rows = standings(game)
  const tallies = playerTallies(game)
  const rankCounts = rows.reduce((acc, r) => ((acc[r.rank] = (acc[r.rank] ?? 0) + 1), acc), {})
  const promotions = game.options.promotions

  const startNew = () => {
    discardGame()
    navigate('/new')
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h2">
        Game over
      </Typography>
      <Stack spacing={1}>
        {rows.map((row) => {
          const t = tallies[row.playerId]
          return (
            <Paper key={row.playerId} variant="outlined" sx={{ p: 1.5 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography>
                  {rankLabel(row.rank, rankCounts[row.rank] > 1)} —{' '}
                  {playerName(game, row.playerId)}
                </Typography>
                <Typography fontWeight="bold">{row.total}</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {t.made} made · {t.over} over · {t.under} under
                {promotions
                  ? ` · promotions ${t.promotion >= 0 ? '+' : ''}${t.promotion}`
                  : ''}
              </Typography>
            </Paper>
          )
        })}
      </Stack>
      <Button variant="contained" size="large" onClick={() => setConfirmOpen(true)}>
        New game
      </Button>
      <Button size="large" onClick={() => navigate('/scoreboard')}>
        View scoreboard
      </Button>
      <Button size="large" onClick={() => navigate('/')}>
        Home
      </Button>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Start a new game?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This clears the finished game from the scoreboard.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={startNew} color="error">
            New game
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
