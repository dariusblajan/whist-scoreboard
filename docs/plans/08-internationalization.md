# Iteration 08 — Internationalization (M7)

> **Status: IMPLEMENTED** (2026-09-15). Every screen/component now reads
> through `t()`; see "Implementation notes" at the bottom for where this
> diverged from the original approach.

## Goal

Make every user-facing string translatable and ship **English (default) +
Romanian**. No other languages in this pass, but the setup must make adding one
later a data-only change (one JSON file + one line in the locale list).

Rationale: the game is Romanian; many players are more comfortable in Romanian
than English.

## Scope

- **In:** all visible UI copy — screens, buttons, dialogs, helper/error text,
  the promotions explanation, per-hand summary phrasing, ARIA labels,
  `document.title` / PWA `manifest` name+description, date/number formatting.
- **In:** language switcher on Home (and honoured on first load from
  `navigator.language`, persisted to `localStorage`).
- **Out (this pass):** RTL layout, pluralization rules beyond en/ro, translating
  `docs/`, locale-specific game-rule variants.

## Approach

- Library: `react-i18next` + `i18next` (small, offline, no network backend).
  Alternative if bundle size bites: a hand-rolled `t()` over a context — decide
  at impl, but keep the `t('key')` call sites identical so it's swappable.
- **No runtime fetch.** Bundle locale JSON directly (`import`), or code-split
  per-locale with a static `import()` that the service worker precaches. Verify
  the offline audit (iter 05) still passes: zero network calls.
- Keys namespaced by screen: `home.*`, `newGame.*`, `handPlay.*`,
  `scoreboard.*`, `gameOver.*`, `print.*`, `common.*`.
- Interpolation for counts/names: `t('handPlay.header', { n, total })`.
  Use i18next plurals for the few count strings ("1 card" / "N cards" —
  Romanian has a distinct few/many form).
- Formatting: `Intl.NumberFormat` / `Intl.DateTimeFormat` with the active
  locale for the print sheet date and any numbers.

## Tasks

1. `src/i18n/` — init, locale list (`en`, `ro`), detector (stored override →
   `navigator.language` → `en`), `LanguageProvider`.
2. `src/i18n/locales/en.json`, `src/i18n/locales/ro.json` — full key set.
3. Sweep every screen/component: replace literal strings with `t()` calls;
   move the promotions explanation, forbidden-bid helper, confirm-dialog copy,
   and summary phrasing into keys. Add an ESLint guard (e.g.
   `i18next/no-literal-string`) scoped to `src/screens` + `src/components`.
4. Language switcher UI on Home; wire to the provider; persist to
   `whist:lang:v1`.
5. Localize `document.title` and inject a localized `manifest` name/description
   (two static manifests, or `lang`-suffixed — keep it simple: English manifest,
   localized `<title>` and in-app text is enough for v1).
6. Romanian translation pass — get the whist terms right: *mână* (hand),
   *levată* (trick), *pariu*/*licitație* (bid), *atu* (trump), *fără atu*
   (no-trump), *împărțitor* (dealer), *promovare* (promotion).
7. Print sheet (iter 07) + all `aria-label`s go through `t()` too.

## Tests

- **i18n init** — default locale is `en`; `navigator.language = 'ro-RO'` with no
  stored override boots `ro`; a stored override wins over `navigator.language`.
- **Switcher** — changing language updates visible copy (assert a known string
  in both locales) and writes `whist:lang:v1`; restored on reload.
- **Key parity** — a test asserts `en.json` and `ro.json` have identical key
  sets (no missing / no orphan translations).
- **No literal strings** — the ESLint rule runs in `yarn lint`; CI fails on a
  hardcoded string in `src/screens`.
- **Plurals** — `ro` "1 carte" / "2 cărți" / "20 de cărți" render via the
  plural keys.
- **Offline audit still green** — no network request added (extend the iter 05
  external-URL grep test to the i18n chunks).
- **axe** — re-run the iter 06 axe checks with `lang="ro"` set on `<html>`.

## Acceptance checklist

- [x] Every visible string comes from a locale file; a vitest sweep blocks new
      hardcoded JSX text (see Implementation notes — not wired into `yarn lint`).
- [x] Full English and Romanian translations; key sets match exactly.
- [x] Language switcher on Home; auto-detects from browser on first run;
      persisted; `<html lang>` updated.
- [x] Romanian uses correct whist terminology.
- [x] Counts pluralize correctly in Romanian.
- [x] No new runtime network calls; offline audit passes.
- [x] Print sheet and ARIA labels localized.
- [x] `yarn test` green, `yarn lint` clean, `yarn build` ok.

## Implementation notes

- **Hand-rolled `t()`, not react-i18next.** `src/i18n/format.js` is a ~70-line
  dot-path lookup + `{{var}}` interpolation + `_one`/`_few`/`_other` plural
  suffixes — small enough that pulling in a runtime library for two locales
  and ~90 keys wasn't worth it. `useTranslation()` returns `{ t, locale,
  setLocale }`, the same call-site shape the plan asked for, so swapping in a
  library later is a provider-only change.
- **No `i18next/no-literal-string` ESLint rule** (it's react-i18next-specific
  and there's no i18next here). `src/test/i18n-sweep.test.js` is the
  substitute: it scans every `.jsx` file under `src/screens`, `src/
  components`, `src/pwa`, and `src/print` for a JSX text node that looks like
  English prose (two+ words) sitting outside a `t()` call, and fails per-file
  if it finds one. It runs under `yarn test`, not `yarn lint` — it's a
  vitest test, not an ESLint rule, and only catches JSX text nodes (not
  template literals in plain `.js`, which is how `printSheetModel.js`'s
  blank-sheet player names slipped past it until caught by review; fixed by
  having the model accept a `playerLabel(seat)` callback the screen fills in
  with `t()`).
- **Manifest left in English** (`vite.config.js`), per the plan's "keep it
  simple" carve-out — only `document.title` and `<html lang>` update live via
  `I18nProvider`.
- **Rank ordinals and dates are locale functions, not JSON strings**
  (`src/i18n/ordinal.js`; `Intl.DateTimeFormat` on the print sheet) since
  their shape differs by locale ("1st" vs "Locul 1"), not just their words.
