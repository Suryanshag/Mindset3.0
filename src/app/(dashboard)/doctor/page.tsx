import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Calendar, TrendingUp, ClipboardList, IndianRupee } from 'lucide-react'
import { formatSessionTime } from '@/lib/format-date'

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

  const [todaySessions, weekSessionCount, pendingReviews, monthEarnings, recentSubmissions, upcomingCount, totalPatients, pendingEarnings] =
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

  return (
    <div>
      {/* ═══ Mobile Header ═══ */}
      <div className="lg:hidden -m-6 -mt-20 mb-6">
        <div className="bg-gradient-to-br from-slate-900 to-teal-900 text-white px-5 pt-20 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-slate-400 text-sm">{getGreeting()},</p>
              <h1 className="text-xl font-bold mt-0.5">{doctorName}</h1>
              <p className="text-teal-400 text-sm">{doctor.designation}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">
                {pendingAmount > 0 ? `₹${pendingAmount.toLocaleString('en-IN')}` : '₹0'}
              </p>
              <p className="text-xs text-slate-400">pending payout</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Today', value: todaySessions.length },
              { label: 'Upcoming', value: upcomingCount },
              { label: 'Patients', value: totalPatients },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-2xl p-3 text-center">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Today's sessions — mobile */}
        <div className="px-4 -mt-4 space-y-4">
          <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Today&apos;s Sessions</p>
            {todaySessions.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No sessions today</p>
            ) : (
              <div className="space-y-3">
                {todaySessions.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm flex-shrink-0">
                      {s.user.name?.charAt(0) ?? 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{s.user.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatSessionTime(s.date)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium flex-shrink-0 ${
                      s.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {recentSubmissions.length > 0 && (
            <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Needs Review</p>
              <div className="space-y-3">
                {recentSubmissions.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                      {a.user.name?.charAt(0) ?? 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{a.title}</p>
                      <p className="text-xs text-gray-500">{a.user.name}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-lg font-medium bg-orange-100 text-orange-800 flex-shrink-0">
                      Review
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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
