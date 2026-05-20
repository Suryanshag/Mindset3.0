#!/usr/bin/env node
// Generate PWA icon set from public/images/icons/Logo.png.
// Idempotent: re-running overwrites the outputs.
//
// Outputs (all written into public/icons/ + public/):
//   /icons/icon-192.png          (any-purpose 192x192)
//   /icons/icon-512.png          (any-purpose 512x512)
//   /icons/icon-maskable-192.png (maskable 192x192, 20% safe-area padding)
//   /icons/icon-maskable-512.png (maskable 512x512, 20% safe-area padding)
//   /apple-touch-icon.png        (Apple A2HS 180x180)
//
// Usage:  node scripts/generate-pwa-icons.mjs

import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')

const SOURCE = resolve(REPO_ROOT, 'public/images/icons/Logo.png')
const OUT_ICONS = resolve(REPO_ROOT, 'public/icons')
const OUT_APPLE = resolve(REPO_ROOT, 'public/apple-touch-icon.png')

// Brand cream — used as the safe-area background for maskable icons and as
// the bleed background for Apple's A2HS icon (Apple ignores transparency on
// the home-screen, so an opaque background prevents the black-on-tap fallback).
const BG = { r: 247, g: 242, b: 234, alpha: 1 } // #F7F2EA, --color-bg-app

async function compositeOnBackground({ inputPath, size, innerScale }) {
  const innerSize = Math.round(size * innerScale)
  const inner = await sharp(inputPath)
    .resize(innerSize, innerSize, { fit: 'contain', background: BG })
    .png()
    .toBuffer()

  // Center inner on a `size`x`size` canvas filled with BG.
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .composite([
      {
        input: inner,
        gravity: 'center',
      },
    ])
    .png({ compressionLevel: 9, palette: false })
    .toBuffer()
}

async function main() {
  await mkdir(OUT_ICONS, { recursive: true })

  // any-purpose icons: brand fills the canvas (no safe-area padding required).
  for (const size of [192, 512]) {
    const buf = await compositeOnBackground({
      inputPath: SOURCE,
      size,
      innerScale: 1.0,
    })
    const out = resolve(OUT_ICONS, `icon-${size}.png`)
    await writeFile(out, buf)
    console.log(`✓ ${out} (${buf.length.toLocaleString()} bytes)`)
  }

  // maskable icons: Android crops to a circle/squircle that consumes the outer
  // 20% of the canvas. Brand must fit inside the central 80%. We render the
  // brand at 78% to leave a 1% breathing margin on the visible disc edge.
  for (const size of [192, 512]) {
    const buf = await compositeOnBackground({
      inputPath: SOURCE,
      size,
      innerScale: 0.78,
    })
    const out = resolve(OUT_ICONS, `icon-maskable-${size}.png`)
    await writeFile(out, buf)
    console.log(`✓ ${out} (${buf.length.toLocaleString()} bytes)`)
  }

  // Apple touch icon — 180x180, opaque background (Apple doesn't render
  // transparent home-screen icons cleanly), brand fills the canvas.
  const apple = await compositeOnBackground({
    inputPath: SOURCE,
    size: 180,
    innerScale: 1.0,
  })
  await writeFile(OUT_APPLE, apple)
  console.log(`✓ ${OUT_APPLE} (${apple.length.toLocaleString()} bytes)`)

  console.log('\nDone. Five PWA icon variants generated.')
}

main().catch((err) => {
  console.error('[generate-pwa-icons] FAILED:', err)
  process.exit(1)
})
