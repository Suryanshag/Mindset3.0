import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendSessionBookingConfirmation, sendDoctorNewBookingNotification, sendPaymentFailed, sendEbookPurchased, sendOrderConfirmation } from '@/lib/email-service'
import { createShipmentForOrder } from '@/lib/create-shipment-for-order'

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
        console.log('[WEBHOOK] ERROR: Payment not found for order:', razorpayOrderId)
        return NextResponse.json({ received: true })
      }

      if (payment.status === 'PAID') {
        console.log('[WEBHOOK] Payment already processed, skipping')
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
          }
        } catch (err) {
          console.error('[WEBHOOK] Session booking emails failed for session', payment.sessionId, err)
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
          }
          sendPaymentFailed(failedPayment.user.email, {
            userName: failedPayment.user.name ?? 'there',
            amount: Number(failedPayment.amount),
            type: failedPayment.type as 'SESSION' | 'EBOOK' | 'PRODUCT',
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
