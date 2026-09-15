import { useMemo } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useGameStore } from '../../state/useGameStore.js'
import { printSheetModel } from '../../print/printSheetModel.js'
import { useTranslation } from '../../i18n/useTranslation.js'
import { INTL_TAG } from '../../i18n/resources.js'
import './print.css'

const VARIANTS = ['short', 'long']

/** `?players=4&variant=short&promotions=0` → a blank-sheet config, or null if invalid. */
function configFromParams(params) {
  const playerCount = Number(params.get('players'))
  const variant = params.get('variant')
  if (!Number.isInteger(playerCount) || playerCount < 3 || playerCount > 6) return null
  if (!VARIANTS.includes(variant)) return null
  return { playerCount, variant, promotions: params.get('promotions') === '1' }
}

/**
 * Printer-friendly score sheet: a valid `?players=&variant=&promotions=`
 * query string always wins and renders a blank sheet — this is how the
 * NewGame wizard previews a paper sheet for its current selections without
 * ever reading (or being confused by) whatever game happens to be in the
 * store. Only without those params do we fall back to the active or last
 * finished game. No app chrome — this route sits outside `AppLayout` so the
 * browser's Print dialog only ever sees the sheet itself.
 */
export function PrintScoreboard() {
  const { t, locale } = useTranslation()
  const { game } = useGameStore()
  const [searchParams] = useSearchParams()

  const model = useMemo(() => {
    const config = configFromParams(searchParams)
    if (config) {
      return printSheetModel({
        config: { ...config, playerLabel: (n) => t('newGame.playerLabel', { n }) },
      })
    }
    return game ? printSheetModel({ game }) : null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, searchParams, locale])

  if (!model) return <Navigate to="/" replace />

  const { meta, players, rows, totals, standings } = model
  const condensed = players.length >= 6
  const date = new Intl.DateTimeFormat(INTL_TAG[locale]).format(new Date())

  return (
    <div className={condensed ? 'print-sheet print-sheet--condensed' : 'print-sheet'}>
      <div className="print-sheet__toolbar">
        <button type="button" onClick={() => window.print()}>
          {t('print.printSave')}
        </button>
      </div>

      <h1 className="print-sheet__title">{t('print.title')}</h1>
      <p className="print-sheet__meta">
        {t('print.meta', {
          date,
          variant: meta.variant === 'short' ? t('print.variantShort') : t('print.variantLong'),
          count: meta.playerCount,
          state: meta.promotions ? t('common.on') : t('common.off'),
        })}
      </p>

      <table className="print-sheet__table" aria-label={t('print.tableAria')}>
        <thead>
          <tr>
            <th scope="col">{t('print.handHeader')}</th>
            <th scope="col">{t('print.cardsHeader')}</th>
            <th scope="col">{t('print.dealerHeader')}</th>
            {players.map((p) => (
              <th key={p.id} scope="col" colSpan={2}>
                {p.name}
              </th>
            ))}
          </tr>
          <tr>
            <th scope="col" aria-hidden="true" />
            <th scope="col" aria-hidden="true" />
            <th scope="col" aria-hidden="true" />
            {players.map((p) => [
              <th key={`${p.id}-bid`} scope="col">
                {t('print.bidHeader')}
              </th>,
              <th key={`${p.id}-score`} scope="col">
                {t('print.scoreHeader')}
              </th>,
            ])}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.handIndex} className={row.separator ? 'print-sheet__separator' : undefined}>
              <td>{row.handIndex + 1}</td>
              <td>{row.cardsDealt}</td>
              <td>{row.dealerName}</td>
              {players.map((p) => {
                const cell = row.cells[p.id]
                return [
                  <td key={`${p.id}-bid`}>{cell.bid ?? ''}</td>,
                  <td key={`${p.id}-score`}>
                    {cell.cumulative ?? ''}
                    {cell.bonus != null ? ` ${cell.bonus > 0 ? '+10' : '−10'}` : ''}
                  </td>,
                ]
              })}
            </tr>
          ))}
        </tbody>

        {totals && (
          <tfoot>
            <tr>
              <td colSpan={3}>{t('print.totalRow')}</td>
              {players.map((p) => (
                <td key={p.id} colSpan={2}>
                  {totals[p.id]}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>

      {standings && (
        <div className="print-sheet__standings">
          <h2>{t('print.finalStandings')}</h2>
          <ol>
            {[...standings]
              .sort((a, b) => a.rank - b.rank)
              .map((s) => (
                <li key={s.playerId}>
                  {t('print.standingLine', {
                    rank: s.rank,
                    name: players.find((p) => p.id === s.playerId)?.name,
                    total: s.total,
                  })}
                </li>
              ))}
          </ol>
        </div>
      )}
    </div>
  )
}
