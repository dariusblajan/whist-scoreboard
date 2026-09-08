import { useRegisterSW } from 'virtual:pwa-register/react'
import Snackbar from '@mui/material/Snackbar'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import { Close } from '../icons.js'

/**
 * Manual, mid-game-safe update prompt. When a new service worker is waiting,
 * show a dismissible snackbar; the reload only happens if the player taps
 * "Reload". Nothing auto-reloads.
 */
export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  const close = () => setNeedRefresh(false)

  return (
    <Snackbar
      open={needRefresh}
      onClose={(_event, reason) => {
        // Don't let a stray click-away hide it; require an explicit choice.
        if (reason !== 'clickaway') close()
      }}
      message="New version available"
      action={
        <>
          <Button
            color="secondary"
            size="small"
            onClick={() => updateServiceWorker(true)}
          >
            Reload
          </Button>
          <IconButton
            size="small"
            color="inherit"
            aria-label="Dismiss update"
            onClick={close}
          >
            <Close fontSize="small" />
          </IconButton>
        </>
      }
    />
  )
}
