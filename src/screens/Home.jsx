import { Link as RouterLink } from 'react-router-dom'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

export function Home() {
  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h2">
        Whist Scoreboard
      </Typography>
      <Typography color="text.secondary">
        Keep score for a game of Romanian whist.
      </Typography>
      <Button
        component={RouterLink}
        to="/new"
        variant="contained"
        size="large"
      >
        New game
      </Button>
    </Stack>
  )
}
