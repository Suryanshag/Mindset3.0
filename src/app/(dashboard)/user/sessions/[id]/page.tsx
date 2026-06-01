import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import MobileSessionDetail from '@/components/mobile/session-detail'
import BSessionDetail from '@/components/dashboard/desktop/b-session-detail'
import { decryptField } from '@/lib/encryption'

type SessionStatusKey = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const authSession = await auth()
  if (!authSession?.user?.id) redirect('/login')

  const row = await prisma.session.findFirst({
    where: { id, userId: authSession.user.id },
    select: {
      id: true,
      date: true,
      status: true,
      meetLink: true,
      doctorId: true,
      notesEncrypted: true,
      userNotesEncrypted: true,
      doctor: {
        select: {
          designation: true,
          photo: true,
          type: true,
          user: { select: { name: true } },
        },
      },
    },
  })
  if (!row) notFound()

  const { notesEncrypted, userNotesEncrypted, ...rest } = row
  const session = {
    ...rest,
    notes: decryptField(notesEncrypted),
    userNotes: decryptField(userNotesEncrypted),
  }

  const isPast =
    session.status === 'COMPLETED' || session.status === 'NO_SHOW' || session.date < new Date()

  // Parallel: related assignments (only relevant for past sessions),
  // and an ordered ID list for the ordinal + prev/next navigation links
  // the BSessionDetail design renders at the top.
  const [relatedAssignments, allSessionIds] = await Promise.all([
    isPast
      ? prisma.assignment.findMany({
          where: {
            userId: authSession.user.id,
            doctorId: session.doctorId,
            createdAt: {
              gte: session.date,
              lte: new Date(session.date.getTime() + 48 * 60 * 60 * 1000),
            },
          },
          select: { id: true, title: true, status: true },
          take: 5,
        })
      : Promise.resolve([] as { id: string; title: string; status: string }[]),
    prisma.session.findMany({
      where: { userId: authSession.user.id },
      select: { id: true },
      orderBy: { date: 'asc' },
    }),
  ])

  const currentIndex = allSessionIds.findIndex((s) => s.id === session.id)
  const ordinal = currentIndex + 1
  const prevSessionId = currentIndex > 0 ? allSessionIds[currentIndex - 1].id : null
  const nextSessionId =
    currentIndex >= 0 && currentIndex < allSessionIds.length - 1
      ? allSessionIds[currentIndex + 1].id
      : null

  const doctorName = session.doctor.user.name

  return (
    <>
      {/* Mobile — Phase 3 ported session detail with tinted hero. */}
      <div className="lg:hidden">
        <MobileSessionDetail
          session={{
            id: session.id,
            date: session.date,
            status: session.status as SessionStatusKey,
            meetLink: session.meetLink,
            notes: session.notes,
            userNotes: session.userNotes,
            doctorId: session.doctorId,
            doctor: {
              photo: session.doctor.photo,
              designation: session.doctor.designation,
              type: session.doctor.type as 'COUNSELOR' | 'PSYCHOLOGIST',
              user: { name: doctorName },
            },
          }}
        />
      </div>

      {/* Desktop — Phase 3b Direction B port. */}
      <div className="hidden lg:block">
        <BSessionDetail
          session={{
            id: session.id,
            date: session.date,
            status: session.status as SessionStatusKey,
            meetLink: session.meetLink,
            doctorId: session.doctorId,
            notes: session.notes,
            userNotes: session.userNotes,
            doctor: {
              photo: session.doctor.photo,
              designation: session.doctor.designation,
              user: { name: doctorName },
            },
          }}
          ordinal={ordinal}
          prevSessionId={prevSessionId}
          nextSessionId={nextSessionId}
          relatedAssignments={relatedAssignments}
        />
      </div>
    </>
  )
}
