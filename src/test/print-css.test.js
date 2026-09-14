import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// vitest.config.js sets `css: false`, so imported stylesheets never reach
// jsdom — read the raw source instead. Pagination itself can't be verified
// here; see the plan's manual Chrome/iOS Safari checklist for that.
const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const indexCss = readFileSync(path.join(srcDir, 'index.css'), 'utf8')
const printSheetCss = readFileSync(
  path.join(srcDir, 'screens/PrintScoreboard/print.css'),
  'utf8',
)

describe('app-wide print stylesheet', () => {
  it('has an @media print block', () => {
    expect(indexCss).toMatch(/@media print/)
  })

  it('targets the chrome-hiding selector used by AppBar and BottomBar', () => {
    expect(indexCss).toMatch(/\.no-print\s*{[^}]*display:\s*none/)
  })

  it('avoids splitting a table row across a page break', () => {
    expect(indexCss).toMatch(/break-inside:\s*avoid/)
  })
})

describe('print-sheet stylesheet', () => {
  it('repeats the table header on every printed page', () => {
    expect(printSheetCss).toMatch(/thead\s*{[^}]*display:\s*table-header-group/)
  })

  it('hides the on-screen toolbar when printing', () => {
    const printBlock = printSheetCss.slice(printSheetCss.indexOf('@media print'))
    expect(printBlock).toMatch(/\.print-sheet__toolbar\s*{\s*display:\s*none/)
  })
})
