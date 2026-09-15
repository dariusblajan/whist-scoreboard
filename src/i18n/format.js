/**
 * Minimal, dependency-free i18n core: dot-path lookup, `{{var}}` interpolation,
 * and a small pluralization rule per locale. Kept as a hand-rolled module (not
 * i18next) to avoid shipping a runtime library for two locales and ~70 keys —
 * the `t(key, vars)` call sites are the same shape either way, so swapping in
 * a library later needs no call-site changes.
 * @module i18n/format
 */

/** English: singular vs everything else. Romanian: 1 → one; 0 and 1–19 (mod
 * 100) → few; otherwise → many/other. Matches "1 carte" / "2 cărți" / "20 de
 * cărți". */
export function pluralCategory(locale, count) {
  const n = Math.abs(Number(count))
  if (locale === 'ro') {
    if (n === 1) return 'one'
    const mod100 = n % 100
    if (n === 0 || (mod100 >= 1 && mod100 <= 19)) return 'few'
    return 'other'
  }
  return n === 1 ? 'one' : 'other'
}

function lookup(resource, dottedKey) {
  let node = resource
  for (const part of dottedKey.split('.')) {
    if (node == null || typeof node !== 'object') return undefined
    node = node[part]
  }
  return typeof node === 'string' ? node : undefined
}

function interpolate(template, vars) {
  if (!vars) return template
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  )
}

/**
 * Resolve `key` against `resources[locale]`, falling back to
 * `resources[fallbackLocale]`, then to the key itself so a missing
 * translation is visible rather than silently blank.
 *
 * When `vars.count` is a number, `key` is first tried with a `_one` / `_few` /
 * `_other` suffix chosen by {@link pluralCategory}, falling back to the bare
 * key if no pluralized variant exists.
 */
export function translate(resources, locale, fallbackLocale, key, vars) {
  const candidates = []
  if (vars && typeof vars.count === 'number') {
    const category = pluralCategory(locale, vars.count)
    candidates.push(`${key}_${category}`)
    if (category !== 'other') candidates.push(`${key}_other`)
  }
  candidates.push(key)

  for (const locale_ of [locale, fallbackLocale]) {
    const resource = resources[locale_]
    if (!resource) continue
    for (const candidate of candidates) {
      const template = lookup(resource, candidate)
      if (template != null) return interpolate(template, vars)
    }
  }
  return key
}

/** All keys in `resource`, flattened to dotted paths — for key-parity checks. */
export function flattenKeys(resource, prefix = '') {
  const keys = []
  for (const [k, v] of Object.entries(resource)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v != null && typeof v === 'object') keys.push(...flattenKeys(v, path))
    else keys.push(path)
  }
  return keys
}
