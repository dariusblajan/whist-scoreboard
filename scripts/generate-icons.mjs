// Regenerate the PWA icon set from the app mark.
//
//   node scripts/generate-icons.mjs
//
// Source: src/assets/hero.png (the v1 placeholder mark — there is no dedicated
// logo yet). Outputs land in public/ and are committed. Re-run this whenever the
// mark changes. Requires the `sharp` dev dependency.
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(root, 'src/assets/hero.png')
const OUT = path.join(root, 'public')

// Keep in sync with the manifest `background_color` in vite.config.js.
const BACKGROUND = '#16171d'

/** Plain contain-resize onto a transparent square. */
async function resize(size, file) {
  await sharp(SRC)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(OUT, file))
}

/** Maskable: mark at ~72% inside a solid square so it survives platform masking. */
async function maskable(size, file) {
  const inner = Math.round(size * 0.72)
  const mark = await sharp(SRC)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  await sharp({
    create: { width: size, height: size, channels: 4, background: BACKGROUND },
  })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toFile(path.join(OUT, file))
}

await resize(192, 'pwa-192.png')
await resize(512, 'pwa-512.png')
await resize(180, 'apple-touch-icon.png')
await resize(64, 'favicon.png')
await maskable(512, 'maskable-512.png')

console.log('Icons written to public/')
