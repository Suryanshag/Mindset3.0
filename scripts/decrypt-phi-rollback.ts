// PHI encryption ROLLBACK — pair of scripts/encrypt-phi-backfill.ts.
// Decrypts every *Encrypted column and writes the plaintext back into the
// original column. Only needed if encryption breaks something during rollout
// and we need to revert to reading plaintext.
//
// This script does NOT null out the *Encrypted columns — that way you can
// run the backfill again later without losing anything.
//
// Usage:
//   set -a && source .env.local && set +a && npx tsx scripts/decrypt-phi-rollback.ts
//
// Flags:
//   --dry-run   Print what would change without writing.
//   --confirm   Required to actually run (safety belt; rollback is rare).

import { prisma } from '@/lib/prisma'
import { decryptField, isEncrypted } from '@/lib/encryption'

const DRY_RUN = process.argv.includes('--dry-run')
const CONFIRMED = process.argv.includes('--confirm')

if (!DRY_RUN && !CONFIRMED) {
  console.error(
    '⚠️  Refusing to run without --confirm. Rollback is a rare operation;\n' +
      '    pass --dry-run to preview or --confirm to execute.'
  )
  process.exit(1)
}

type Counts = { scanned: number; decrypted: number; skipped: number }

function newCounts(): Counts {
  return { scanned: 0, decrypted: 0, skipped: 0 }
}

function summarize(label: string, c: Counts) {
  console.log(
    `  ${label.padEnd(36)} scanned=${c.scanned}  decrypted=${c.decrypted}  skipped=${c.skipped}`
  )
}

async function rollbackJournalEntry() {
  const c = newCounts()
  const rows = await prisma.journalEntry.findMany({
    where: { OR: [{ bodyEncrypted: { not: null } }, { titleEncrypted: { not: null } }] },
    select: { id: true, body: true, title: true, bodyEncrypted: true, titleEncrypted: true },
  })

  for (const row of rows) {
    c.scanned += 1
    const data: { body?: string; title?: string | null } = {}
    if (isEncrypted(row.bodyEncrypted)) {
      const plain = decryptField(row.bodyEncrypted)
      if (plain !== null && plain !== row.body) data.body = plain
    }
    if (isEncrypted(row.titleEncrypted)) {
      const plain = decryptField(row.titleEncrypted)
      if (plain !== row.title) data.title = plain
    }
    if (Object.keys(data).length === 0) {
      c.skipped += 1
      continue
    }
    if (!DRY_RUN) await prisma.journalEntry.update({ where: { id: row.id }, data })
    c.decrypted += 1
  }
  summarize('JournalEntry (body+title)', c)
}

async function rollbackSession() {
  const c = newCounts()
  const rows = await prisma.session.findMany({
    where: {
      OR: [
        { notesEncrypted: { not: null } },
        { userNotesEncrypted: { not: null } },
        { cancellationReasonEncrypted: { not: null } },
      ],
    },
    select: {
      id: true,
      notes: true,
      userNotes: true,
      cancellationReason: true,
      notesEncrypted: true,
      userNotesEncrypted: true,
      cancellationReasonEncrypted: true,
    },
  })

  for (const row of rows) {
    c.scanned += 1
    const data: {
      notes?: string | null
      userNotes?: string | null
      cancellationReason?: string | null
    } = {}
    if (isEncrypted(row.notesEncrypted)) {
      const plain = decryptField(row.notesEncrypted)
      if (plain !== row.notes) data.notes = plain
    }
    if (isEncrypted(row.userNotesEncrypted)) {
      const plain = decryptField(row.userNotesEncrypted)
      if (plain !== row.userNotes) data.userNotes = plain
    }
    if (isEncrypted(row.cancellationReasonEncrypted)) {
      const plain = decryptField(row.cancellationReasonEncrypted)
      if (plain !== row.cancellationReason) data.cancellationReason = plain
    }
    if (Object.keys(data).length === 0) {
      c.skipped += 1
      continue
    }
    if (!DRY_RUN) await prisma.session.update({ where: { id: row.id }, data })
    c.decrypted += 1
  }
  summarize('Session (notes+userNotes+cancel)', c)
}

