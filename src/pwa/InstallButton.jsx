import Button from '@mui/material/Button'
import { Download } from '../icons.js'
import { useInstallPrompt } from './useInstallPrompt.js'
import { useTranslation } from '../i18n/useTranslation.js'

/** "Install app" button; renders nothing until the browser offers an install. */
export function InstallButton() {
  const { t } = useTranslation()
  const { canInstall, promptInstall } = useInstallPrompt()
  if (!canInstall) return null
  return (
    <Button
      onClick={promptInstall}
      size="large"
      startIcon={<Download />}
      variant="outlined"
    >
      {t('common.installApp')}
    </Button>
  )
}
