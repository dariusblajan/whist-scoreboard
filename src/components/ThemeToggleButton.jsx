import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import { ThemeLightDark, WeatherNight, WhiteBalanceSunny } from '../icons.js'
import { useThemeMode } from '../theme/useThemeMode.js'

const LABEL = {
  system: 'Theme: follow system',
  light: 'Theme: light',
  dark: 'Theme: dark',
}

export function ThemeToggleButton() {
  const { mode, cycleMode } = useThemeMode()
  const Icon =
    mode === 'light'
      ? WhiteBalanceSunny
      : mode === 'dark'
        ? WeatherNight
        : ThemeLightDark

  return (
    <Tooltip title={LABEL[mode]}>
      <IconButton
        color="inherit"
        onClick={cycleMode}
        aria-label={LABEL[mode]}
      >
        <Icon />
      </IconButton>
    </Tooltip>
  )
}
