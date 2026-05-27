#!/usr/bin/env node
/**
 * Build-time guard against the timezone-bug pattern that has bitten this
 * codebase three times. Two rules:
 *
 * Rule 1: No raw `.setHours(0,...)` / `.setHours(23,...)` in business logic.
 *   On Vercel (UTC), these compute local-UTC boundaries — but the app is
 *   IST-only. Use src/lib/format-date.ts helpers instead.
 *
 * Rule 2: No date-fns startOf... / endOf... imports in files that also
 *   import from @/lib/prisma. date-fns' local-TZ boundary helpers bleed
 *   into a Prisma `where` clause and shift the cutoff 5h30m. Pure-UI
 *   usages (calendar grids that don't query Prisma) continue to pass.
 *
 * Wired as prebuild — Vercel build fails on violation.
 * Run locally via `npm run lint:tz`.
 */
const { execSync } = require('child_process')

const ALLOWED_FILES = [
  'src/lib/format-date.ts',
  'tests/timezone-boundaries.test.ts',
  'scripts/check-timezone-discipline.js',
]

function isAllowed(grepLine) {
  return ALLOWED_FILES.some((f) => grepLine.startsWith(f + ':'))
}

let found = false

// ─── Rule 1: forbidden .setHours patterns ────────────────────────
const FORBIDDEN = [
  { pattern: '\\.setHours\\(0,', label: 'raw .setHours(0,...) for start-of-day' },
  { pattern: '\\.setHours\\(23,', label: 'raw .setHours(23,...) for end-of-day' },
]

for (const { pattern, label } of FORBIDDEN) {
  let out = ''
  try {
    out = execSync(
      `grep -rnE "${pattern}" src/ --include='*.ts' --include='*.tsx' 2>/dev/null || true`,
      { encoding: 'utf8' }
    )
  } catch {
    out = ''
  }
  const lines = out.split('\n').filter((l) => l && !isAllowed(l))
  if (lines.length) {
    console.error(`\n❌ Timezone discipline violation: ${label}`)
    lines.forEach((l) => console.error(`   ${l}`))
    found = true
  }
}

// ─── Rule 2: date-fns boundary helpers in Prisma-importing files ─
let prismaFiles = []
try {
  const out = execSync(
    `grep -rlE "from ['\\\"]@/lib/prisma['\\\"]" src/ --include='*.ts' --include='*.tsx' 2>/dev/null || true`,
    { encoding: 'utf8' }
  )
  prismaFiles = out.split('\n').filter(Boolean)
} catch {
  prismaFiles = []
}

const offenders = []
for (const f of prismaFiles) {
  if (ALLOWED_FILES.includes(f)) continue
  let importsDateFns = ''
  let usesBoundary = ''
  try {
    importsDateFns = execSync(
      `grep -nE "from ['\\\"]date-fns['\\\"]" "${f}" 2>/dev/null || true`,
      { encoding: 'utf8' }
    ).trim()
    usesBoundary = execSync(
      `grep -nE "(startOf|endOf)(Day|Week|Month)" "${f}" 2>/dev/null || true`,
      { encoding: 'utf8' }
    ).trim()
  } catch {
    /* skip */
  }
  if (importsDateFns && usesBoundary) {
    offenders.push(`${f}`)
  }
}

if (offenders.length > 0) {
  console.error(`\n❌ Timezone discipline violation: date-fns boundary helpers in a Prisma-touching file`)
  offenders.forEach((f) => console.error(`   ${f}`))
  console.error(`\n   These are Bucket-B query boundaries — date-fns startOf*/endOf*`)
  console.error(`   compute local-TZ boundaries, which on Vercel's UTC server shift`)
  console.error(`   the cutoff 5h30m for India users.`)
  console.error(`   Use startOfDayIST / startOfNextDayIST / startOfMonthIST etc`)
  console.error(`   from src/lib/format-date.ts instead.`)
  found = true
}

if (found) {
  console.error(`\nSee src/lib/format-date.ts for IST-aware boundary helpers.`)
  console.error(`If a call site is legitimately UTC, add a brief // UTC: ... comment`)
  console.error(`and either keep it in format-date.ts or add the file to ALLOWED_FILES.`)
  process.exit(1)
}

console.log('✓ Timezone discipline check passed')
