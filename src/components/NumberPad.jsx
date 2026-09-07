import { forwardRef } from 'react'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import FormHelperText from '@mui/material/FormHelperText'

/**
 * A row of tap targets for the integers `0..max`. No text input, no keyboard.
 * The button matching `value` is shown selected; `disabledValue` (optional) is
 * rendered non-interactive with `helperText` beneath the pad.
 *
 * The forwarded ref lands on the first button so callers can move focus here
 * when a step becomes active.
 */
export const NumberPad = forwardRef(function NumberPad(
  { max, value, onSelect, disabledValue = null, helperText = '', label },
  ref,
) {
  const numbers = Array.from({ length: max + 1 }, (_, n) => n)
  return (
    <div>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" role="group" aria-label={label}>
        {numbers.map((n) => {
          const isDisabled = n === disabledValue
          return (
            <Button
              key={n}
              ref={n === 0 ? ref : undefined}
              type="button"
              size="large"
              variant={n === value ? 'contained' : 'outlined'}
              disabled={isDisabled}
              aria-pressed={n === value}
              onClick={() => onSelect(n)}
              sx={{ minWidth: 48, minHeight: 48 }}
            >
              {n}
            </Button>
          )
        })}
      </Stack>
      {disabledValue != null && helperText ? (
        <FormHelperText>{helperText}</FormHelperText>
      ) : null}
    </div>
  )
})
