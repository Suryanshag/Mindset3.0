'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Clock, CheckCircle, IndianRupee, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

interface Earning {
  id: string
  sessionDate: string
  patientName: string
  grossAmount: number
  doctorAmount: number
  status: 'PENDING' | 'PAID'
  createdAt: string
}

interface Summary {
  totalEarned: number
  totalPending: number
  totalPaid: number
  sessionCount: number
}

const IST = 'Asia/Kolkata'

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export default function DoctorEarningsPage() {
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/doctor/earnings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setEarnings(d.data.earnings)
          setSummary(d.data.summary)
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
        <p className="text-gray-500 text-sm mt-1">You receive 50% of each session fee</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div
          className="bg-white rounded-xl p-5 shadow-sm transition-all duration-200 hover:shadow-md"
          style={{ borderTop: '3px solid var(--teal)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--teal)15', color: 'var(--teal)' }}
            >
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Earned</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(summary?.totalEarned ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1">{summary?.sessionCount ?? 0} sessions completed</p>
        </div>

        <div
          className="bg-white rounded-xl p-5 shadow-sm transition-all duration-200 hover:shadow-md"
          style={{ borderTop: '3px solid var(--amber)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--amber)15', color: 'var(--amber)' }}
            >
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-500">Pending Payout</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(summary?.totalPending ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1">Awaiting settlement</p>
        </div>

        <div
          className="bg-white rounded-xl p-5 shadow-sm transition-all duration-200 hover:shadow-md"
          style={{ borderTop: '3px solid #10B981' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-green-50 text-green-600">
              <CheckCircle className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-500">Paid Out</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(summary?.totalPaid ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1">Already transferred</p>
        </div>
      </div>

      {/* Earnings table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Earnings History</h2>
        </div>

        {earnings.length === 0 ? (
          <div className="text-center py-16">
            <IndianRupee className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No earnings yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Earnings appear after marking sessions as completed
            </p>
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="lg:hidden divide-y divide-gray-50">
              {earnings.map((earning) => {
                const istDate = toZonedTime(new Date(earning.sessionDate), IST)
                return (
                  <div key={earning.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{earning.patientName ?? 'Patient'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {format(istDate, 'MMM d, yyyy')} &middot; {format(istDate, 'h:mm a')} IST
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-lg font-medium flex-shrink-0 ${
                          earning.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {earning.status === 'PAID' ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-50">
                      <span className="text-xs text-gray-400">Fee: {fmt(earning.grossAmount)}</span>
                      <span className="text-xs text-gray-400">&middot;</span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--teal)' }}>
                        Your share: {fmt(earning.doctorAmount)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Session Fee
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Your Share (50%)
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {earnings.map((earning) => {
                    const istDate = toZonedTime(new Date(earning.sessionDate), IST)
                    return (
                      <tr key={earning.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-700">
                          {format(istDate, 'MMM d, yyyy')}
                          <span className="block text-xs text-gray-400">
                            {format(istDate, 'h:mm a')} IST
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {earning.patientName ?? 'Patient'}
                        </td>
                        <td className="px-6 py-4 text-gray-700 text-right">
                          {fmt(earning.grossAmount)}
                        </td>
                        <td className="px-6 py-4 font-semibold text-right" style={{ color: 'var(--teal)' }}>
                          {fmt(earning.doctorAmount)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              earning.status === 'PAID'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {earning.status === 'PAID' ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <p className="text-sm text-gray-400 italic mt-6">
        Payouts are processed weekly by the admin team.
      </p>
    </div>
  )
}
