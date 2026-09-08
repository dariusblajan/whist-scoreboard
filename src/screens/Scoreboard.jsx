import { Navigate, useNavigate } from 'react-router-dom'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableFooter from '@mui/material/TableFooter'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Chip from '@mui/material/Chip'
import { useGameStore } from '../state/useGameStore.js'
import { scoreboardRows } from '../state/selectors.js'

const PINNED = {
  position: 'sticky',
  left: 0,
  zIndex: 3,
  bgcolor: 'background.paper',
  borderRight: 1,
  borderColor: 'divider',
}

export function Scoreboard() {
  const { game, goToHand } = useGameStore()
  const navigate = useNavigate()

  if (!game) return <Navigate to="/" replace />

  const { rows, totals, leaders } = scoreboardRows(game)
  const editable = game.status === 'active'
  const promotions = game.options.promotions

  const openHand = (handIndex) => {
    if (!editable) return
    goToHand(handIndex)
    navigate('/play')
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h2">
          Scoreboard
        </Typography>
        <Button onClick={() => navigate(editable ? '/play' : '/over')}>
          {editable ? 'Back to game' : 'Back'}
        </Button>
      </Box>

      <Box sx={{ overflowX: 'auto', maxHeight: '70dvh', border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <Table size="small" stickyHeader aria-label="Scoreboard">
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...PINNED, zIndex: 4 }}>Cards</TableCell>
              {game.players.map((p) => (
                <TableCell
                  key={p.id}
                  align="center"
                  colSpan={2}
                  sx={{ fontWeight: leaders.has(p.id) ? 700 : 400 }}
                >
                  {p.name}
                  {leaders.has(p.id) ? ' ★' : ''}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...PINNED, top: '2rem', zIndex: 4 }} />
              {game.players.map((p) => [
                <TableCell key={`${p.id}-b`} align="center" sx={{ top: '2rem' }}>
                  Bid
                </TableCell>,
                <TableCell key={`${p.id}-s`} align="center" sx={{ top: '2rem' }}>
                  Score
                </TableCell>,
              ])}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.handIndex}
                hover={editable && row.played}
                onClick={() => row.played && openHand(row.handIndex)}
                sx={{
                  cursor: editable && row.played ? 'pointer' : 'default',
                  opacity: row.played ? 1 : 0.45,
                }}
                data-testid={`hand-row-${row.handIndex}`}
              >
                <TableCell sx={PINNED}>{row.cardsDealt}</TableCell>
                {game.players.map((p) => {
                  const cell = row.cells[p.id]
                  return [
                    <TableCell key={`${p.id}-b`} align="center">
                      {cell.bid ?? ''}
                    </TableCell>,
                    <TableCell key={`${p.id}-s`} align="center">
                      {cell.cumulative ?? ''}
                      {promotions && cell.bonus != null && (
                        <Chip
                          size="small"
                          label={cell.bonus > 0 ? '+10' : '−10'}
                          color={cell.bonus > 0 ? 'success' : 'error'}
                          sx={{ ml: 0.5, height: 18, '& .MuiChip-label': { px: 0.5, fontSize: 11 } }}
                        />
                      )}
                    </TableCell>,
                  ]
                })}
              </TableRow>
            ))}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TableCell sx={{ ...PINNED, bottom: 0, zIndex: 4 }}>Total</TableCell>
              {game.players.map((p) => (
                <TableCell
                  key={p.id}
                  align="center"
                  colSpan={2}
                  sx={{
                    position: 'sticky',
                    bottom: 0,
                    bgcolor: 'background.paper',
                    fontWeight: 700,
                    color: leaders.has(p.id) ? 'primary.main' : 'text.primary',
                  }}
                >
                  {totals[p.id]}
                </TableCell>
              ))}
            </TableRow>
          </TableFooter>
        </Table>
      </Box>
    </Stack>
  )
}
