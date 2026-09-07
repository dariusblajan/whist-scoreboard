import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import TextField from '@mui/material/TextField'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Radio from '@mui/material/Radio'
import { ArrowUp, ArrowDown } from '../icons.js'
import { cardsDealtSequence } from '../rules/index.js'
import { useGameStore } from '../state/useGameStore.js'
import { BottomBar } from '../components/BottomBar.jsx'

const STEPS = ['Player count', 'Variant', 'Names', 'Seating']
const COUNTS = [3, 4, 5, 6]

const makeRoster = (count) =>
  Array.from({ length: count }, (_, i) => ({ id: `p${i}`, name: `Player ${i + 1}` }))

function shuffled(list) {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function NewGame() {
  const navigate = useNavigate()
  const { newGame } = useGameStore()

  const [step, setStep] = useState(0)
  const [playerCount, setPlayerCount] = useState(4)
  const [variant, setVariant] = useState('short')
  const [promotions, setPromotions] = useState(false)
  const [roster, setRoster] = useState(() => makeRoster(4))
  const [firstDealerId, setFirstDealerId] = useState('p0')

  const firstControlRef = useRef(null)
  const nextRef = useRef(null)

  // Focus the first control whenever the step changes.
  useEffect(() => {
    firstControlRef.current?.focus()
  }, [step])

  const setCount = (count) => {
    setPlayerCount(count)
    const next = makeRoster(count)
    setRoster(next)
    setFirstDealerId(next[0].id)
  }

  const sequence = useMemo(
    () => cardsDealtSequence(playerCount, variant),
    [playerCount, variant],
  )

  const move = (index, delta) => {
    const target = index + delta
    if (target < 0 || target >= roster.length) return
    setRoster((prev) => {
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const start = () => {
    const players = roster.map((p, seatIndex) => ({
      id: p.id,
      name: p.name.trim() || `Player ${seatIndex + 1}`,
      seatIndex,
    }))
    const firstDealerSeatIndex = roster.findIndex((p) => p.id === firstDealerId)
    newGame({ players, variant, firstDealerSeatIndex, promotions })
    navigate('/play')
  }

  const isLast = step === STEPS.length - 1

  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h2">
        New game
      </Typography>
      <Typography color="text.secondary">
        Step {step + 1} of {STEPS.length} — {STEPS[step]}
      </Typography>

      {step === 0 && (
        <Stack spacing={1}>
          <Typography component="h3" variant="subtitle1">
            How many players?
          </Typography>
          <ToggleButtonGroup
            exclusive
            value={playerCount}
            onChange={(_, v) => v != null && setCount(v)}
            aria-label="Player count"
          >
            {COUNTS.map((c, i) => (
              <ToggleButton
                key={c}
                value={c}
                ref={i === 0 ? firstControlRef : undefined}
                sx={{ minWidth: 56, minHeight: 48 }}
              >
                {c}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
      )}

      {step === 1 && (
        <Stack spacing={2}>
          <ToggleButtonGroup
            exclusive
            value={variant}
            onChange={(_, v) => v != null && setVariant(v)}
            aria-label="Variant"
          >
            <ToggleButton value="short" ref={firstControlRef} sx={{ minHeight: 48 }}>
              Short
            </ToggleButton>
            <ToggleButton value="long" sx={{ minHeight: 48 }}>
              Long
            </ToggleButton>
          </ToggleButtonGroup>
          <Typography color="text.secondary">
            {sequence.length} hands ({3 * playerCount} + 12)
          </Typography>
          <Paper
            variant="outlined"
            sx={{ p: 1.5, overflowX: 'auto', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}
          >
            <Typography variant="body2" component="div">
              {sequence.join('  ')}
            </Typography>
          </Paper>
          <FormControlLabel
            control={
              <Switch
                checked={promotions}
                onChange={(e) => setPromotions(e.target.checked)}
              />
            }
            label="Promotions"
          />
          <Typography variant="caption" color="text.secondary">
            ±10 for every 5 hands in a row you make / miss; 1-card hands reset it.
          </Typography>
        </Stack>
      )}

      {step === 2 && (
        <Stack spacing={2}>
          <Typography color="text.secondary">
            Optional — the defaults work. Names raise the keyboard; nothing else does.
          </Typography>
          {roster.map((p, i) => (
            <TextField
              key={p.id}
              label={`Player ${i + 1}`}
              value={p.name}
              inputRef={i === 0 ? firstControlRef : undefined}
              onChange={(e) =>
                setRoster((prev) =>
                  prev.map((row, j) => (j === i ? { ...row, name: e.target.value } : row)),
                )
              }
              slotProps={{ htmlInput: { enterKeyHint: 'next' } }}
              fullWidth
            />
          ))}
        </Stack>
      )}

      {step === 3 && (
        <Stack spacing={2}>
          <Typography color="text.secondary">
            Order round the table, and who deals first.
          </Typography>
          <Button
            ref={firstControlRef}
            onClick={() => setRoster((prev) => shuffled(prev))}
            variant="outlined"
          >
            Randomize
          </Button>
          <Stack spacing={1}>
            {roster.map((p, i) => (
              <Paper
                key={p.id}
                variant="outlined"
                sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}
              >
                <FormControlLabel
                  sx={{ flexGrow: 1, m: 0 }}
                  control={
                    <Radio
                      checked={firstDealerId === p.id}
                      onChange={() => setFirstDealerId(p.id)}
                      inputProps={{ 'aria-label': `${p.name} deals first` }}
                    />
                  }
                  label={
                    <span>
                      Seat {i + 1}: {p.name}
                      {firstDealerId === p.id ? ' — deals first' : ''}
                    </span>
                  }
                />
                <IconButton
                  aria-label={`Move ${p.name} up`}
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  <ArrowUp />
                </IconButton>
                <IconButton
                  aria-label={`Move ${p.name} down`}
                  disabled={i === roster.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown />
                </IconButton>
              </Paper>
            ))}
          </Stack>
        </Stack>
      )}

      <BottomBar
        ref={nextRef}
        backLabel={step === 0 ? 'Cancel' : 'Back'}
        onBack={step === 0 ? () => navigate('/') : () => setStep((s) => s - 1)}
        nextLabel={isLast ? 'Start' : 'Next'}
        onNext={isLast ? start : () => setStep((s) => s + 1)}
      />
    </Stack>
  )
}
