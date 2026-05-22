'use server'

import { auth, signOut } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { z } from 'zod'

const DELETION_REASONS = [
  'Not for me right now',
  'Privacy concerns',
  'Found another platform',
  'Something else',
] as const

const GRACE_PERIOD_DAYS = 30

const requestSchema = z.object({
  reason: z.enum(DELETION_REASONS),
  freeText: z.string().trim().max(500).optional(),
  confirm: z.literal('DELETE'),
})

export type RequestAccountDeletionInput = z.input<typeof requestSchema>

export type RequestAccountDeletionResult =
  | { success: true; scheduledFor: string }
  | { success: false; error: string }

export async function requestAccountDeletion(
  input: RequestAccountDeletionInput
): Promise<RequestAccountDeletionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const parsed = requestSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Invalid request' }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, deletionRequestedAt: true },
  })
  if (!user) return { success: false, error: 'Unauthorized' }

  // Idempotent: a second request during the grace window returns the
  // existing scheduledFor instead of resetting the clock or duplicating
  // the audit row.
  if (user.deletionRequestedAt) {
    const existing = await prisma.accountDeletion.findFirst({
      where: { userId: user.id, kind: 'REQUESTED' },
      orderBy: { createdAt: 'desc' },
      select: { scheduledFor: true },
    })
    if (existing?.scheduledFor) {
      return { success: true, scheduledFor: existing.scheduledFor.toISOString() }
    }
  }

  const h = await headers()
  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    null
  const userAgent = h.get('user-agent')?.slice(0, 500) ?? null

  const now = new Date()
  const scheduledFor = new Date(now.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { deletionRequestedAt: now },
    }),
    prisma.accountDeletion.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        kind: 'REQUESTED',
        reason: parsed.data.reason,
        freeText: parsed.data.freeText?.trim() || null,
        ip,
        userAgent,
        scheduledFor,
      },
    }),
  ])

  return { success: true, scheduledFor: scheduledFor.toISOString() }
}

// Sign the user out after a confirmed deletion request so the next visit
// goes through the login flow — logging back in triggers the JWT-callback
// cancellation path that clears deletionRequestedAt.
export async function signOutAfterDeletionRequest(): Promise<void> {
  await signOut({ redirectTo: '/login?deletionRequested=1' })
}

// Called from the NextAuth login success paths (Credentials authorize and
// Google events.signIn). If the user has a pending deletion, clear the
// flag and write a CANCELLED audit row. Safe to call unconditionally —
// returns early when there is no pending deletion.
export async function cancelDeletionOnLogin(
  userId: string,
  userEmail: string
): Promise<{ cancelled: boolean }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { deletionRequestedAt: true },
    })
    if (!user?.deletionRequestedAt) return { cancelled: false }

    let ip: string | null = null
    let userAgent: string | null = null
    try {
      const h = await headers()
      ip =
        h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        h.get('x-real-ip') ||
        null
      userAgent = h.get('user-agent')?.slice(0, 500) ?? null
    } catch {
      // headers() may not be available in every NextAuth callback context
      // (e.g. background JWT refresh) — degrade to null and still log.
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { deletionRequestedAt: null },
      }),
      prisma.accountDeletion.create({
        data: {
          userId,
          userEmail,
          kind: 'CANCELLED',
          ip,
          userAgent,
        },
      }),
    ])
    return { cancelled: true }
  } catch (err) {
    console.error('[ACCOUNT_DELETION] cancel-on-login failed', err)
    return { cancelled: false }
  }
}

// DPDP-compliant data export. Returns a JSON-serializable snapshot of
// everything the user owns: profile + content (journal/mood/notes) +
// transactional history (sessions/payments/orders/registrations). Excluded:
// password hash, auth event log, security counters, account-deletion
// audit rows (sensitive operational records), and engagement telemetry.
export async function requestDataExport(): Promise<
  | { success: true; data: Record<string, unknown>; filename: string }
  | { success: false; error: string }
> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

  const userId = session.user.id

  const [
    user,
    journalEntries,
    moodCheckIns,
    sessions,
    payments,
    assignments,
    workshopRegistrations,
    orders,
    addresses,
    ngoRegistrations,
    studyMaterialAccesses,
    cartItems,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        dateOfBirth: true,
        preferredLanguage: true,
        emergencyContact: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    }),
    prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.moodCheckIn.findMany({
      where: { userId },
      orderBy: { checkedInAt: 'desc' },
    }),
    prisma.session.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        date: true,
        status: true,
        paymentStatus: true,
        userNotes: true,
        cancelledAt: true,
        cancellationReason: true,
        createdAt: true,
        doctor: { select: { user: { select: { name: true } }, designation: true } },
      },
    }),
    prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        type: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.assignment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { responses: true },
    }),
    prisma.workshopRegistration.findMany({
      where: { userId },
      include: { workshop: { select: { title: true, startsAt: true } } },
    }),
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { orderItems: true },
    }),
    prisma.address.findMany({ where: { userId } }),
    prisma.ngoJoinRequest.findMany({
      where: { userId },
      include: { ngoVisit: { select: { ngoName: true, location: true, visitDate: true } } },
    }),
    prisma.studyMaterialAccess.findMany({
      where: { userId },
      include: { material: { select: { title: true } } },
    }),
    prisma.cartItem.findMany({
      where: { userId },
      include: { product: { select: { name: true, price: true } } },
    }),
  ])

  if (!user) return { success: false, error: 'Unauthorized' }

  const data = {
    exportedAt: new Date().toISOString(),
    exportFormat: 'mindset-user-data-v1',
    profile: user,
    journalEntries,
    moodCheckIns,
    sessions,
    payments,
    assignments,
    workshopRegistrations,
    orders,
    addresses,
    ngoRegistrations,
    studyMaterialAccesses,
    cartItems,
  }

  const datestamp = new Date().toISOString().split('T')[0]
  const filename = `mindset-export-${datestamp}.json`

  return { success: true, data, filename }
}

// Server action to fetch the user's pending-deletion status (used by the
// login screen banner when ?deletionRequested=1 is set, and by the privacy
// screen to surface the "deletion pending" state).
export async function getDeletionStatus(): Promise<{
  pending: boolean
  scheduledFor: string | null
}> {
  const session = await auth()
  if (!session?.user?.id) return { pending: false, scheduledFor: null }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { deletionRequestedAt: true },
  })
  if (!user?.deletionRequestedAt) return { pending: false, scheduledFor: null }

  const latest = await prisma.accountDeletion.findFirst({
    where: { userId: session.user.id, kind: 'REQUESTED' },
    orderBy: { createdAt: 'desc' },
    select: { scheduledFor: true },
  })
  return {
    pending: true,
    scheduledFor: latest?.scheduledFor?.toISOString() ?? null,
  }
}
