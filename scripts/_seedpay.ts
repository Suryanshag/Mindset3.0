import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
const prisma = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })) })

async function main() {
  const sessionId = 'cmpld5m6n0003r827qkx0sdt2' // 9 AM May 25 session
  const session = await prisma.session.findUnique({ where: { id: sessionId } })
  if (!session) throw new Error('session not found')
  const p = await prisma.payment.create({
    data: {
      userId: session.userId,
      amount: 800,
      type: 'SESSION',
      status: 'PAID',
      sessionId: session.id,
      razorpayOrderId: `pair_smoke_complete_${session.id}`,
      razorpayPaymentId: `pair_smoke_completepay_${session.id}`,
    },
  })
  console.log(`Payment created: id=${p.id}, amount=₹${p.amount}, sessionId=${p.sessionId}`)
}
main().finally(() => prisma.$disconnect())