async function rollbackAssignment() {
  const c = newCounts()
  const rows = await prisma.assignment.findMany({
    where: {
      OR: [
        { descriptionEncrypted: { not: null } },
        { instructionsEncrypted: { not: null } },
        { reviewNoteEncrypted: { not: null } },
      ],
    },
    select: {
      id: true,
      description: true,
      instructions: true,
      reviewNote: true,
      descriptionEncrypted: true,
      instructionsEncrypted: true,
      reviewNoteEncrypted: true,
    },
  })

  for (const row of rows) {
    c.scanned += 1
    const data: {
      description?: string | null
      instructions?: string
      reviewNote?: string | null
    } = {}
    if (isEncrypted(row.descriptionEncrypted)) {
      const plain = decryptField(row.descriptionEncrypted)
      if (plain !== row.description) data.description = plain
    }
    if (isEncrypted(row.instructionsEncrypted)) {
      const plain = decryptField(row.instructionsEncrypted)
      if (plain !== null && plain !== row.instructions) data.instructions = plain
    }
    if (isEncrypted(row.reviewNoteEncrypted)) {
      const plain = decryptField(row.reviewNoteEncrypted)
      if (plain !== row.reviewNote) data.reviewNote = plain
    }
    if (Object.keys(data).length === 0) {
      c.skipped += 1
      continue
    }
    if (!DRY_RUN) await prisma.assignment.update({ where: { id: row.id }, data })
    c.decrypted += 1
  }
  summarize('Assignment (desc+instr+review)', c)
}

async function rollbackAssignmentResponse() {
  const c = newCounts()
  const rows = await prisma.assignmentResponse.findMany({
    where: { responseTextEncrypted: { not: null } },
    select: { id: true, responseText: true, responseTextEncrypted: true },
  })

  for (const row of rows) {
    c.scanned += 1
    if (!isEncrypted(row.responseTextEncrypted)) {
      c.skipped += 1
      continue
    }
    const plain = decryptField(row.responseTextEncrypted)
    if (plain === row.responseText) {
      c.skipped += 1
      continue
    }
    if (!DRY_RUN) {
      await prisma.assignmentResponse.update({
        where: { id: row.id },
        data: { responseText: plain },
      })
    }
    c.decrypted += 1
  }
  summarize('AssignmentResponse (responseText)', c)
}

async function rollbackMoodCheckIn() {
  const c = newCounts()
  const rows = await prisma.moodCheckIn.findMany({
    where: { noteEncrypted: { not: null } },
    select: { id: true, note: true, noteEncrypted: true },
  })

  for (const row of rows) {
    c.scanned += 1
    if (!isEncrypted(row.noteEncrypted)) {
      c.skipped += 1
      continue
    }
    const plain = decryptField(row.noteEncrypted)
    if (plain === row.note) {
      c.skipped += 1
      continue
    }
    if (!DRY_RUN) {
      await prisma.moodCheckIn.update({ where: { id: row.id }, data: { note: plain } })
    }
    c.decrypted += 1
  }
  summarize('MoodCheckIn (note)', c)
}

async function rollbackSessionFollowup() {
  const c = newCounts()
  const rows = await prisma.sessionFollowup.findMany({
    where: { homeworkNoteEncrypted: { not: null } },
    select: { id: true, homeworkNote: true, homeworkNoteEncrypted: true },
  })

  for (const row of rows) {
    c.scanned += 1
    if (!isEncrypted(row.homeworkNoteEncrypted)) {
      c.skipped += 1
      continue
    }
    const plain = decryptField(row.homeworkNoteEncrypted)
    if (plain === row.homeworkNote) {
      c.skipped += 1
      continue
    }
    if (!DRY_RUN) {
      await prisma.sessionFollowup.update({
        where: { id: row.id },
        data: { homeworkNote: plain },
      })
    }
    c.decrypted += 1
  }
  summarize('SessionFollowup (homeworkNote)', c)
}

async function main() {
  console.log(`⚠️  PHI ROLLBACK${DRY_RUN ? ' (DRY RUN)' : ''} — decrypting *Encrypted back to plaintext`)
  console.log('')

  await rollbackJournalEntry()
  await rollbackSession()
  await rollbackAssignment()
  await rollbackAssignmentResponse()
  await rollbackMoodCheckIn()
  await rollbackSessionFollowup()

  console.log('')
  if (DRY_RUN) {
    console.log('✅ Dry run complete — no writes performed')
  } else {
    console.log('✅ Rollback complete — plaintext columns are once again authoritative')
    console.log('   *Encrypted columns are intentionally kept; safe to re-run the backfill later.')
  }
}

main()
  .catch((err) => {
    console.error('❌ Rollback failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
