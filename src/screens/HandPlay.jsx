import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import { Minus, Plus } from '../icons.js'
import { useGameStore } from '../state/useGameStore.js'
import {
  bidStepComplete,
  dealerPlayer,
  forbiddenBid,
  handSummary,
  playerName,
  takenSoFar,
  takenStepComplete,
} from '../state/selectors.js'
import { NumberPad } from '../components/NumberPad.jsx'
import { BottomBar } from '../components/BottomBar.jsx'

const SUITS = [
  { value: 'spades', symbol: '♠' },
  { value: 'hearts', symbol: '♥' },
  { value: 'diamonds', symbol: '♦' },
  { value: 'clubs', symbol: '♣' },
]

const OUTCOME_LABEL = { made: 'Made it', over: 'Over', under: 'Under' }

export function HandPlay() {
  const store = useGameStore()
  const { game } = store

  if (!game) return <Navigate to="/" replace />
  if (game.status === 'complete') return <Navigate to="/over" replace />

  // Re-mount (fresh phase state) whenever the current hand changes.
  return <HandFlow key={game.currentHandIndex} store={store} />
}

function HandFlow({ store }) {
  const { game } = store
  const navigate = useNavigate()
  const [phase, setPhase] = useState('bid')
  const [endOpen, setEndOpen] = useState(false)

  const handIndex = game.currentHandIndex
  const hand = game.hands[handIndex]
  const isLastHand = handIndex === game.hands.length - 1
  const dealer = dealerPlayer(game, hand)

  return (
    <Stack spacing={3}>
      <HandHeader game={game} hand={hand} dealer={dealer} onEndEarly={() => setEndOpen(true)} />
      {phase === 'bid' && (
        <BidPhase
          game={game}
          hand={hand}
          store={store}
          onBack={() =>
            handIndex === 0 ? navigate('/') : store.goToHand(handIndex - 1)
          }
          onNext={() => setPhase('result')}
        />
      )}
      {phase === 'result' && (
        <ResultPhase
          game={game}
          hand={hand}
          store={store}
          onBack={() => setPhase('bid')}
          onNext={() => {
            store.commitHand(handIndex)
            setPhase('summary')
          }}
        />
      )}
      {phase === 'summary' && (
        <SummaryPhase
          game={game}
          handIndex={handIndex}
          onBack={() => setPhase('result')}
          onNext={() => {
            if (isLastHand) store.finishGame()
            else store.goToHand(handIndex + 1)
          }}
          isLastHand={isLastHand}
        />
      )}

      <Dialog open={endOpen} onClose={() => setEndOpen(false)}>
        <DialogTitle>End the game now?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Standings are ranked from the hands played so far. This does not count
            as a finished game.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEndOpen(false)}>Keep playing</Button>
          <Button
            color="error"
            onClick={() => store.endGameEarly()}
          >
            End game
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

function HandHeader({ game, hand, dealer, onEndEarly }) {
  const order = hand.biddingOrder.map((id) => playerName(game, id)).join(' → ')
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
        <Typography variant="h6" component="h2">
          Hand {hand.index + 1} / {game.hands.length}
        </Typography>
        <Button size="small" color="inherit" onClick={onEndEarly}>
          End game early
        </Button>
      </Box>
      <Typography color="text.secondary">
        {hand.cardsDealt} {hand.cardsDealt === 1 ? 'card' : 'cards'} ·{' '}
        {hand.cardsDealt === 8 ? 'No trump' : 'Trump card turned'}
      </Typography>
      <Typography color="text.secondary">Dealer: {dealer ? dealer.name : '—'}</Typography>
      <Typography color="text.secondary">Bidding: {order}</Typography>
    </Paper>
  )
}

function BidPhase({ game, hand, store, onBack, onNext }) {
  const order = hand.biddingOrder
  const forbidden = forbiddenBid(hand)
  const complete = bidStepComplete(hand)
  const padRefs = useRef([])
  const nextRef = useRef(null)

  const nextBidderIndex = order.findIndex((id) => hand.entries[id].bid == null)

  useEffect(() => {
    if (nextBidderIndex >= 0) padRefs.current[nextBidderIndex]?.focus()
    else nextRef.current?.focus()
  }, [nextBidderIndex])

  return (
    <>
      <Typography component="h3" variant="subtitle1">
        Enter each bid
      </Typography>
      <Stack spacing={2}>
        {order.map((id, i) => {
          const isDealer = i === order.length - 1
          const active = i === nextBidderIndex
          return (
            <Paper
              key={id}
              variant={active ? 'elevation' : 'outlined'}
              elevation={active ? 4 : 0}
              sx={{ p: 1.5 }}
            >
              <Typography variant="subtitle2" gutterBottom>
                {playerName(game, id)}
                {isDealer ? ' (dealer, bids last)' : ''}
              </Typography>
              <NumberPad
                ref={(el) => {
                  padRefs.current[i] = el
                }}
                label={`Bid for ${playerName(game, id)}`}
                max={hand.cardsDealt}
                value={hand.entries[id].bid}
                disabledValue={isDealer ? forbidden : null}
                helperText={`Bids sum to ${hand.cardsDealt} — not allowed`}
                onSelect={(n) => store.setBid(hand.index, id, n)}
              />
            </Paper>
          )
        })}
      </Stack>
      <BottomBar
        ref={nextRef}
        onBack={onBack}
        nextLabel="Next"
        onNext={onNext}
        nextDisabled={!complete}
      />
    </>
  )
}

