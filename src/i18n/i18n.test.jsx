import { describe, expect, it, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider } from './I18nProvider.jsx'
import { useTranslation } from './useTranslation.js'
import { LOCALES, RESOURCES } from './resources.js'
import { flattenKeys, pluralCategory, translate } from './format.js'
import { detectLocale, loadLocale, saveLocale } from './localePersistence.js'
import { formatOrdinal } from './ordinal.js'

/** A stand-in for a real screen: shows the active locale and a switcher. */
function Probe() {
  const { t, locale, setLocale } = useTranslation()
  return (
    <div>
      <p>{t('home.subtitle')}</p>
      <p data-testid="locale">{locale}</p>
      {LOCALES.map(({ code }) => (
        <button key={code} onClick={() => setLocale(code)}>
          {code}
        </button>
      ))}
    </div>
  )
}

function renderProbe() {
  return render(
    <I18nProvider>
      <Probe />
    </I18nProvider>,
  )
}

function setNavigatorLanguages(languages) {
  Object.defineProperty(window.navigator, 'languages', { value: languages, configurable: true })
}

afterEach(() => {
  // Drop the per-test override so navigator.languages falls back to jsdom's default.
  delete window.navigator.languages
})

describe('locale detection', () => {
  it('defaults to English with no override and no matching browser language', () => {
    setNavigatorLanguages(['fr-FR'])
    expect(detectLocale()).toBe('en')
  })

  it('boots Romanian from navigator.language when there is no stored override', () => {
    setNavigatorLanguages(['ro-RO'])
    expect(detectLocale()).toBe('ro')
  })

  it('a stored override wins over navigator.language', () => {
    setNavigatorLanguages(['ro-RO'])
    saveLocale('en')
    expect(detectLocale()).toBe('en')
    expect(loadLocale()).toBe('en')
  })
})

describe('I18nProvider', () => {
  it('renders English strings by default and sets <html lang>', () => {
    renderProbe()
    expect(screen.getByText('Keep score for a game of Romanian whist.')).toBeInTheDocument()
    expect(screen.getByTestId('locale')).toHaveTextContent('en')
    expect(document.documentElement.lang).toBe('en')
  })

  it('switching language updates visible copy, <html lang>, and persists the choice', async () => {
    const user = userEvent.setup()
    renderProbe()

    await user.click(screen.getByRole('button', { name: 'ro' }))

    expect(screen.getByText('Ține scorul la un joc de whist românesc.')).toBeInTheDocument()
    expect(screen.getByTestId('locale')).toHaveTextContent('ro')
    expect(document.documentElement.lang).toBe('ro')
    expect(loadLocale()).toBe('ro')
  })

  it('restores a saved language on the next mount', () => {
    saveLocale('ro')
    renderProbe()
    expect(screen.getByTestId('locale')).toHaveTextContent('ro')
  })
})

describe('translate()', () => {
  it('falls back to the key itself when nothing matches', () => {
    expect(translate(RESOURCES, 'en', 'en', 'nope.missing')).toBe('nope.missing')
  })

  it('interpolates {{vars}}', () => {
    expect(translate(RESOURCES, 'en', 'en', 'handPlay.handHeader', { n: 3, total: 21 })).toBe(
      'Hand 3 / 21',
    )
  })
})

describe('key parity between locales', () => {
  it('en.json and ro.json declare exactly the same keys', () => {
    const enKeys = flattenKeys(RESOURCES.en).sort()
    const roKeys = flattenKeys(RESOURCES.ro).sort()
    expect(roKeys).toEqual(enKeys)
  })
})

describe('pluralization', () => {
  it('English: singular vs plural', () => {
    expect(pluralCategory('en', 1)).toBe('one')
    expect(pluralCategory('en', 2)).toBe('other')
    expect(pluralCategory('en', 20)).toBe('other')
  })

  it('Romanian: one / few (0, 2-19) / other (20+)', () => {
    expect(pluralCategory('ro', 1)).toBe('one')
    expect(pluralCategory('ro', 2)).toBe('few')
    expect(pluralCategory('ro', 19)).toBe('few')
    expect(pluralCategory('ro', 0)).toBe('few')
    expect(pluralCategory('ro', 20)).toBe('other')
  })

  it('renders the documented Romanian card counts', () => {
    expect(translate(RESOURCES, 'ro', 'en', 'handPlay.cards', { count: 1 })).toBe('1 carte')
    expect(translate(RESOURCES, 'ro', 'en', 'handPlay.cards', { count: 2 })).toBe('2 cărți')
    expect(translate(RESOURCES, 'ro', 'en', 'handPlay.cards', { count: 20 })).toBe('20 de cărți')
  })

  it('applies the same "de" article to the New Game hand count, which is always >= 21', () => {
    expect(
      translate(RESOURCES, 'ro', 'en', 'newGame.handsCount', { count: 21, formula: '9 + 12' }),
    ).toBe('21 de mâini (9 + 12)')
  })
})

describe('rank ordinals', () => {
  it('English uses st/nd/rd/th, including the 11-13 exception', () => {
    expect(formatOrdinal('en', 1)).toBe('1st')
    expect(formatOrdinal('en', 2)).toBe('2nd')
    expect(formatOrdinal('en', 3)).toBe('3rd')
    expect(formatOrdinal('en', 4)).toBe('4th')
    expect(formatOrdinal('en', 11)).toBe('11th')
    expect(formatOrdinal('en', 21)).toBe('21st')
  })

  it('Romanian uses "Locul N"', () => {
    expect(formatOrdinal('ro', 1)).toBe('Locul 1')
    expect(formatOrdinal('ro', 3)).toBe('Locul 3')
  })
})

