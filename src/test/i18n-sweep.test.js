import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Heuristic stand-in for an i18next-style "no literal strings" ESLint rule
 * (this project hand-rolls its `t()` rather than pulling in react-i18next —
 * see docs/plans/08-internationalization.md). Flags a JSX text node that
 * looks like real English copy (a run of two+ words starting with a letter)
 * sitting directly between tags, outside of a `t(...)` call. Numbers, single
 * symbols (★, ·, →, suit glyphs), and short ALL-CAPS tokens don't count.
 */
const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SCAN_DIRS = ['screens', 'components', 'pwa', 'print']

function jsxFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...jsxFiles(full))
    else if (entry.name.endsWith('.jsx') && !entry.name.endsWith('.test.jsx')) out.push(full)
  }
  return out
}

// A JSX text child: `>` then some non-tag, non-brace text, then `<`.
const TEXT_NODE = />([^<>{}\n]+)</g
// "Looks like English prose": two+ alphabetic words.
const PROSE = /[A-Za-z]{2,}[^A-Za-z]+[A-Za-z]{2,}/

describe('i18n sweep — no hardcoded prose in screens/components', () => {
  const files = SCAN_DIRS.flatMap((d) => jsxFiles(path.join(srcDir, d)))
  expect(files.length).toBeGreaterThan(0)

  for (const file of files) {
    const rel = path.relative(srcDir, file)
    it(`${rel} has no hardcoded prose text nodes`, () => {
      const source = readFileSync(file, 'utf8')
      const offenders = []
      for (const match of source.matchAll(TEXT_NODE)) {
        const text = match[1].trim()
        if (text && PROSE.test(text)) offenders.push(text)
      }
      expect(offenders).toEqual([])
    })
  }
})
