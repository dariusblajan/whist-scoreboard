import { forwardRef } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'

/**
 * Sticky action bar pinned to the bottom of the viewport: a secondary "Back"
 * on the left, the primary action on the right (thumb zone). The forwarded ref
 * lands on the primary button so a step can focus it once its entry is done.
 */
export const BottomBar = forwardRef(function BottomBar(
  { backLabel = 'Back', onBack, nextLabel = 'Next', onNext, nextDisabled = false },
  ref,
) {
  return (
    <Box
      sx={{
        position: 'sticky',
        bottom: 0,
        display: 'flex',
        justifyContent: 'space-between',
        gap: 2,
        py: 2,
        mt: 3,
        bgcolor: 'background.default',
      }}
    >
      <Button type="button" size="large" onClick={onBack} disabled={!onBack}>
        {backLabel}
      </Button>
      <Button
        ref={ref}
        type="button"
        size="large"
        variant="contained"
        onClick={onNext}
        disabled={nextDisabled || !onNext}
      >
        {nextLabel}
      </Button>
    </Box>
  )
})