function ResultPhase({ game, hand, store, onBack, onNext }) {
  const total = takenSoFar(hand)
  const complete = takenStepComplete(hand)
  const firstRef = useRef(null)
  const nextRef = useRef(null)

  // Seed every unset taken to 0 so the steppers start from a valid number.
  useEffect(() => {
    for (const p of game.players) {
      if (hand.entries[p.id].taken == null) store.setTaken(hand.index, p.id, 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hand.index])

  useEffect(() => {
    firstRef.current?.focus()
  }, [])

  const setTaken = (id, value) => {
    const clamped = Math.max(0, Math.min(hand.cardsDealt, value))
    store.setTaken(hand.index, id, clamped)
  }

  return (
    <>
      <Typography component="h3" variant="subtitle1">
        Tricks taken
      </Typography>
      <Stack spacing={2}>
        {game.players.map((p, i) => {
          const taken = hand.entries[p.id].taken ?? 0
          return (
            <Paper key={p.id} variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" gutterBottom>
                {p.name} · bid {hand.entries[p.id].bid}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton
                  aria-label={`One fewer trick for ${p.name}`}
                  disabled={taken <= 0}
                  onClick={() => setTaken(p.id, taken - 1)}
                >
                  <Minus />
                </IconButton>
                <Typography variant="h6" component="span" sx={{ minWidth: 24, textAlign: 'center' }}>
                  {taken}
                </Typography>
                <IconButton
                  ref={i === 0 ? firstRef : undefined}
                  aria-label={`One more trick for ${p.name}`}
                  disabled={taken >= hand.cardsDealt}
                  onClick={() => setTaken(p.id, taken + 1)}
                >
                  <Plus />
                </IconButton>
              </Box>
            </Paper>
          )
        })}
      </Stack>

      <Typography color={complete ? 'success.main' : 'text.secondary'}>
        {total} / {hand.cardsDealt} tricks accounted for
      </Typography>

      {hand.cardsDealt !== 8 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Trump suit (optional)
          </Typography>
          <ToggleButtonGroup
            exclusive
            value={hand.trump}
            onChange={(_, v) => store.setTrump(hand.index, v)}
            aria-label="Trump suit"
          >
            {SUITS.map((s) => (
              <ToggleButton key={s.value} value={s.value} aria-label={s.value} sx={{ minWidth: 48 }}>
                {s.symbol}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      )}

      <BottomBar ref={nextRef} onBack={onBack} nextLabel="Next" onNext={onNext} nextDisabled={!complete} />
    </>
  )
}

function SummaryPhase({ game, handIndex, onBack, onNext, isLastHand }) {
  const { rows, totals, bonuses } = handSummary(game, handIndex)
  const nextRef = useRef(null)
  useEffect(() => {
    nextRef.current?.focus()
  }, [])

  return (
    <>
      <Typography component="h3" variant="subtitle1">
        Hand {handIndex + 1} summary
      </Typography>
      <Stack spacing={1.5}>
        {rows.map((row) => (
          <Paper key={row.playerId} variant="outlined" sx={{ p: 1.5 }}>
            <Typography variant="subtitle2">{playerName(game, row.playerId)}</Typography>
            <Typography color="text.secondary">
              Bid {row.bid}, took {row.taken} — {OUTCOME_LABEL[row.outcome]} ·{' '}
              {row.points >= 0 ? `+${row.points}` : row.points} points
            </Typography>
            {bonuses[row.playerId] != null && (
              <Typography color={bonuses[row.playerId] > 0 ? 'success.main' : 'error.main'}>
                Promotion! {bonuses[row.playerId] > 0 ? '+10' : '−10'} —{' '}
                {bonuses[row.playerId] > 0 ? '5 made in a row' : '5 missed in a row'}
              </Typography>
            )}
            <Typography variant="body2">Total: {totals[row.playerId]}</Typography>
          </Paper>
        ))}
      </Stack>
      <BottomBar
        ref={nextRef}
        onBack={onBack}
        nextLabel={isLastHand ? 'Finish game' : 'Next hand'}
        onNext={onNext}
      />
    </>
  )
}
