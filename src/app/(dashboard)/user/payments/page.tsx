'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

interface Payment {
  id: string
  amount: string
  type: string
  status: string
  createdAt: string
  razorpayPaymentId: string | null
  session: { date: string } | null
  order: { id: string } | null
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  SESSION: { bg: '#DBEAFE', text: '#1E40AF' },
  PRODUCT: { bg: '#EDE9FE', text: '#6D28D9' },
  EBOOK: { bg: '#FFEDD5', text: '#9A3412' },
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PAID: { bg: '#D1FAE5', text: '#065F46' },
  PENDING: { bg: '#FEF3C7', text: '#92400E' },
  FAILED: { bg: '#FEE2E2', text: '#991B1B' },
  REFUNDED: { bg: '#F3F4F6', text: '#374151' },
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/user/payments')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setPayments(res.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const totalSpent = payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  function copyId(id: string) {
    navigator.clipboard.writeText(id)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--navy)' }}>
          Payments
        </h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-32 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--navy)' }}>
        Payments
      </h1>

      {/* Total */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <p className="text-sm text-gray-500">Total Spent</p>
        <p className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>
          &#8377;{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">
          No payment history yet.
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const typeColor = TYPE_COLORS[p.type] ?? TYPE_COLORS.SESSION
            const statusColor = STATUS_COLORS[p.status] ?? STATUS_COLORS.PENDING
            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm text-gray-500">
                    {format(new Date(p.createdAt), 'dd MMM yyyy, h:mm a')}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: typeColor.bg, color: typeColor.text }}
                    >
                      {p.type}
                    </span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: statusColor.bg, color: statusColor.text }}
                    >
                      {p.status}
                    </span>
                  </div>
                  {p.razorpayPaymentId && (
                    <button
                      onClick={() => copyId(p.razorpayPaymentId!)}
                      className="text-xs text-gray-400 mt-1 hover:text-gray-600"
                      title="Click to copy"
                    >
                      {copied === p.razorpayPaymentId
                        ? 'Copied!'
                        : p.razorpayPaymentId.slice(0, 16) + '...'}
                    </button>
                  )}
                </div>
                <p className="text-lg font-bold flex-shrink-0" style={{ color: 'var(--navy)' }}>
                  &#8377;{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
