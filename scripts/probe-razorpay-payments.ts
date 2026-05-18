/**
 * Read-only probe: fetch each captured payment from Razorpay so we
 * know the order id, amount, notes (which carry our internal
 * workshopId/sessionId), and capture timestamp before deciding how
 * to reconcile each one.
 *
 * Run: set -a && source .env.local && set +a && npx tsx scripts/probe-razorpay-payments.ts
 */
import { razorpay } from '@/lib/razorpay'
import { prisma } from '@/lib/prisma'

const PAYMENT_IDS = [
  'pay_SqW8ymLh5KbHiE', // ₹500 workshop, May 17 23:11 IST  (PENDING Payment row exists)
  'pay_SqVAWZZOIVSvzj', // ₹500 workshop, May 17 22:14 IST  (no DB row)
  'pay_Spx7S2IB4VB7PN', // ₹1500 session, May 16 12:56 IST  (no DB row)
]

async function main() {
  for (const id of PAYMENT_IDS) {
    console.log('=========================================================')
    console.log('Probing', id)
    try {
      const p = await razorpay.payments.fetch(id)
      console.log('  status:        ', p.status)
      console.log('  amount (paise):', p.amount)
      console.log('  currency:      ', p.currency)
      console.log('  method:        ', p.method)
      console.log('  email:         ', p.email)
      console.log('  contact:       ', p.contact)
      console.log('  order_id:      ', p.order_id)
      console.log('  captured:      ', p.captured)
      console.log('  created_at:    ', new Date((p.created_at as number) * 1000).toISOString())
      console.log('  notes:         ', JSON.stringify(p.notes))

      if (p.order_id) {
        try {
          const o = await razorpay.orders.fetch(p.order_id)
          console.log('  ─── order ───')
          console.log('    status:    ', o.status)
          console.log('    receipt:   ', o.receipt)
          console.log('    notes:     ', JSON.stringify(o.notes))
          console.log('    amount:    ', o.amount)
        } catch (e) {
          console.log('  ✗ order fetch failed:', e instanceof Error ? e.message : e)
        }

        const existing = await prisma.payment.findUnique({
          where: { razorpayOrderId: p.order_id },
        })
        console.log('  ─── our DB ───')
        console.log('    matching Payment row:', existing ? existing.id : '(none)')
        if (existing) {
          console.log('    type:        ', existing.type)
          console.log('    status:      ', existing.status)
          console.log('    userId:      ', existing.userId)
          console.log('    workshopId:  ', existing.workshopId)
          console.log('    sessionId:   ', existing.sessionId)
          console.log('    amount:      ', existing.amount.toString())
        }
      }
    } catch (e) {
      console.log('  ✗ payment fetch failed:', e instanceof Error ? e.message : e)
    }
    console.log('')
  }
  await prisma.$disconnect()
}

main().catch((err) => { console.error('Unhandled:', err); process.exit(1) })
