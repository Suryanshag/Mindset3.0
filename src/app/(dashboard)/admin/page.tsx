import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Users, Stethoscope, Calendar, TrendingUp, IndianRupee, MessageSquare, Package, BarChart3, Wallet, Clock } from 'lucide-react'

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`
}

export default async function AdminOverview() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalUsers,
    totalDoctors,
    totalSessions,
    sessionsThisMonth,
    totalRevenue,
    revenueThisMonth,
    unreadMessages,
    activeProducts,
    platformRevenue,
    pendingPayouts,
    recentSessions,
    recentPayments,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.doctor.count({ where: { isActive: true } }),
    prisma.session.count(),
    prisma.session.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
    prisma.payment.aggregate({
      where: { status: 'PAID', createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.doctorEarning.aggregate({ _sum: { platformAmount: true } }),
    prisma.doctorEarning.aggregate({
      where: { status: 'PENDING' },
      _sum: { doctorAmount: true },
    }),
    prisma.session.findMany({
      orderBy: { date: 'desc' },
      take: 5,
      select: {
        id: true,
        date: true,
        status: true,
        user: { select: { name: true } },
        doctor: { select: { user: { select: { name: true } } } },
      },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        amount: true,
        type: true,
        status: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
  ])

  const stats = [
    { label: 'Total Users', value: totalUsers, icon: Users, color: 'var(--teal)' },
    { label: 'Total Doctors', value: totalDoctors, icon: Stethoscope, color: 'var(--coral)' },
    { label: 'Total Sessions', value: totalSessions, icon: Calendar, color: 'var(--amber)' },
    { label: 'Sessions This Month', value: sessionsThisMonth, icon: TrendingUp, color: 'var(--deep-teal)' },
    { label: 'Total Revenue', value: formatCurrency(Number(totalRevenue._sum.amount ?? 0)), icon: IndianRupee, color: 'var(--teal)' },
    { label: 'Revenue This Month', value: formatCurrency(Number(revenueThisMonth._sum.amount ?? 0)), icon: BarChart3, color: 'var(--coral)' },
    { label: 'Unread Messages', value: unreadMessages, icon: MessageSquare, color: 'var(--amber)' },
    { label: 'Active Products', value: activeProducts, icon: Package, color: 'var(--deep-teal)' },
    { label: 'Platform Earnings', value: formatCurrency(Number(platformRevenue._sum.platformAmount ?? 0)), icon: Wallet, color: 'var(--teal)' },
    { label: 'Pending Payouts', value: formatCurrency(Number(pendingPayouts._sum.doctorAmount ?? 0)), icon: Clock, color: 'var(--coral)' },
  ]

  const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: '#fef9c3', text: '#854d0e' },
    CONFIRMED: { bg: '#dcfce7', text: '#166534' },
    COMPLETED: { bg: '#dbeafe', text: '#1e40af' },
    CANCELLED: { bg: '#fee2e2', text: '#991b1b' },
    PAID: { bg: '#dcfce7', text: '#166534' },
    FAILED: { bg: '#fee2e2', text: '#991b1b' },
    REFUNDED: { bg: '#f3e8ff', text: '#6b21a8' },
  }

  const platformTotal = Number(platformRevenue._sum.platformAmount ?? 0)
  const pendingTotal = Number(pendingPayouts._sum.doctorAmount ?? 0)

  return (
    <div>
      {/* ═══ Mobile Header ═══ */}
      <div className="lg:hidden -m-6 -mt-20 mb-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white px-5 pt-20 pb-8">
          <div className="mb-6">
            <p className="text-slate-400 text-sm">Admin Overview</p>
            <h1 className="text-2xl font-bold mt-0.5">Mindset</h1>
          </div>

          <div className="bg-white/10 rounded-3xl p-5 mb-4">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Platform Revenue</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(platformTotal)}</p>
            <p className="text-teal-400 text-sm mt-1">
              {formatCurrency(pendingTotal)} pending doctor payouts
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Users', value: totalUsers },
              { label: 'Active Doctors', value: totalDoctors },
              { label: 'Sessions', value: totalSessions },
              { label: 'Unread Messages', value: unreadMessages },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-2xl p-4">
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile content cards */}
        <div className="px-4 -mt-4 space-y-4">
          {/* Quick actions */}
          <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Actions</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: '/admin/doctors/create', label: 'Add Doctor', color: 'bg-teal-50 text-teal-700' },
                { href: '/admin/workshops/create', label: 'Add Workshop', color: 'bg-blue-50 text-blue-700' },
                { href: '/admin/products/create', label: 'Add Product', color: 'bg-purple-50 text-purple-700' },
                { href: '/admin/messages', label: 'View Messages', color: 'bg-amber-50 text-amber-700' },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`flex items-center gap-3 p-4 rounded-2xl ${action.color} font-medium text-sm active:scale-95 transition-transform`}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Recent sessions mobile */}
          <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Recent Sessions</p>
            {recentSessions.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No sessions yet</p>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((s) => {
                  const colors = STATUS_COLORS[s.status] ?? { bg: '#f3f4f6', text: '#374151' }
                  return (
                    <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm flex-shrink-0">
                        {s.user.name?.charAt(0) ?? 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{s.user.name}</p>
                        <p className="text-xs text-gray-500">{s.doctor.user.name}</p>
                      </div>
                      <span
                        className="text-xs px-2 py-1 rounded-lg font-medium flex-shrink-0"
                        style={{ background: colors.bg, color: colors.text }}
                      >
                        {s.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent payments mobile */}
          <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Recent Payments</p>
            {recentPayments.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No payments yet</p>
            ) : (
              <div className="space-y-3">
                {recentPayments.map((p) => {
                  const colors = STATUS_COLORS[p.status] ?? { bg: '#f3f4f6', text: '#374151' }
                  return (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{p.user.name}</p>
                        <p className="text-xs text-gray-500">{p.type}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-gray-900 text-sm">{formatCurrency(Number(p.amount))}</p>
                        <span
                          className="text-xs px-2 py-0.5 rounded-lg font-medium"
                          style={{ background: colors.bg, color: colors.text }}
                        >
                          {p.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Desktop Layout (unchanged) ═══ */}
      <div className="hidden lg:block">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--navy)' }}>Admin Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-5 shadow-sm transition-all duration-200 hover:shadow-md"
              style={{ borderTop: `3px solid ${stat.color}` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: stat.color + '15', color: stat.color }}
                >
                  <stat.icon size={18} />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          {[
            { href: '/admin/doctors/create', label: 'Add Doctor' },
            { href: '/admin/workshops/create', label: 'Add Workshop' },
            { href: '/admin/products/create', label: 'Add Product' },
            { href: '/admin/messages', label: 'View Messages' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
              style={{ background: 'var(--teal)' }}
            >
              {action.label}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--navy)' }}>Recent Sessions</h2>
            <div className="space-y-3">
              {recentSessions.map((s) => {
                const colors = STATUS_COLORS[s.status] ?? { bg: '#f3f4f6', text: '#374151' }
                return (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{s.user.name}</p>
                      <p className="text-xs text-gray-500">
                        {s.doctor.user.name} &middot;{' '}
                        {new Date(s.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ background: colors.bg, color: colors.text }}
                    >
                      {s.status}
                    </span>
                  </div>
                )
              })}
              {recentSessions.length === 0 && (
                <p className="text-sm text-gray-500">No sessions yet.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--navy)' }}>Recent Payments</h2>
            <div className="space-y-3">
              {recentPayments.map((p) => {
                const colors = STATUS_COLORS[p.status] ?? { bg: '#f3f4f6', text: '#374151' }
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{p.user.name}</p>
                      <p className="text-xs text-gray-500">
                        {p.type} &middot;{' '}
                        {new Date(p.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-sm">
                        {formatCurrency(Number(p.amount))}
                      </p>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: colors.bg, color: colors.text }}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>
                )
              })}
              {recentPayments.length === 0 && (
                <p className="text-sm text-gray-500">No payments yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
