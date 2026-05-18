import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatSessionDateLong } from '@/lib/format-date'
import ReconcileRowActions from './row-actions'

/**
 * Lists PENDING Payment rows older than an hour — anything that's been
 * stuck PENDING that long is "suspicious" (the user either abandoned
 * the checkout OR our webhook missed the captured event). Admin can
 * "Check Razorpay" per row (read-only), then "Reconcile" if Razorpay
 * confirms the payment did capture.
 *
 * Idempotent: runs the same in-tx + post-tx logic as /api/payments/
 * verify and /api/payments/webhook, so a row reconciled here is
 * indistinguishable from a row that flowed through verify cleanly.
 */
export default async function AdminReconcilePaymentsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/')

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  const suspicious = await prisma.payment.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: oneHourAgo },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { id: true, name: true, email: true } },
      workshop: { select: { id: true, title: true } },
      session: { select: { id: true, date: true } },
    },
  })

  return (
    <div className="max-w-[1100px]">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Reconcile payments</h1>
      <p className="text-sm text-gray-600 mb-6">
        Payments still PENDING after an hour. Each may be (a) an abandoned checkout
        the user never completed (safe to ignore), or (b) a captured-but-missed
        webhook (needs reconciliation). Click <strong>Check Razorpay</strong> to
        find out. If Razorpay confirms capture, click <strong>Reconcile</strong> to
        mark the payment PAID and create the downstream row + send the
        confirmation email.
      </p>

      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="py-3 px-4 font-medium text-gray-600">Type</th>
              <th className="py-3 px-4 font-medium text-gray-600">User</th>
              <th className="py-3 px-4 font-medium text-gray-600">For</th>
              <th className="py-3 px-4 font-medium text-gray-600">Amount</th>
              <th className="py-3 px-4 font-medium text-gray-600">Created</th>
              <th className="py-3 px-4 font-medium text-gray-600">Razorpay order</th>
              <th className="py-3 px-4 font-medium text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {suspicious.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 px-4 text-center text-gray-500">
                  No suspicious payments. All PENDING rows are less than an hour old.
                </td>
              </tr>
            ) : (
              suspicious.map((p) => {
                const targetTitle =
                  p.workshop?.title ??
                  (p.session ? `Session on ${formatSessionDateLong(p.session.date)}` : '')
                return (
                  <tr key={p.id} className="border-t border-gray-100 align-top">
                    <td className="py-3 px-4 font-medium text-gray-900">{p.type}</td>
                    <td className="py-3 px-4 text-gray-700">
                      <div className="text-[13px]">{p.user.name}</div>
                      <div className="text-[11px] text-gray-500">{p.user.email}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-700 max-w-[260px]">{targetTitle || '—'}</td>
                    <td className="py-3 px-4 text-gray-900">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-gray-500 text-[12px]">
                      {p.createdAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-[11px] font-mono break-all">
                      {p.razorpayOrderId ?? '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <ReconcileRowActions paymentId={p.id} hasRazorpayOrder={!!p.razorpayOrderId} />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
