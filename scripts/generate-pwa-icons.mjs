#!/usr/bin/env node
// Generate PWA icon set from public/images/icons/Logo-1024.png.
// Idempotent: re-running overwrites the outputs.
//
// v2 (2026-05-28): switched to direct-resize mode. Source is now a
// 1024x1024 PNG with its own dark background baked in — no compositing
// layer, no cream padding, no inner-scale shrink. Every variant is a
// straight lanczos3 downscale so the artwork lives edge-to-edge.
//
// To swap the source, replace public/images/icons/Logo-1024.png with a
// new 1024x1024 PNG and re-run.
//
// Outputs:
//   public/icons/icon-192.png             (any-purpose 192x192)
//   public/icons/icon-512.png             (any-purpose 512x512)
//   public/icons/icon-maskable-192.png    (maskable; outer 40% may be
//                                          cropped by Android's adaptive
//                                          mask, which just trims more
//                                          of the dark background)
//   public/icons/icon-maskable-512.png    (maskable 512x512)
//   public/apple-touch-icon.png           (180x180)
//   public/favicon-32.png                 (32x32)
//   src/app/favicon.ico                   (multi-res 16 + 32)
//
// Usage:  node scripts/generate-pwa-icons.mjs

import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')

const MASTER = resolve(REPO_ROOT, 'public/images/icons/Logo-1024.png')
const OUT_ICONS = resolve(REPO_ROOT, 'public/icons')
const OUT_APPLE = resolve(REPO_ROOT, 'public/apple-touch-icon.png')
const OUT_FAVICON_32 = resolve(REPO_ROOT, 'public/favicon-32.png')
// Next 16 auto-serves src/app/favicon.ico at /favicon.ico and that file
// takes precedence over public/. Writing here keeps a single source of
// truth and avoids a shadowed-file maintenance trap.
const OUT_FAVICON_ICO = resolve(REPO_ROOT, 'src/app/favicon.ico')

const MIN_BYTES = 5 * 1024
const MAX_BYTES = 200 * 1024

// Quantized PNG (pngquant-style) keeps icon-512 under the 200KB ceiling.
// AI-generated source has fine noise that won't deflate with plain compression-9.
// quality:90 + colors:256 keeps the dark background and brain artwork visually
// indistinguishable from RGB output while shrinking ~80%.
async function downscale(size) {
  return sharp(MASTER)
    .resize(size, size, {
      kernel: sharp.kernel.lanczos3,
      fit: 'cover',
    })
    .png({
      compressionLevel: 9,
      palette: true,
      quality: 90,
      colors: 256,
      effort: 10,
    })
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

// The <5KB floor only signals "generation failed" for the larger PWA
// icons (>=180px). A 32x32 PNG is naturally ~1-2KB no matter how busy
// the source — applying the floor there false-positives every time.
function checkSize(path, size, bytes) {
  if (size >= 180 && bytes < MIN_BYTES) {
    throw new Error(`${path} is ${bytes} bytes (<5KB) — likely a generation failure`)
  }
  if (bytes > MAX_BYTES) {
    throw new Error(`${path} is ${bytes} bytes (>200KB) — compression failed`)
  }
}

async function main() {
  await mkdir(OUT_ICONS, { recursive: true })

  const targets = [
    { size: 192, path: resolve(OUT_ICONS, 'icon-192.png') },
    { size: 512, path: resolve(OUT_ICONS, 'icon-512.png') },
    { size: 192, path: resolve(OUT_ICONS, 'icon-maskable-192.png') },
    { size: 512, path: resolve(OUT_ICONS, 'icon-maskable-512.png') },
    { size: 180, path: OUT_APPLE },
    { size: 32, path: OUT_FAVICON_32 },
  ]

  for (const { size, path } of targets) {
    const buf = await downscale(size)
    await writeFile(path, buf)
    checkSize(path, size, buf.length)
    console.log(`✓ ${path} (${buf.length.toLocaleString()} bytes)`)
  }

  // Multi-res favicon.ico — 16 + 32 PNGs packed into an ICO container.
  const fav16 = await downscale(16)
  const fav32 = await downscale(32)
  const ico = buildIco([
    { size: 16, png: fav16 },
    { size: 32, png: fav32 },
  ])
  await writeFile(OUT_FAVICON_ICO, ico)
  // favicon.ico is naturally small (a few KB) — the >5KB floor doesn't
  // apply to a tiny 16+32 container. Just guard the upper bound.
  if (ico.length > MAX_BYTES) {
    throw new Error(`${OUT_FAVICON_ICO} is ${ico.length} bytes — compression failed`)
  }
  console.log(`✓ ${OUT_FAVICON_ICO} (${ico.length.toLocaleString()} bytes, 16+32)`)

  console.log('\nDone. PWA icon set regenerated from Logo-1024 master.')
}

main().catch((err) => {
  console.error('[generate-pwa-icons] FAILED:', err)
  process.exit(1)
})
