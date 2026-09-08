import Button from '@mui/material/Button'
import { Download } from '../icons.js'
import { useInstallPrompt } from './useInstallPrompt.js'

/** "Install app" button; renders nothing until the browser offers an install. */
export function InstallButton() {
  const { canInstall, promptInstall } = useInstallPrompt()
  if (!canInstall) return null
  return (
    <Button
      onClick={promptInstall}
      size="large"
      startIcon={<Download />}
      variant="outlined"
    >
      Install app
    </Button>
  )
}
