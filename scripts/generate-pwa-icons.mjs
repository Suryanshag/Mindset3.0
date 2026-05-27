#!/usr/bin/env node
// Generate PWA icon set from the brand logo.
// Idempotent: re-running overwrites the outputs.
//
// Pipeline:
//   1. Upscale public/images/icons/Logo.png (320x320 source) to a 1024x1024
//      master using sharp's lanczos3 kernel. Master saved alongside source
//      so future runs can skip the upscale (re-runs still regenerate it).
//   2. Generate every PWA icon variant from the 1024 master so all outputs
//      come from the same high-res anchor — avoids compounding upscale
//      artefacts in the smaller sizes.
//
// Outputs:
//   public/images/icons/Logo-1024.png     (1024x1024 master, lanczos3 upscale)
//   public/icons/icon-192.png             (any-purpose, ~80% logo on cream)
//   public/icons/icon-512.png             (any-purpose, ~80% logo on cream)
//   public/icons/icon-maskable-192.png    (maskable, 20% padding each side)
//   public/icons/icon-maskable-512.png    (maskable, 20% padding each side)
//   public/apple-touch-icon.png           (180x180, opaque cream)
//   public/favicon-32.png                 (32x32)
//   public/favicon.ico                    (multi-res 16 + 32)
//
// Usage:  node scripts/generate-pwa-icons.mjs

import sharp from 'sharp'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')

const SOURCE = resolve(REPO_ROOT, 'public/images/icons/Logo.png')
const MASTER = resolve(REPO_ROOT, 'public/images/icons/Logo-1024.png')
const OUT_ICONS = resolve(REPO_ROOT, 'public/icons')
const OUT_APPLE = resolve(REPO_ROOT, 'public/apple-touch-icon.png')
const OUT_FAVICON_32 = resolve(REPO_ROOT, 'public/favicon-32.png')
// Next 16 auto-serves src/app/favicon.ico at /favicon.ico and that file
// takes precedence over public/. Writing here keeps a single source of
// truth and avoids a shadowed-file maintenance trap.
const OUT_FAVICON_ICO = resolve(REPO_ROOT, 'src/app/favicon.ico')

// Brand cream — --color-bg-app, matches manifest theme_color + background_color.
const BG = { r: 247, g: 242, b: 234, alpha: 1 } // #F7F2EA

async function compositeOnBackground({ inputBuffer, size, innerScale }) {
  const innerSize = Math.round(size * innerScale)
  const inner = await sharp(inputBuffer)
    .resize(innerSize, innerSize, {
      fit: 'contain',
      kernel: sharp.kernel.lanczos3,
      background: BG,
    })
    .png()
    .toBuffer()

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: inner, gravity: 'center' }])
    .png({ compressionLevel: 9, palette: false })
    .toBuffer()
}

// Build a multi-resolution ICO (sharp can't write ICO directly).
// Embeds each entry as PNG — supported by every browser since IE11.
function buildIco(entries) {
  const HEADER = 6
  const DIR_ENTRY = 16
  const n = entries.length
  const head = Buffer.alloc(HEADER + DIR_ENTRY * n)

  // ICONDIR
  head.writeUInt16LE(0, 0) // reserved
  head.writeUInt16LE(1, 2) // type = icon
  head.writeUInt16LE(n, 4) // count

  let dataOffset = HEADER + DIR_ENTRY * n
  for (let i = 0; i < n; i++) {
    const { size, png } = entries[i]
    const off = HEADER + DIR_ENTRY * i
    // 0 means 256 in ICO; we never go that big here.
    head.writeUInt8(size, off + 0) // width
    head.writeUInt8(size, off + 1) // height
    head.writeUInt8(0, off + 2)    // palette size (0 = not indexed)
    head.writeUInt8(0, off + 3)    // reserved
    head.writeUInt16LE(1, off + 4) // planes
    head.writeUInt16LE(32, off + 6) // bits per pixel
    head.writeUInt32LE(png.length, off + 8)  // image bytes
    head.writeUInt32LE(dataOffset, off + 12) // file offset
    dataOffset += png.length
  }

  return Buffer.concat([head, ...entries.map((e) => e.png)])
}

async function main() {
  await mkdir(OUT_ICONS, { recursive: true })

  // ── Step 1: upscale source → 1024 master ────────────────────────────
  console.log('Upscaling Logo.png (320) → Logo-1024.png with lanczos3...')
  const masterBuf = await sharp(SOURCE)
    .resize(1024, 1024, {
      kernel: sharp.kernel.lanczos3,
      fit: 'contain',
      background: BG,
    })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer()
  await writeFile(MASTER, masterBuf)
  console.log(`✓ ${MASTER} (${masterBuf.length.toLocaleString()} bytes)`)

  // ── Step 2: any-purpose icons (logo ~80% of canvas, cream bg) ───────
  for (const size of [192, 512]) {
    const buf = await compositeOnBackground({
      inputBuffer: masterBuf,
      size,
      innerScale: 0.8,
    })
    const out = resolve(OUT_ICONS, `icon-${size}.png`)
    await writeFile(out, buf)
    console.log(`✓ ${out} (${buf.length.toLocaleString()} bytes)`)
  }

  // ── Step 3: maskable icons (logo at 60% — 20% safe-area each side) ──
  // Android masks the outer area to a circle/squircle, so the brand must
  // fit inside the central 60% with full bg bleed.
  for (const size of [192, 512]) {
    const buf = await compositeOnBackground({
      inputBuffer: masterBuf,
      size,
      innerScale: 0.6,
    })
    const out = resolve(OUT_ICONS, `icon-maskable-${size}.png`)
    await writeFile(out, buf)
    console.log(`✓ ${out} (${buf.length.toLocaleString()} bytes)`)
  }

  // ── Step 4: apple-touch-icon (180, opaque cream bg) ─────────────────
  const apple = await compositeOnBackground({
    inputBuffer: masterBuf,
    size: 180,
    innerScale: 0.8,
  })
  await writeFile(OUT_APPLE, apple)
  console.log(`✓ ${OUT_APPLE} (${apple.length.toLocaleString()} bytes)`)

  // ── Step 5: favicon-32.png ───────────────────────────────────────────
  // Smaller canvas → brand at 0.85 reads more clearly at browser-tab size.
  const fav32 = await compositeOnBackground({
    inputBuffer: masterBuf,
    size: 32,
    innerScale: 0.85,
  })
  await writeFile(OUT_FAVICON_32, fav32)
  console.log(`✓ ${OUT_FAVICON_32} (${fav32.length.toLocaleString()} bytes)`)

  // ── Step 6: favicon.ico (multi-res 16 + 32) ─────────────────────────
  const fav16 = await compositeOnBackground({
    inputBuffer: masterBuf,
    size: 16,
    innerScale: 0.85,
  })
  const ico = buildIco([
    { size: 16, png: fav16 },
    { size: 32, png: fav32 },
  ])
  await writeFile(OUT_FAVICON_ICO, ico)
  console.log(`✓ ${OUT_FAVICON_ICO} (${ico.length.toLocaleString()} bytes, 16+32)`)

  console.log('\nDone. PWA icon set regenerated from 1024 master.')
}

main().catch((err) => {
  console.error('[generate-pwa-icons] FAILED:', err)
  process.exit(1)
})
