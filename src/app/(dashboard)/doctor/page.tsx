import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Calendar, TrendingUp, ClipboardList, IndianRupee, Landmark, ChevronRight, ArrowRight } from 'lucide-react'
import { formatSessionTime } from '@/lib/format-date'
import DoctorMobileTopBar from '@/components/dashboard/doctor/mobile-top-bar'
import NextSessionHero from '@/components/dashboard/doctor/mobile/next-session-hero'
import StatTile from '@/components/dashboard/doctor/mobile/stat-tile'
import MobileSessionCard from '@/components/dashboard/doctor/mobile/session-card'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function DoctorOverview() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
    select: { id: true, designation: true },
  })

  if (!doctor) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Doctor Dashboard</h1>
        <p className="text-gray-600">Doctor profile not set up. Contact admin.</p>
      </div>
    )
  }

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
  const startOfWeek = new Date(startOfDay)
  startOfWeek.setDate(startOfDay.getDate() - ((now.getDay() + 6) % 7))
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 7)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [todaySessions, weekSessionCount, pendingReviews, monthEarnings, recentSubmissions, upcomingCount, totalPatients, pendingEarnings, nextSession] =
    await Promise.all([
      prisma.session.findMany({
        where: {
          doctorId: doctor.id,
          date: { gte: startOfDay, lt: endOfDay },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        orderBy: { date: 'asc' },
        select: {
          id: true,
          date: true,
          meetLink: true,
          status: true,
          paymentStatus: true,
          user: { select: { name: true } },
        },
      }),
      prisma.session.count({
        where: {
          doctorId: doctor.id,
          date: { gte: startOfWeek, lt: endOfWeek },
        },
      }),
      prisma.assignment.count({
        where: { doctorId: doctor.id, status: 'SUBMITTED' },
      }),
      prisma.payment.aggregate({
        where: {
          session: { doctorId: doctor.id },
          status: 'PAID',
          type: 'SESSION',
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.assignment.findMany({
        where: { doctorId: doctor.id, status: 'SUBMITTED' },
        orderBy: { updatedAt: 'desc' },
        take: 3,
        select: {
          id: true,
          title: true,
          updatedAt: true,
          user: { select: { name: true } },
        },
      }),
      prisma.session.count({
        where: { doctorId: doctor.id, status: 'CONFIRMED', date: { gte: now } },
      }),
      prisma.session.groupBy({
        by: ['userId'],
        where: { doctorId: doctor.id },
      }).then((r) => r.length),
      prisma.doctorEarning.aggregate({
        where: { doctorId: doctor.id, status: 'PENDING' },
        _sum: { doctorAmount: true },
      }),
      // Next upcoming PENDING/CONFIRMED session (drives the mobile hero card)
      prisma.session.findFirst({
        where: {
          doctorId: doctor.id,
          date: { gte: now },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        orderBy: { date: 'asc' },
        select: {
          id: true,
          date: true,
          meetLink: true,
          status: true,
          user: { select: { name: true } },
        },
      }),
    ])

  const pendingAmount = Number(pendingEarnings._sum.doctorAmount ?? 0)

  const stats = [
    { label: "Today's Sessions", value: todaySessions.length, icon: Calendar, color: 'var(--teal)' },
    { label: 'This Week', value: weekSessionCount, icon: TrendingUp, color: 'var(--coral)' },
    { label: 'Pending Reviews', value: pendingReviews, icon: ClipboardList, color: 'var(--amber)' },
    {
      label: 'This Month Earnings',
      value: `₹${Number(monthEarnings._sum.amount ?? 0).toLocaleString('en-IN')}`,
      icon: IndianRupee,
      color: 'var(--deep-teal)',
    },
  ]

  const doctorName = session.user.name ?? 'Doctor'

  const kicker = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
  const lastName = (doctorName.split(/\s+/).pop() || doctorName)
  const heroTitle = doctorName.toLowerCase().startsWith('dr') ? doctorName : `Dr ${lastName}`

  const todayForCard = todaySessions.map((s) => ({
    id: s.id,
    date: s.date.toISOString(),
    status: s.status as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW',
    paymentStatus: s.paymentStatus,
    meetLink: s.meetLink,
    user: { name: s.user.name },
  }))
  const nextSessionForHero = nextSession
    ? {
        id: nextSession.id,
        date: nextSession.date.toISOString(),
        status: nextSession.status as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW',
        meetLink: nextSession.meetLink,
        user: { name: nextSession.user.name },
      }
    : null

  return (
    <div>
      {/* ═══ Mobile Layout (rebuilt — Sprint 2A) ═══ */}
      <div className="lg:hidden">
        <DoctorMobileTopBar kicker={kicker} title={heroTitle} doctorName={doctorName} />

        {/* Hero: next session */}
        <section className="px-4 pt-2">
          <NextSessionHero next={nextSessionForHero} />
        </section>

        {/* Stat tiles */}
        <section className="px-4 pt-3.5 grid grid-cols-3 gap-2">
          <StatTile value={todaySessions.length} label="Today" accent="var(--accent)" />
          <StatTile value={upcomingCount} label="This week" accent="var(--primary)" />
          <StatTile value={totalPatients} label="Patients" accent="var(--navy)" />
        </section>

        {/* Pending payout strip — informational only (payouts page is
            desktop-only; no dead-end tap). */}
        <section className="px-4 pt-3.5">
          <div
            className="w-full flex items-center gap-2.5 rounded-[14px] px-3.5 py-3"
            style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--bg-app)', color: 'var(--text-muted)' }}
            >
              <Landmark size={14} strokeWidth={1.8} />
            </div>
            <div className="flex-1 text-[12.5px]" style={{ color: 'var(--text)' }}>
              Pending payout ·{' '}
              <b className="ms-display text-[16px]">₹{pendingAmount.toLocaleString('en-IN')}</b>
              {' · '}
              <span style={{ color: 'var(--text-muted)' }}>Sent Mondays</span>
            </div>
          </div>
        </section>

        {/* Today's sessions */}
        <section className="px-4 pt-5">
          <div className="flex items-center gap-2 mb-2.5">
            <div
              className="text-[11px] font-extrabold uppercase"
              style={{ letterSpacing: '0.14em', color: 'var(--text-muted)' }}
            >
              Today&apos;s sessions
            </div>
            <Link
              href="/doctor/sessions"
              className="ml-auto inline-flex items-center gap-1 text-[12px] font-extrabold"
              style={{ color: 'var(--primary)' }}
            >
              View all <ArrowRight size={12} strokeWidth={2.2} />
            </Link>
          </div>
          <div className="grid gap-2">
            {todayForCard.length === 0 ? (
              <div
                className="rounded-[16px] p-[18px] text-center"
                style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: 13 }}
              >
                No sessions today. Take the morning.
              </div>
            ) : (
              todayForCard.map((s) => (
                <MobileSessionCard key={s.id} s={s} compact />
              ))
            )}
          </div>
        </section>

        {/* Needs review */}
        {recentSubmissions.length > 0 && (
          <section className="px-4 pt-5">
            <div className="flex items-center gap-2 mb-2.5">
              <div
                className="text-[11px] font-extrabold uppercase"
                style={{ letterSpacing: '0.14em', color: 'var(--text-muted)' }}
              >
                Needs review
              </div>
              <span
                className="rounded-full text-[10.5px] font-extrabold"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--on-dark, var(--cream))',
                  padding: '2px 8px',
                }}
              >
                {pendingReviews}
              </span>
              <Link
                href="/doctor/assignments"
                className="ml-auto inline-flex items-center gap-1 text-[12px] font-extrabold"
                style={{ color: 'var(--primary)' }}
              >
                View all <ArrowRight size={12} strokeWidth={2.2} />
              </Link>
            </div>
            <div className="grid gap-2">
              {recentSubmissions.map((a) => (
                <Link
                  key={a.id}
                  href="/doctor/assignments"
                  className="flex items-center gap-3 rounded-[16px] p-3.5"
                  style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
                >
                  <div
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{ background: 'var(--accent-tint)', color: 'var(--accent-deep)' }}
                  >
                    <ClipboardList size={16} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-extrabold truncate" style={{ color: 'var(--text)' }}>
                      {a.title}
                    </div>
                    <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {a.user.name} · submitted {new Date(a.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <ChevronRight size={16} strokeWidth={1.8} style={{ color: 'var(--text-muted)' }} />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ═══ Desktop Layout (unchanged) ═══ */}
      <div className="hidden lg:block">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--navy)' }}>
          {getGreeting()}, {session.user.name}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-5 shadow-sm transition-all duration-200 hover:shadow-md"
              style={{ borderTop: `3px solid ${stat.color}` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: stat.color + '15', color: stat.color }}
                >
                  <stat.icon size={20} />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--navy)' }}>Today&apos;s Schedule</h2>
          {todaySessions.length === 0 ? (
            <div className="text-center py-4">
              <Calendar size={28} className="mx-auto mb-2" style={{ color: 'var(--teal)', opacity: 0.4 }} />
              <p className="text-sm text-gray-500">No sessions scheduled for today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{s.user.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatSessionTime(s.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{
                        background: s.status === 'CONFIRMED' ? '#dcfce7' : '#fef9c3',
                        color: s.status === 'CONFIRMED' ? '#166534' : '#854d0e',
                      }}
                    >
                      {s.status}
                    </span>
                    {s.meetLink && (
                      <a
                        href={s.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1 rounded-full font-medium text-white"
                        style={{ background: 'var(--coral)' }}
                      >
                        Join
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--navy)' }}>Recent Submissions</h2>
          {recentSubmissions.length === 0 ? (
            <div className="text-center py-4">
              <ClipboardList size={28} className="mx-auto mb-2" style={{ color: 'var(--amber)', opacity: 0.4 }} />
              <p className="text-sm text-gray-500">No pending submissions.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSubmissions.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{a.title}</p>
                    <p className="text-sm text-gray-500">
                      by {a.user.name} &middot;{' '}
                      {new Date(a.updatedAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-orange-100 text-orange-800">
                    Needs Review
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
