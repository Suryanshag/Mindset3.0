import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendSessionBookingConfirmation, sendDoctorNewBookingNotification, sendPaymentFailed, sendEbookPurchased, sendOrderConfirmation, sendWorkshopRegistrationConfirmation } from '@/lib/email-service'
import { createShipmentForOrder } from '@/lib/create-shipment-for-order'
import { formatSessionDateLong } from '@/lib/format-date'

// CRITICAL: Log every single step
export async function POST(req: NextRequest) {
  console.log('\n[WEBHOOK] ========== WEBHOOK RECEIVED ==========')
  console.log('[WEBHOOK] Time:', new Date().toISOString())
  console.log('[WEBHOOK] URL:', req.url)
  console.log('[WEBHOOK] Method:', req.method)

  // Log all headers
  const headers: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    headers[key] = value
  })
  console.log('[WEBHOOK] Headers:', JSON.stringify(headers, null, 2))

  try {
    // Step 1: Get raw body
    const rawBody = await req.text()
    console.log('[WEBHOOK] Body length:', rawBody.length)
    console.log('[WEBHOOK] Body preview:', rawBody.substring(0, 200))

    // Step 2: Get signature
    const razorpaySignature = req.headers.get('x-razorpay-signature')
    console.log('[WEBHOOK] Signature header:', razorpaySignature ? 'PRESENT' : 'MISSING')

    if (!razorpaySignature) {
      console.log('[WEBHOOK] ERROR: No signature header')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Step 3: Verify signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    console.log('[WEBHOOK] Webhook secret configured:', !!webhookSecret)
    console.log('[WEBHOOK] Webhook secret length:', webhookSecret?.length)

    if (!webhookSecret) {
      console.log('[WEBHOOK] ERROR: RAZORPAY_WEBHOOK_SECRET not set')
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 }
      )
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex')

    console.log('[WEBHOOK] Expected signature:', expectedSignature.substring(0, 20) + '...')
    console.log('[WEBHOOK] Received signature:', razorpaySignature.substring(0, 20) + '...')

    const sigBuffer = Buffer.from(razorpaySignature, 'hex')
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')

    let signatureValid = false
    if (sigBuffer.length === expectedBuffer.length) {
      signatureValid = crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    }

    console.log('[WEBHOOK] Secret being used (first 8 chars):', webhookSecret.substring(0, 8))
    console.log('[WEBHOOK] Raw body length:', rawBody.length)
    console.log('[WEBHOOK] Signature match:', signatureValid)

    if (!signatureValid) {
      console.error('[WEBHOOK] ❌ SIGNATURE MISMATCH')
      console.error('[WEBHOOK] This means RAZORPAY_WEBHOOK_SECRET')
      console.error('[WEBHOOK] in .env.local does not match the')
      console.error('[WEBHOOK] secret saved in Razorpay Dashboard')
      console.error('[WEBHOOK] Fix: regenerate secret in Razorpay,')
      console.error('[WEBHOOK] update .env.local, restart server')
      // Still return 200 so Razorpay stops retrying
      return NextResponse.json({ received: true }, { status: 200 })
    }

    console.log('[WEBHOOK] ✓ Signature verified')

    // Step 4: Parse event
    const event = JSON.parse(rawBody)
    const eventType = event.event
    console.log('[WEBHOOK] Event type:', eventType)

    // Step 5: Handle payment.captured
    if (eventType === 'payment.captured') {
      const paymentEntity = event.payload.payment.entity
      const razorpayOrderId = paymentEntity.order_id
      const razorpayPaymentId = paymentEntity.id

      console.log('[WEBHOOK] Razorpay Order ID:', razorpayOrderId)
      console.log('[WEBHOOK] Razorpay Payment ID:', razorpayPaymentId)

      // Find payment in DB
      const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId },
      })

      console.log('[WEBHOOK] Payment found in DB:', !!payment)
      console.log('[WEBHOOK] Payment status:', payment?.status)
      console.log('[WEBHOOK] Payment type:', payment?.type)

      if (!payment) {
        // SILENT-DROP path that caused the May 16/17 stuck payments:
        // Razorpay captured + delivered the event, but no DB Payment
        // row exists for that order id. We return 200 (otherwise
        // Razorpay retries indefinitely on a permanent error), but
        // log loudly so the next time it happens the admin reconcile
        // page (/admin/reconcile-payments) and the Vercel log search
        // catch it within minutes.
        console.error(
          '[WEBHOOK] [SILENT_DROP] no Payment row for razorpayOrderId:',
          razorpayOrderId,
          'razorpayPaymentId:', razorpayPaymentId,
          'amount:', paymentEntity.amount,
          'method:', paymentEntity.method,
          '— check /admin/reconcile-payments OR reconcile manually'
        )
        return NextResponse.json({ received: true })
      }

      if (payment.status === 'PAID') {
        console.log('[WEBHOOK] payment', payment.id, 'already PAID — verify already processed, skipping')
        return NextResponse.json({ received: true })
      }

      // Update payment and related records in transaction
      console.log('[WEBHOOK] Starting transaction...')

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'PAID',
            razorpayPaymentId,
            razorpaySignature,
          },
        })
        console.log('[WEBHOOK] ✓ Payment updated to PAID')

        if (payment.type === 'SESSION' && payment.sessionId) {
          await tx.session.update({
            where: { id: payment.sessionId },
            data: {
              paymentStatus: 'PAID',
              status: 'CONFIRMED',
            },
          })
          console.log('[WEBHOOK] ✓ Session confirmed')
        }

        if (payment.type === 'PRODUCT' && payment.orderId) {
          await tx.order.update({
            where: { id: payment.orderId },
            data: { paymentStatus: 'PAID' },
          })
          console.log('[WEBHOOK] ✓ Order updated to PAID')
        }

        if (payment.type === 'EBOOK') {
          console.log('[WEBHOOK] ✓ Ebook payment recorded')
        }

        if (payment.type === 'WORKSHOP' && payment.workshopId) {
          // Create the registration row only on successful capture. The
          // pending Payment carries the workshopId since Task 1; only now
          // do we materialize the WorkshopRegistration.
          await tx.workshopRegistration.create({
            data: {
              userId: payment.userId,
              workshopId: payment.workshopId,
              paymentId: payment.id,
            },
          })
          console.log('[WEBHOOK] ✓ Workshop registration created')
        }
      }, { maxWait: 8000, timeout: 15000 })

      console.log('[WEBHOOK] ✓ Transaction complete')

      // Post-transaction: Auto-create Shiprocket shipment + send order email (non-blocking)
      if (payment.type === 'PRODUCT' && payment.orderId) {
        // Only create shipment if order has physical items
        const orderWithItems = await prisma.order.findUnique({
          where: { id: payment.orderId },
          include: { orderItems: { include: { product: { select: { isDigital: true } } } } },
        })
        const hasPhysicalItems = orderWithItems?.orderItems.some(oi => !oi.product.isDigital)

        if (hasPhysicalItems) {
          createShipmentForOrder(payment.orderId).catch((err) => {
            console.error('[WEBHOOK] Shipment creation failed:', err)
          })
        } else {
          console.log('[WEBHOOK] Digital-only order, skipping shipment')
        }

        // Send order confirmation email
        try {
          const orderDetails = await prisma.order.findUnique({
            where: { id: payment.orderId },
            include: {
              user: { select: { name: true, email: true } },
              orderItems: {
                include: { product: { select: { name: true } } },
              },
            },
          })
          if (orderDetails?.user) {
            const addr = orderDetails.shippingAddress as {
              name: string; addressLine1: string; addressLine2?: string
              city: string; state: string; pincode: string
            }
            sendOrderConfirmation(orderDetails.user.email, {
              userName: orderDetails.user.name ?? 'there',
              orderId: orderDetails.id,
              orderNumber: orderDetails.orderNumber,
              items: orderDetails.orderItems.map(oi => ({
                name: oi.product.name,
                quantity: oi.quantity,
                price: Number(oi.price),
              })),
              totalAmount: Number(orderDetails.totalAmount),
              shippingAddress: addr,
              deliveryCharge: Number(orderDetails.deliveryCharge),
              courierName: orderDetails.selectedCourierName ?? undefined,
            })

            const orderLabel = orderDetails.orderNumber ?? `#${orderDetails.id.slice(-8).toUpperCase()}`
            await prisma.notification.create({
              data: {
                userId: payment.userId,
                kind: 'ORDER',
                title: `Order ${orderLabel} confirmed`,
                body: `We're packing your order. We'll let you know when it ships.`,
                link: `/user/orders/${orderDetails.id}`,
              },
            }).catch((err) => {
              console.error('[WEBHOOK] Order notification create failed:', err)
            })
          }
        } catch (err) {
          console.error('[WEBHOOK] Order confirmation email error:', err)
        }
      }

      // Post-transaction: Ebook purchase email (non-blocking)
      if (payment.type === 'EBOOK' && payment.studyMaterialId) {
        try {
          const ebookDetails = await prisma.studyMaterial.findUnique({
            where: { id: payment.studyMaterialId },
            select: { title: true, price: true },
          })
          const userDetails = await prisma.user.findUnique({
            where: { id: payment.userId },
            select: { name: true, email: true },
          })
          if (ebookDetails && userDetails) {
            sendEbookPurchased(userDetails.email, {
              userName: userDetails.name ?? 'there',
              ebookTitle: ebookDetails.title,
              amount: Number(ebookDetails.price),
            })
          }
        } catch (err) {
          console.error('[WEBHOOK] Ebook email failed:', err)
        }
      }

      // Meet link added manually by doctor via /doctor/calendar.
      // See docs/operations.md for the rationale.
      if (payment.type === 'SESSION' && payment.sessionId) {
        // Send two emails (both fire-and-forget, both wrapped):
        //   1. Patient — "your session is confirmed"
        //   2. Doctor  — "new booking, please add a Meet link"
        // Webhook returns 200 to Razorpay regardless of email outcome.
        try {
          const fullSession = await prisma.session.findUnique({
            where: { id: payment.sessionId },
            include: {
              user: { select: { name: true, email: true } },
              doctor: {
                select: {
                  user: { select: { name: true, email: true } },
                },
              },
            },
          })
          if (fullSession) {
            sendSessionBookingConfirmation(fullSession.user.email, {
              userName: fullSession.user.name ?? 'there',
              doctorName: fullSession.doctor.user.name ?? 'your doctor',
              sessionDate: fullSession.date,
              durationMin: 60,
              meetLink: fullSession.meetLink,
              sessionId: fullSession.id,
            })
            sendDoctorNewBookingNotification(fullSession.doctor.user.email, {
              doctorName: fullSession.doctor.user.name ?? 'Doctor',
              userName: fullSession.user.name ?? 'A patient',
              sessionDate: fullSession.date,
              durationMin: 60,
              sessionId: fullSession.id,
            })

            await prisma.notification.create({
              data: {
                userId: payment.userId,
                kind: 'SESSION_REMINDER',
                title: 'Session confirmed',
                body: `Your session with ${fullSession.doctor.user.name ?? 'your therapist'} is booked. We'll remind you 24 hours before.`,
                link: `/user/sessions/${fullSession.id}`,
              },
            }).catch((err) => {
              console.error('[WEBHOOK] Session-booked notification failed:', err)
            })
          }
        } catch (err) {
          console.error('[WEBHOOK] Session booking emails failed for session', payment.sessionId, err)
        }
      }

      // Post-transaction: paid workshop registration — confirmation email +
      // in-app notification. The registration row is already created inside
      // the transaction above.
      if (payment.type === 'WORKSHOP' && payment.workshopId) {
        try {
          const [workshop, userDetails] = await Promise.all([
            prisma.workshop.findUnique({
              where: { id: payment.workshopId },
              include: { presenter: { select: { name: true } } },
            }),
            prisma.user.findUnique({
              where: { id: payment.userId },
              select: { name: true, email: true },
            }),
          ])

          if (workshop && userDetails) {
            const presenterName =
              workshop.presenter?.name ?? workshop.instructorName ?? 'Mindset'

            sendWorkshopRegistrationConfirmation(userDetails.email, {
              userName: userDetails.name ?? 'there',
              workshopTitle: workshop.title,
              startsAt: workshop.startsAt,
              durationMin: workshop.durationMin,
              presenterName,
              amount: Number(payment.amount),
              workshopId: workshop.id,
            })

            await prisma.notification.create({
              data: {
                userId: payment.userId,
                kind: 'WORKSHOP_REGISTRATION_CONFIRMED',
                title: 'Workshop registration confirmed',
                body: `You're in for "${workshop.title}" on ${formatSessionDateLong(workshop.startsAt)}. We'll send a meeting link before the session.`,
                link: `/user/discover/workshops/${workshop.id}`,
              },
            }).catch((err) => {
              console.error('[WEBHOOK] Workshop notification create failed:', err)
            })

            // TODO(presenter-notifications): when Presenter model gains an
            // `email` field, send a "new registration" email here using
            // workshop.presenter — see docs/known-bugs.md.
          }
        } catch (err) {
          console.error(
            '[WEBHOOK] Workshop registration emails failed for workshop',
            payment.workshopId,
            err
          )
        }
      }
    }

    if (eventType === 'payment.failed') {
      const paymentEntity = event.payload.payment.entity
      const razorpayOrderId = paymentEntity.order_id
      console.log('[WEBHOOK] Payment failed for order:', razorpayOrderId)

      await prisma.payment.updateMany({
        where: {
          razorpayOrderId,
          status: 'PENDING',
        },
        data: { status: 'FAILED' },
      })
      console.log('[WEBHOOK] ✓ Payment marked as FAILED')

      // Fetch failed payment for stock restore + email
      const failedPayment = await prisma.payment.findUnique({
        where: { razorpayOrderId },
        include: {
          user: { select: { name: true, email: true } },
        },
      })

      // Restore stock for failed product orders
      if (failedPayment?.type === 'PRODUCT' && failedPayment.orderId) {
        try {
          const failedOrder = await prisma.order.findUnique({
            where: { id: failedPayment.orderId },
            include: { orderItems: { include: { product: { select: { isDigital: true } } } } },
          })
          if (failedOrder) {
            await prisma.$transaction(async (tx) => {
              for (const item of failedOrder.orderItems) {
                if (!item.product.isDigital) {
                  await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } },
                  })
                }
              }
              await tx.order.update({
                where: { id: failedOrder.id },
                data: { paymentStatus: 'FAILED' },
              })
            }, { maxWait: 8000, timeout: 15000 })
            console.log('[WEBHOOK] ✓ Stock restored for failed order:', failedPayment.orderId)
          }
        } catch (err) {
          console.error('[WEBHOOK] Stock restoration failed:', err)
        }
      }

      // Send payment failed email (non-blocking)
      try {
        if (failedPayment?.user) {
          const retryUrls: Record<string, string> = {
            SESSION: `${process.env.NEXT_PUBLIC_APP_URL}/user/sessions/book`,
            EBOOK: `${process.env.NEXT_PUBLIC_APP_URL}/study-materials`,
            PRODUCT: `${process.env.NEXT_PUBLIC_APP_URL}/products`,
            WORKSHOP: failedPayment.workshopId
              ? `${process.env.NEXT_PUBLIC_APP_URL}/user/discover/workshops/${failedPayment.workshopId}`
              : `${process.env.NEXT_PUBLIC_APP_URL}/user/discover/workshops`,
          }
          sendPaymentFailed(failedPayment.user.email, {
            userName: failedPayment.user.name ?? 'there',
            amount: Number(failedPayment.amount),
            type: failedPayment.type as 'SESSION' | 'EBOOK' | 'PRODUCT' | 'WORKSHOP',
            retryUrl: retryUrls[failedPayment.type] ?? process.env.NEXT_PUBLIC_APP_URL!,
          })
        }
      } catch (err) {
        console.error('[WEBHOOK] Payment failed email error:', err)
      }
    }

    console.log('[WEBHOOK] ========== WEBHOOK COMPLETE ==========\n')
    return NextResponse.json({ received: true }, { status: 200 })

  } catch (error) {
    console.error('[WEBHOOK] ========== WEBHOOK ERROR ==========')
    console.error('[WEBHOOK] Error:', error)
    console.error('[WEBHOOK] ====================================\n')
    return NextResponse.json({ received: true }, { status: 200 })
  }
}
