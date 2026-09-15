import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import { useTranslation } from '../i18n/useTranslation.js'
import { LOCALES } from '../i18n/resources.js'

/**
 * Compact language toggle for the top bar, next to the theme toggle. Only two
 * locales exist, so — mirroring `ThemeToggleButton` — a single tap cycles to
 * the other one; the button shows the active locale's code and a tooltip /
 * aria-label spell out the active language in full.
 */
export function LanguageSwitcher() {
  const { t, locale, setLocale } = useTranslation()
  const index = LOCALES.findIndex((l) => l.code === locale)
  const current = LOCALES[index] ?? LOCALES[0]
  const label = t('meta.languageStatus', { name: t(current.labelKey) })

  const cycle = () => {
    const next = LOCALES[(index + 1) % LOCALES.length]
    setLocale(next.code)
  }

  return (
    <Tooltip title={label}>
      <IconButton
        color="inherit"
        onClick={cycle}
        aria-label={label}
        sx={{ fontSize: '0.8rem', fontWeight: 700 }}
      >
        {current.code.toUpperCase()}
      </IconButton>
    </Tooltip>
  )
}
