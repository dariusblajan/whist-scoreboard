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
import { useTranslation } from '../i18n/useTranslation.js'
import { InstallButton } from '../pwa/InstallButton.jsx'
import { LanguageSwitcher } from '../components/LanguageSwitcher.jsx'

export function Home() {
  const { t } = useTranslation()
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
        {t('common.appTitle')}
      </Typography>
      <Typography color="text.secondary">{t('home.subtitle')}</Typography>

      {firstRun ? (
        <Typography color="text.secondary">{t('home.firstRun')}</Typography>
      ) : (
        <Stack direction="row" spacing={3}>
          <Stat label={t('home.gamesPlayed')} value={stats.gamesPlayed} />
          <Stat label={t('home.gamesFinished')} value={stats.gamesFinished} />
        </Stack>
      )}

      {isActive && (
        <Stack spacing={1.5}>
          <Button component={RouterLink} to="/play" variant="contained" size="large">
            {t('home.resumeGame')}
          </Button>
          <Button component={RouterLink} to="/scoreboard" size="large">
            {t('home.viewScoreboard')}
          </Button>
          <Button onClick={() => setConfirmOpen(true)} size="large">
            {t('common.newGame')}
          </Button>
        </Stack>
      )}

      {isFinished && (
        <Stack spacing={1.5}>
          <Button component={RouterLink} to="/over" variant="contained" size="large">
            {t('home.viewLastGame')}
          </Button>
          <Button onClick={() => setConfirmOpen(true)} size="large">
            {t('common.newGame')}
          </Button>
        </Stack>
      )}

      {!isActive && !isFinished && (
        <Button component={RouterLink} to="/new" variant="contained" size="large">
          {t('common.newGame')}
        </Button>
      )}

      <InstallButton />
      <LanguageSwitcher />

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>
          {isActive ? t('home.discardConfirmTitle') : t('home.startNewConfirmTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {isActive ? t('home.discardConfirmBody') : t('home.startNewConfirmBody')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>
            {isActive ? t('home.keepPlaying') : t('common.cancel')}
          </Button>
          <Button onClick={startNew} color="error">
            {isActive ? t('home.discardAndStartNew') : t('common.newGame')}
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
