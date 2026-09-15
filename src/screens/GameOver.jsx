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
import { useTranslation } from '../i18n/useTranslation.js'
import { formatOrdinal } from '../i18n/ordinal.js'

export function GameOver() {
  const { t, locale } = useTranslation()
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
        {t('gameOver.title')}
      </Typography>
      <Stack spacing={1}>
        {rows.map((row) => {
          const tally = tallies[row.playerId]
          const shared = rankCounts[row.rank] > 1
          const ordinal = formatOrdinal(locale, row.rank)
          return (
            <Paper key={row.playerId} variant="outlined" sx={{ p: 1.5 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography>
                  {shared ? t('gameOver.rankTie', { ordinal }) : t('gameOver.rank', { ordinal })} —{' '}
                  {playerName(game, row.playerId)}
                </Typography>
                <Typography fontWeight="bold">{row.total}</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {promotions
                  ? t('gameOver.talliesWithPromotions', {
                      made: tally.made,
                      over: tally.over,
                      under: tally.under,
                      promo: tally.promotion >= 0 ? `+${tally.promotion}` : tally.promotion,
                    })
                  : t('gameOver.tallies', { made: tally.made, over: tally.over, under: tally.under })}
              </Typography>
            </Paper>
          )
        })}
      </Stack>
      <Button variant="contained" size="large" onClick={() => setConfirmOpen(true)}>
        {t('common.newGame')}
      </Button>
      <Button size="large" onClick={() => navigate('/print')}>
        {t('gameOver.printSave')}
      </Button>
      <Button size="large" onClick={() => navigate('/scoreboard')}>
        {t('home.viewScoreboard')}
      </Button>
      <Button size="large" onClick={() => navigate('/')}>
        {t('common.home')}
      </Button>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{t('home.startNewConfirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('home.startNewConfirmBody')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={startNew} color="error">
            {t('common.newGame')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
