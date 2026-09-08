import { Navigate, useNavigate } from 'react-router-dom'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import { useGameStore } from '../state/useGameStore.js'
import { standings } from '../rules/index.js'
import { playerName } from '../state/selectors.js'

const ORDINAL = ['1st', '2nd', '3rd', '4th', '5th', '6th']

export function GameOver() {
  const { game } = useGameStore()
  const navigate = useNavigate()

  if (!game) return <Navigate to="/" replace />

  const rows = standings(game)

  // The finished game stays in storage as a read-only record until the setup
  // wizard's Start replaces it; no need to clear it here.
  const newGame = () => navigate('/new')

  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h2">
        Game over
      </Typography>
      <Stack spacing={1}>
        {rows.map((row) => (
          <Paper
            key={row.playerId}
            variant="outlined"
            sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between' }}
          >
            <Typography>
              {ORDINAL[row.rank - 1] ?? `${row.rank}th`} — {playerName(game, row.playerId)}
            </Typography>
            <Typography fontWeight="bold">{row.total}</Typography>
          </Paper>
        ))}
      </Stack>
      <Button variant="contained" size="large" onClick={newGame}>
        New game
      </Button>
      <Button size="large" onClick={() => navigate('/')}>
        Home
      </Button>
    </Stack>
  )
}
