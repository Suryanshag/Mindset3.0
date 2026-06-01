import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import MobileSessions from '@/components/mobile/sessions'
import BSessionsList, { type SessionItem } from '@/components/dashboard/desktop/b-sessions-list'

const SESSION_DURATION_MIN = 60

const doctorSelect = {
  designation: true,
  photo: true,
  user: { select: { name: true } },
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id
  const params = await searchParams
  const tab = (params.tab as string) ?? 'upcoming'
  const mobileTab: 'upcoming' | 'find' | 'past' =
    tab === 'find' || tab === 'past' ? tab : 'upcoming'

  // Mobile fetches all 3 datasets up-front so the client-side tab
  // switch is instant (no per-tab network round-trip). Desktop keeps
  // its tab-scoped fetching since each tab is its own server component.
  const now = new Date()
  const [mobileUpcoming, mobilePast, mobileDoctors] = await Promise.all([
    prisma.session.findMany({
      where: {
        userId,
        date: { gte: now },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: {
        id: true,
        date: true,
        meetLink: true,
        status: true,
        doctor: { select: doctorSelect },
      },
      orderBy: { date: 'asc' },
    }),
    prisma.session.findMany({
      where: {
        userId,
        OR: [
          { date: { lt: now } },
          { status: { in: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] } },
        ],
      },
      select: {
        id: true,
        date: true,
        meetLink: true,
        status: true,
        doctor: { select: doctorSelect },
      },
      orderBy: { date: 'desc' },
      take: 20,
    }),
    prisma.doctor.findMany({
      where: { isActive: true },
      select: {
        id: true,
        photo: true,
        designation: true,
        type: true,
        specialization: true,
        experience: true,
        sessionPrice: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  return (
    <>
      {/* Mobile — ported Phase 3 sessions surface with 3 tabs. */}
      <div className="lg:hidden">
        <MobileSessions
          initialTab={mobileTab}
          upcoming={mobileUpcoming.map((s) => ({
            id: s.id,
            date: s.date.toISOString(),
            status: s.status as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW',
            meetLink: s.meetLink,
            doctor: {
              photo: s.doctor.photo,
              designation: s.doctor.designation,
              user: { name: s.doctor.user.name },
            },
          }))}
          past={mobilePast.map((s) => ({
            id: s.id,
            date: s.date.toISOString(),
            status: s.status as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW',
            meetLink: s.meetLink,
            doctor: {
              photo: s.doctor.photo,
              designation: s.doctor.designation,
              user: { name: s.doctor.user.name },
            },
          }))}
          doctors={mobileDoctors.map((d) => ({
            id: d.id,
            photo: d.photo,
            designation: d.designation,
            type: d.type as 'COUNSELOR' | 'PSYCHOLOGIST',
            specialization: d.specialization,
            experience: d.experience,
            sessionPrice: Number(d.sessionPrice),
            user: { name: d.user.name },
          }))}
        />
      </div>

      {/* Desktop — Phase 3b Direction B port. Single client component
          owns filter state; one server-side fetch hands all sessions
          across. The URL `?tab=assignments` is no longer honoured here
          (assignments live in /user/practice/assignments per the B
          design); the param still parses without error to avoid
          breaking saved links. */}
      <div className="hidden lg:block">
        <DesktopSessions userId={userId} />
      </div>
    </>
  )
}

async function DesktopSessions({ userId }: { userId: string }) {
  // One pass: fetch every session the user has, ordered oldest-first.
  // Server-side sort gives us stable ordinals (1, 2, 3 …) without
  // re-querying. Doctor name is joined so we can label rows without N
  // extra queries.
  const all = await prisma.session.findMany({
    where: { userId },
    select: {
      id: true,
      date: true,
      status: true,
      doctor: {
        select: {
          designation: true,
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { date: 'asc' },
  })

  const items: SessionItem[] = all.map((s, i) => ({
    id: s.id,
    date: s.date.toISOString(),
    status: s.status,
    doctorName: s.doctor.user.name,
    doctorDesignation: s.doctor.designation,
    ordinal: i + 1,
  }))

  const now = new Date()
  const upcomingCount = items.filter(
    (s) =>
      new Date(s.date) >= now && (s.status === 'PENDING' || s.status === 'CONFIRMED'),
  ).length
  const completedCount = items.filter((s) => s.status === 'COMPLETED').length
  const totalMinutes = completedCount * SESSION_DURATION_MIN

  // Primary therapist = doctor on the user's most-recent session (any
  // status). Sessions are oldest-first so the last element wins.
  const primary = all.at(-1)?.doctor.user.name ?? null

  return (
    <BSessionsList
      sessions={items}
      totalCount={items.length}
      upcomingCount={upcomingCount}
      primaryTherapist={primary}
      totalMinutes={totalMinutes}
    />
  )
}
