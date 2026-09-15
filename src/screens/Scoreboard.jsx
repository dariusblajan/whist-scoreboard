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
import { useTranslation } from '../i18n/useTranslation.js'

const PINNED = {
  position: 'sticky',
  left: 0,
  zIndex: 3,
  bgcolor: 'background.paper',
  borderRight: 1,
  borderColor: 'divider',
}

export function Scoreboard() {
  const { t } = useTranslation()
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
          {t('scoreboard.title')}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button onClick={() => navigate('/print')}>{t('scoreboard.print')}</Button>
          <Button onClick={() => navigate(editable ? '/play' : '/over')}>
            {editable ? t('scoreboard.backToGame') : t('common.back')}
          </Button>
        </Stack>
      </Box>

      <Box sx={{ overflowX: 'auto', maxHeight: '70dvh', border: 1.5, borderColor: 'divider', borderRadius: 1 }}>
        <Table size="small" stickyHeader aria-label={t('scoreboard.tableAria')}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...PINNED, zIndex: 4 }}>{t('scoreboard.cardsHeader')}</TableCell>
              {game.players.map((p, i) => (
                <TableCell
                  key={p.id}
                  align="center"
                  colSpan={2}
                  sx={{
                    fontWeight: leaders.has(p.id) ? 700 : 400,
                    ...(i > 0 && { borderLeft: 1, borderLeftColor: 'divider' }),
                  }}
                >
                  {p.name}
                  {leaders.has(p.id) ? t('scoreboard.leaderSuffix') : ''}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell
                component="td"
                aria-hidden
                sx={{ ...PINNED, top: '2rem', zIndex: 4, borderBottom: 2, borderBottomColor: 'divider' }}
              />
              {game.players.map((p, i) => [
                <TableCell
                  key={`${p.id}-b`}
                  align="center"
                  sx={{
                    top: '2rem',
                    borderBottom: 2,
                    borderBottomColor: 'divider',
                    ...(i > 0 && { borderLeft: 1, borderLeftColor: 'divider' }),
                  }}
                >
                  {t('scoreboard.bidHeader')}
                </TableCell>,
                <TableCell key={`${p.id}-s`} align="center" sx={{ top: '2rem', borderBottom: 2, borderBottomColor: 'divider' }}>
                  {t('scoreboard.scoreHeader')}
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
                {game.players.map((p, i) => {
                  const cell = row.cells[p.id]
                  return [
                    <TableCell
                      key={`${p.id}-b`}
                      align="center"
                      sx={i > 0 ? { borderLeft: 1, borderLeftColor: 'divider' } : undefined}
                    >
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
              <TableCell sx={{ ...PINNED, bottom: 0, zIndex: 4, borderTop: 2, borderTopColor: 'divider' }}>
                {t('scoreboard.totalRow')}
              </TableCell>
              {game.players.map((p, i) => (
                <TableCell
                  key={p.id}
                  align="center"
                  colSpan={2}
                  sx={{
                    position: 'sticky',
                    bottom: 0,
                    bgcolor: 'background.paper',
                    fontWeight: 700,
                    borderTop: 2,
                    borderTopColor: 'divider',
                    ...(i > 0 && { borderLeft: 1, borderLeftColor: 'divider' }),
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
