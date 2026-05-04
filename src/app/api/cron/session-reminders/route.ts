import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendSessionReminder, sendSessionFollowup } from '@/lib/email-service'
import { addHours } from 'date-fns'

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.error('[CRON] Unauthorized cron request')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  console.log('[CRON] Session reminders job started')

  try {
    const now = new Date()
    // Find sessions 24 hours from now (within 1 hour window)
    const windowStart = addHours(now, 23)
    const windowEnd = addHours(now, 25)

    const upcomingSessions = await prisma.session.findMany({
      where: {
        status: 'CONFIRMED',
        date: {
          gte: windowStart,
          lte: windowEnd,
        },
        reminderSent: false,
      },
      include: {
        user: { select: { name: true, email: true } },
        doctor: {
          select: {
            user: { select: { name: true } },
          },
        },
      },
    })

    console.log(`[CRON] Found ${upcomingSessions.length} sessions to remind`)

    let successCount = 0
    let failCount = 0

    for (const session of upcomingSessions) {
      try {
        sendSessionReminder(session.user.email, {
          userName: session.user.name ?? 'there',
          doctorName: session.doctor.user.name ?? 'your doctor',
          sessionDate: session.date,
          meetLink: session.meetLink,
          hoursUntil: 24,
        })

        // Mark reminder as sent
        await prisma.session.update({
          where: { id: session.id },
          data: { reminderSent: true },
        })

        successCount++
      } catch (err) {
        console.error(
          `[CRON] Failed for session ${session.id}:`,
          err
        )
        failCount++
      }
    }

    console.log(
      `[CRON] Reminders: ${successCount} sent, ${failCount} failed`
    )

    // JOB 2: Follow-up for sessions that ended 2-26 hours ago
    const followupWindowStart = addHours(now, -26)
    const followupWindowEnd = addHours(now, -2)

    const pastSessions = await prisma.session.findMany({
      where: {
        status: 'CONFIRMED',
        date: {
          gte: followupWindowStart,
          lte: followupWindowEnd,
        },
        followupSent: false,
      },
      include: {
        user: { select: { name: true, email: true } },
        doctor: {
          select: {
            user: { select: { name: true } },
          },
        },
      },
    })

    console.log(`[CRON] Found ${pastSessions.length} sessions for follow-up`)

    let followupSuccess = 0
    let followupFail = 0

    for (const pastSession of pastSessions) {
      try {
        sendSessionFollowup(pastSession.user.email, {
          userName: pastSession.user.name ?? 'there',
          doctorName: pastSession.doctor.user.name ?? 'your doctor',
          sessionDate: pastSession.date,
        })

        await prisma.session.update({
          where: { id: pastSession.id },
          data: { followupSent: true },
        })

        followupSuccess++
      } catch (err) {
        console.error(
          `[CRON] Follow-up failed for session ${pastSession.id}:`,
          err
        )
        followupFail++
      }
    }

    console.log(
      `[CRON] Follow-ups: ${followupSuccess} sent, ${followupFail} failed`
    )

    // JOB 3: Clean up abandoned pending orders (>24 hours old, unpaid)
    const abandonedCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const abandonedOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'PENDING',
        createdAt: { lt: abandonedCutoff },
      },
      include: {
        payment: true,
        orderItems: { select: { productId: true, quantity: true, product: { select: { isDigital: true } } } },
      },
    })

    let abandonedCleaned = 0

    for (const order of abandonedOrders) {
      // Skip if payment is PAID (shouldn't happen, but safety check)
      if (order.payment?.status === 'PAID') continue

      try {
        await prisma.$transaction(async (tx) => {
          // Restore stock for each non-digital item
          for (const item of order.orderItems) {
            if (!item.product.isDigital) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } },
              })
            }
          }

          // Delete payment first (no cascade on Order→Payment)
          if (order.payment) {
            await tx.payment.delete({ where: { id: order.payment.id } })
          }

          // Delete order (OrderItems cascade-delete automatically)
          await tx.order.delete({ where: { id: order.id } })
        })

        abandonedCleaned++
      } catch (err) {
        console.error(`[CRON] Failed to clean up order ${order.id}:`, err)
      }
    }

    console.log(
      `[CRON] Abandoned orders: ${abandonedCleaned} cleaned up out of ${abandonedOrders.length} found`
    )

    // JOB 4: Clean up expired/used password reset tokens
    const deletedTokens = await prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { usedAt: { not: null } },
        ],
      },
    })

    console.log(`[CRON] Cleaned ${deletedTokens.count} expired password reset tokens`)

    return NextResponse.json({
      success: true,
      reminders: {
        processed: upcomingSessions.length,
        sent: successCount,
        failed: failCount,
      },
      followups: {
        processed: pastSessions.length,
        sent: followupSuccess,
        failed: followupFail,
      },
      abandonedOrders: {
        found: abandonedOrders.length,
        cleaned: abandonedCleaned,
      },
      expiredTokens: deletedTokens.count,
    })

  } catch (error) {
    console.error('[CRON] Job failed:', error)
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    )
  }
}
