import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import { ThemeLightDark, WeatherNight, WhiteBalanceSunny } from '../icons.js'
import { useThemeMode } from '../theme/useThemeMode.js'
import { useTranslation } from '../i18n/useTranslation.js'

const LABEL_KEY = {
  system: 'common.themeSystem',
  light: 'common.themeLight',
  dark: 'common.themeDark',
}

export function ThemeToggleButton() {
  const { t } = useTranslation()
  const { mode, cycleMode } = useThemeMode()
  const Icon =
    mode === 'light'
      ? WhiteBalanceSunny
      : mode === 'dark'
        ? WeatherNight
        : ThemeLightDark
  const label = t(LABEL_KEY[mode])

  return (
    <Tooltip title={label}>
      <IconButton
        color="inherit"
        onClick={cycleMode}
        aria-label={label}
      >
        <Icon />
      </IconButton>
    </Tooltip>
  )
}
