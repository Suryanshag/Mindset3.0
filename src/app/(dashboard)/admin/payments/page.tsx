'use client'

import { useState, useEffect } from 'react'
import { exportToCSV } from '@/lib/csv-export'

interface PaymentRow {
  id: string
  amount: string
  type: string
  status: string
  razorpayPaymentId: string | null
  createdAt: string
  user: { id: string; name: string; email: string }
}

interface Summary {
  totalRevenue: number
  pendingAmount: number
  failedCount: number
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PAID: { bg: '#dcfce7', text: '#166534' },
  PENDING: { bg: '#fef9c3', text: '#854d0e' },
  FAILED: { bg: '#fee2e2', text: '#991b1b' },
  REFUNDED: { bg: '#f3e8ff', text: '#6b21a8' },
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [summary, setSummary] = useState<Summary>({ totalRevenue: 0, pendingAmount: 0, failedCount: 0 })
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const limit = 20

  useEffect(() => {
    fetchPayments()
  }, [page, typeFilter, statusFilter])

  function fetchPayments() {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (typeFilter) params.set('type', typeFilter)
    if (statusFilter) params.set('status', statusFilter)

    fetch(`/api/admin/payments?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setPayments(res.data.payments)
          setTotal(res.data.total)
          setSummary(res.data.summary)
        }
      })
      .finally(() => setLoading(false))
  }

  function copyId(id: string) {
    navigator.clipboard.writeText(id)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  function handleExport() {
    exportToCSV(
      payments.map((p) => ({
        User: p.user.name,
        Email: p.user.email,
        Amount: Number(p.amount),
        Type: p.type,
        Status: p.status,
        'Razorpay ID': p.razorpayPaymentId ?? '',
        Date: new Date(p.createdAt).toLocaleDateString('en-IN'),
      })),
      'payments'
    )
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Payments</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-green-700">₹{summary.totalRevenue.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Pending Amount</p>
          <p className="text-2xl font-bold text-yellow-700">₹{summary.pendingAmount.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Failed Count</p>
          <p className="text-2xl font-bold text-red-700">{summary.failedCount}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm">
          <option value="">All Types</option>
          <option value="SESSION">Session</option>
          <option value="PRODUCT">Product</option>
          <option value="EBOOK">Ebook</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm">
          <option value="">All Statuses</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <button onClick={handleExport} disabled={payments.length === 0} className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 disabled:opacity-50">
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading payments...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">User</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Type</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Razorpay ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const colors = STATUS_COLORS[p.status] ?? { bg: '#f3f4f6', text: '#374151' }
                  return (
                    <tr key={p.id} className="border-b border-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{p.user.name}</p>
                        <p className="text-xs text-gray-500">{p.user.email}</p>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-center text-gray-600">{p.type}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: colors.bg, color: colors.text }}>{p.status}</span>
                      </td>
                      <td className="py-3 px-4">
                        {p.razorpayPaymentId ? (
                          <button
                            onClick={() => copyId(p.razorpayPaymentId!)}
                            className="text-xs text-gray-600 hover:text-blue-600 font-mono"
                            title="Click to copy"
                          >
                            {copied === p.razorpayPaymentId ? 'Copied!' : `${p.razorpayPaymentId.slice(0, 12)}...`}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {payments.length === 0 && <p className="p-6 text-center text-gray-500">No payments found.</p>}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-sm disabled:opacity-50">Previous</button>
              <span className="px-3 py-1 text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-sm disabled:opacity-50">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
