// PHI encryption backfill — reads plaintext from each PHI field and writes
// the AES-256-GCM ciphertext into the matching *Encrypted column. Safe to
// re-run: every step skips rows that are already encrypted (or where the
// source field is null/empty).
//
// Originals are NOT modified — the dual-write window lets us roll back via
// scripts/decrypt-phi-rollback.ts if anything goes wrong.
//
// Usage:
//   set -a && source .env.local && set +a && npx tsx scripts/encrypt-phi-backfill.ts
//
// Optional flags:
//   --dry-run   Print counts and a sample plan; do not write.

import { prisma } from '@/lib/prisma'
import { encryptField } from '@/lib/encryption'

const DRY_RUN = process.argv.includes('--dry-run')

type Counts = { scanned: number; encrypted: number; skipped: number }

function newCounts(): Counts {
  return { scanned: 0, encrypted: 0, skipped: 0 }
}

function summarize(label: string, c: Counts) {
  console.log(
    `  ${label.padEnd(36)} scanned=${c.scanned}  encrypted=${c.encrypted}  skipped=${c.skipped}`
  )
}

async function backfillJournalEntry() {
  const c = newCounts()
  const rows = await prisma.journalEntry.findMany({
    where: {
      OR: [
        { bodyEncrypted: null, body: { not: '' } },
        { titleEncrypted: null, title: { not: null } },
      ],
    },
    select: { id: true, title: true, body: true, titleEncrypted: true, bodyEncrypted: true },
  })

  for (const row of rows) {
    c.scanned += 1
    const data: { titleEncrypted?: string | null; bodyEncrypted?: string | null } = {}
    if (!row.titleEncrypted && row.title) data.titleEncrypted = encryptField(row.title)
    if (!row.bodyEncrypted && row.body) data.bodyEncrypted = encryptField(row.body)
    if (Object.keys(data).length === 0) {
      c.skipped += 1
      continue
    }
    if (!DRY_RUN) {
      await prisma.journalEntry.update({ where: { id: row.id }, data })
    }
    c.encrypted += 1
  }
  summarize('JournalEntry (body+title)', c)
}

async function backfillSession() {
  const c = newCounts()
  const rows = await prisma.session.findMany({
    where: {
      OR: [
        { notesEncrypted: null, notes: { not: null } },
        { userNotesEncrypted: null, userNotes: { not: null } },
        { cancellationReasonEncrypted: null, cancellationReason: { not: null } },
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
      notesEncrypted?: string | null
      userNotesEncrypted?: string | null
      cancellationReasonEncrypted?: string | null
    } = {}
    if (!row.notesEncrypted && row.notes) data.notesEncrypted = encryptField(row.notes)
    if (!row.userNotesEncrypted && row.userNotes) data.userNotesEncrypted = encryptField(row.userNotes)
    if (!row.cancellationReasonEncrypted && row.cancellationReason)
      data.cancellationReasonEncrypted = encryptField(row.cancellationReason)
    if (Object.keys(data).length === 0) {
      c.skipped += 1
      continue
    }
    if (!DRY_RUN) {
      await prisma.session.update({ where: { id: row.id }, data })
    }
    c.encrypted += 1
  }
  summarize('Session (notes+userNotes+cancel)', c)
}

async function backfillAssignment() {
  const c = newCounts()
  const rows = await prisma.assignment.findMany({
    where: {
      OR: [
        { descriptionEncrypted: null, description: { not: null } },
        // instructions defaults to '' in schema — only encrypt non-empty
        { instructionsEncrypted: null, instructions: { not: '' } },
        { reviewNoteEncrypted: null, reviewNote: { not: null } },
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
      descriptionEncrypted?: string | null
      instructionsEncrypted?: string | null
      reviewNoteEncrypted?: string | null
    } = {}
    if (!row.descriptionEncrypted && row.description) data.descriptionEncrypted = encryptField(row.description)
    if (!row.instructionsEncrypted && row.instructions) data.instructionsEncrypted = encryptField(row.instructions)
    if (!row.reviewNoteEncrypted && row.reviewNote) data.reviewNoteEncrypted = encryptField(row.reviewNote)
    if (Object.keys(data).length === 0) {
      c.skipped += 1
      continue
    }
    if (!DRY_RUN) {
      await prisma.assignment.update({ where: { id: row.id }, data })
    }
    c.encrypted += 1
  }
  summarize('Assignment (desc+instr+review)', c)
}

async function backfillAssignmentResponse() {
  const c = newCounts()
  const rows = await prisma.assignmentResponse.findMany({
    where: { responseTextEncrypted: null, responseText: { not: null } },
    select: { id: true, responseText: true },
  })

  for (const row of rows) {
    c.scanned += 1
    if (!row.responseText) {
      c.skipped += 1
      continue
    }
    if (!DRY_RUN) {
      await prisma.assignmentResponse.update({
        where: { id: row.id },
        data: { responseTextEncrypted: encryptField(row.responseText) },
      })
    }
    c.encrypted += 1
  }
  summarize('AssignmentResponse (responseText)', c)
}

async function backfillMoodCheckIn() {
  const c = newCounts()
  const rows = await prisma.moodCheckIn.findMany({
    where: { noteEncrypted: null, note: { not: null } },
    select: { id: true, note: true },
  })

  for (const row of rows) {
    c.scanned += 1
    if (!row.note) {
      c.skipped += 1
      continue
    }
    if (!DRY_RUN) {
      await prisma.moodCheckIn.update({
        where: { id: row.id },
        data: { noteEncrypted: encryptField(row.note) },
      })
    }
    c.encrypted += 1
  }
  summarize('MoodCheckIn (note)', c)
}

async function backfillSessionFollowup() {
  const c = newCounts()
  const rows = await prisma.sessionFollowup.findMany({
    where: { homeworkNoteEncrypted: null, homeworkNote: { not: null } },
    select: { id: true, homeworkNote: true },
  })

  for (const row of rows) {
    c.scanned += 1
    if (!row.homeworkNote) {
      c.skipped += 1
      continue
    }
    if (!DRY_RUN) {
      await prisma.sessionFollowup.update({
        where: { id: row.id },
        data: { homeworkNoteEncrypted: encryptField(row.homeworkNote) },
      })
    }
    c.encrypted += 1
  }
  summarize('SessionFollowup (homeworkNote)', c)
}

async function main() {
  console.log(`🔐 PHI encryption backfill${DRY_RUN ? ' (DRY RUN)' : ''}`)
  console.log('')

  await backfillJournalEntry()
  await backfillSession()
  await backfillAssignment()
  await backfillAssignmentResponse()
  await backfillMoodCheckIn()
  await backfillSessionFollowup()

  console.log('')
  console.log(DRY_RUN ? '✅ Dry run complete — no writes performed' : '✅ Backfill complete')
}

main()
  .catch((err) => {
    console.error('❌ Backfill failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
