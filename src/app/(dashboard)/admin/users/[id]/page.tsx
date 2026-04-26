'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface UserDetail {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  createdAt: string
  sessions: {
    id: string
    date: string
    status: string
    paymentStatus: string
    meetLink: string | null
    doctor: { user: { name: string }; designation: string }
  }[]
  orders: {
    id: string
    totalAmount: string
    paymentStatus: string
    shippingStatus: string
    awbCode: string | null
    createdAt: string
    orderItems: { quantity: number; price: string; product: { name: string } }[]
  }[]
  payments: {
    id: string
    amount: string
    type: string
    status: string
    razorpayPaymentId: string | null
    createdAt: string
  }[]
  assignments: {
    id: string
    title: string
    status: string
    dueDate: string | null
    createdAt: string
    doctor: { user: { name: string } }
  }[]
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#fef9c3', text: '#854d0e' },
  CONFIRMED: { bg: '#dcfce7', text: '#166534' },
  COMPLETED: { bg: '#dbeafe', text: '#1e40af' },
  CANCELLED: { bg: '#fee2e2', text: '#991b1b' },
  PAID: { bg: '#dcfce7', text: '#166534' },
  FAILED: { bg: '#fee2e2', text: '#991b1b' },
  REFUNDED: { bg: '#f3e8ff', text: '#6b21a8' },
  SUBMITTED: { bg: '#fed7aa', text: '#9a3412' },
  REVIEWED: { bg: '#d1fae5', text: '#065f46' },
  PROCESSING: { bg: '#dbeafe', text: '#1e40af' },
  SHIPPED: { bg: '#e0e7ff', text: '#3730a3' },
  DELIVERED: { bg: '#dcfce7', text: '#166534' },
  RETURNED: { bg: '#fee2e2', text: '#991b1b' },
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'sessions' | 'orders' | 'payments' | 'assignments'>('sessions')

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setUser(res.data) })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-8 text-gray-500">Loading user...</div>
  if (!user) return <div className="p-8 text-gray-500">User not found.</div>

  function Badge({ status }: { status: string }) {
    const colors = STATUS_COLORS[status] ?? { bg: '#f3f4f6', text: '#374151' }
    return (
      <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: colors.bg, color: colors.text }}>
        {status}
      </span>
    )
  }

  const tabs = [
    { key: 'sessions' as const, label: `Sessions (${user.sessions.length})` },
    { key: 'orders' as const, label: `Orders (${user.orders.length})` },
    { key: 'payments' as const, label: `Payments (${user.payments.length})` },
    { key: 'assignments' as const, label: `Assignments (${user.assignments.length})` },
  ]

  return (
    <div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{user.name}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <p>{user.email}</p>
          {user.phone && <p>{user.phone}</p>}
          <p>Joined: {new Date(user.createdAt).toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'text-white' : 'bg-white text-gray-700 border border-gray-200'
            }`}
            style={tab === t.key ? { background: 'var(--coral)' } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sessions' && (
        <div className="space-y-3">
          {user.sessions.length === 0 ? <p className="text-gray-500">No sessions.</p> : user.sessions.map((s) => (
            <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{s.doctor.user.name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(s.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  {s.meetLink && <> &middot; <a href={s.meetLink} target="_blank" rel="noopener noreferrer" className="text-blue-600">Meet Link</a></>}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge status={s.status} />
                <Badge status={s.paymentStatus} />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-3">
          {user.orders.length === 0 ? <p className="text-gray-500">No orders.</p> : user.orders.map((o) => (
            <div key={o.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900 text-sm">Order #{o.id.slice(-8)}</p>
                  <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <p className="font-semibold text-gray-900">₹{Number(o.totalAmount).toLocaleString('en-IN')}</p>
                  <Badge status={o.shippingStatus} />
                </div>
              </div>
              <div className="text-xs text-gray-600">
                {o.orderItems.map((item, i) => (
                  <span key={i}>{item.product.name} x{item.quantity}{i < o.orderItems.length - 1 ? ', ' : ''}</span>
                ))}
              </div>
              {o.awbCode && <p className="text-xs text-gray-500 mt-1">AWB: {o.awbCode}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 'payments' && (
        <div className="space-y-3">
          {user.payments.length === 0 ? <p className="text-gray-500">No payments.</p> : user.payments.map((p) => (
            <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">₹{Number(p.amount).toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-500">{p.type} &middot; {new Date(p.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
              <Badge status={p.status} />
            </div>
          ))}
        </div>
      )}

      {tab === 'assignments' && (
        <div className="space-y-3">
          {user.assignments.length === 0 ? <p className="text-gray-500">No assignments.</p> : user.assignments.map((a) => (
            <div key={a.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{a.title}</p>
                <p className="text-xs text-gray-500">
                  {a.doctor.user.name}
                  {a.dueDate && <> &middot; Due: {new Date(a.dueDate).toLocaleDateString('en-IN')}</>}
                </p>
              </div>
              <Badge status={a.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
