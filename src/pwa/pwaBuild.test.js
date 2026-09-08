import { execSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const dist = path.join(root, 'dist')

// The CI pipeline runs `yarn test` before `yarn build`, so produce a build here.
beforeAll(() => {
  if (!existsSync(path.join(dist, 'manifest.webmanifest'))) {
    execSync('yarn build', { cwd: root, stdio: 'inherit' })
  }
}, 180_000)

const readDist = (file) => readFileSync(path.join(dist, file), 'utf8')

describe('PWA build output', () => {
  it('emits a manifest with the required install fields', () => {
    const manifest = JSON.parse(readDist('manifest.webmanifest'))
    expect(manifest.name).toBe('Romanian Whist Scoreboard')
    expect(manifest.short_name).toBe('Whist')
    expect(manifest.display).toBe('standalone')
    expect(manifest.orientation).toBe('portrait')
    expect(manifest.start_url).toBe('/whist-scoreboard/')
    expect(manifest.scope).toBe('/whist-scoreboard/')
    expect(manifest.theme_color).toBeTruthy()
    expect(manifest.background_color).toBeTruthy()
  })

  it('references icons that exist at the declared sizes', async () => {
    const sharp = (await import('sharp')).default
    const manifest = JSON.parse(readDist('manifest.webmanifest'))
    const purposes = manifest.icons.map((i) => i.purpose ?? 'any')
    expect(purposes).toContain('maskable')

    for (const icon of manifest.icons) {
      const file = path.join(dist, icon.src)
      expect(existsSync(file), `${icon.src} missing`).toBe(true)
      const meta = await sharp(file).metadata()
      const [w, h] = icon.sizes.split('x').map(Number)
      expect(meta.width).toBe(w)
      expect(meta.height).toBe(h)
    }
  })

  it('emits a service worker that precaches the shell and falls back to index.html', () => {
    const sw = readDist('sw.js')
    expect(sw.length).toBeGreaterThan(0)
    // Precache manifest is inlined into sw.js and lists the shell entry.
    expect(sw).toMatch(/index\.html/)
    expect(sw).toMatch(/precacheAndRoute/)
    // navigateFallback: 'index.html'
    expect(sw).toMatch(/createHandlerBoundToURL\(["']index\.html["']\)/)
  })

  it('has no external font / CDN / analytics origins in the shipped code', () => {
    const files = [
      'index.html',
      ...readdirSync(path.join(dist, 'assets')).map((f) => `assets/${f}`),
    ]
    const banned =
      /https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|[a-z0-9-]*\.?(cdn|jsdelivr|unpkg|cloudflare|googletagmanager|google-analytics)\b)/i
    for (const file of files) {
      const contents = readDist(file)
      expect(banned.test(contents), `external origin in ${file}`).toBe(false)
    }
  })
})
