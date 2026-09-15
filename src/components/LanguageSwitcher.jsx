import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { useTranslation } from '../i18n/useTranslation.js'
import { LOCALES } from '../i18n/resources.js'

/** Language picker — on Home, so it's reachable before or after a game exists. */
export function LanguageSwitcher() {
  const { t, locale, setLocale } = useTranslation()
  return (
    <Stack spacing={1}>
      <Typography variant="caption" color="text.secondary" id="language-switcher-label">
        {t('meta.language')}
      </Typography>
      <ToggleButtonGroup
        exclusive
        value={locale}
        onChange={(_, next) => next != null && setLocale(next)}
        aria-labelledby="language-switcher-label"
      >
        {LOCALES.map(({ code, labelKey }) => (
          <ToggleButton key={code} value={code}>
            {t(labelKey)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  )
}
