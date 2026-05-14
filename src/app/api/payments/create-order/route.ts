import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { razorpay } from '@/lib/razorpay'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { getServiceableCouriers, getPickupPincode } from '@/lib/shiprocket'
import { z } from 'zod'
import { apiLimiter } from '@/lib/arcjet'
import { handleArcjetDenial } from '@/lib/arcjet-protect'

const paymentSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('SESSION'),
    sessionId: z.string().cuid(),
  }),
  z.object({
    type: z.literal('PRODUCT'),
    items: z.array(z.object({
      productId: z.string().cuid(),
      quantity: z.number().int().min(1).max(100),
    })).min(1),
    digital: z.boolean().optional(),
    shippingAddress: z.object({
      name: z.string().min(2).max(100),
      phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
      addressLine1: z.string().min(5).max(200),
      addressLine2: z.string().max(200).optional(),
      city: z.string().min(2).max(100),
      state: z.string().min(2).max(100),
      pincode: z.string().regex(/^\d{6}$/, 'Invalid PIN code'),
    }).optional(),
    selectedCourierId: z.coerce.number().int().positive().finite().optional(),
    selectedCourierName: z.string().min(1).optional(),
    deliveryCharge: z.coerce.number().min(0).finite().optional(),
  }),
  z.object({
    type: z.literal('EBOOK'),
    studyMaterialId: z.string().cuid(),
  }),
])

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', 401)
    }

    const decision = await apiLimiter.protect(req)
    const denied = handleArcjetDenial(decision)
    if (denied) return denied

    const body = await req.json()
    const parsed = paymentSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const { type } = parsed.data
    let amountInPaise: number
    let receiptId: string
    let metadata: Record<string, string> = {}

    if (type === 'SESSION') {
      const { sessionId } = parsed.data

      const therapySession = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          doctor: { select: { sessionPrice: true } },
        },
      })

      if (!therapySession) {
        return errorResponse('Session not found', 404)
      }
      if (therapySession.userId !== session.user.id) {
        return errorResponse('Forbidden', 403)
      }
      if (therapySession.paymentStatus === 'PAID') {
        return errorResponse('Session already paid', 400)
      }

      amountInPaise = Math.round(Number(therapySession.doctor.sessionPrice) * 100)
      receiptId = `session_${sessionId}`
      metadata = { sessionId, userId: session.user.id }

    } else if (type === 'PRODUCT') {
      const { items, shippingAddress, selectedCourierId, selectedCourierName, deliveryCharge } = parsed.data

      // Fetch all products and validate
      const productIds = items.map(i => i.productId)
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          isActive: true,
          isDigital: true,
          weight: true,
        },
      })

      if (products.length !== productIds.length) {
        return errorResponse('One or more products not found', 400)
      }

      const allDigital = products.every(p => p.isDigital)
      const hasPhysical = !allDigital

      for (const item of items) {
        const product = products.find(p => p.id === item.productId)!
        if (!product.isActive) {
          return errorResponse(`${product.name} is no longer available`, 400)
        }
        if (!product.isDigital && product.stock < item.quantity) {
          return errorResponse(`Insufficient stock for ${product.name}. Available: ${product.stock}`, 400)
        }
      }

      if (hasPhysical && !shippingAddress) {
        return errorResponse('Shipping address required for physical products', 400)
      }

      // Calculate subtotal from DB prices (never trust client)
      const subtotal = items.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId)!
        return sum + Number(product.price) * item.quantity
      }, 0)

      let verifiedDeliveryCharge = 0

      if (hasPhysical) {
        const totalWeight = items.reduce((sum, item) => {
          const product = products.find(p => p.id === item.productId)!
          if (product.isDigital) return sum
          return sum + (Number(product.weight ?? 0.5) * item.quantity)
        }, 0)

        // Server-side verify courier rates
        const pickupPostcode = getPickupPincode()
        if (!pickupPostcode) {
          return errorResponse('Shipping not configured. Please contact support.', 500)
        }

        const couriers = await getServiceableCouriers({
          pickupPostcode,
          deliveryPostcode: shippingAddress!.pincode,
          weight: Math.max(totalWeight, 0.1),
          cod: 0,
        })

        const selectedCourier = couriers.find(c => c.courierId === selectedCourierId)
        if (!selectedCourier) {
          return errorResponse('Selected courier is no longer available. Please select again.', 400)
        }

        verifiedDeliveryCharge = selectedCourier.rate
        const tolerance = verifiedDeliveryCharge * 0.05
        if (Math.abs((deliveryCharge ?? 0) - verifiedDeliveryCharge) > Math.max(tolerance, 1)) {
          console.warn('[PAYMENT] Delivery charge mismatch:', 'client:', deliveryCharge, 'server:', verifiedDeliveryCharge)
          return errorResponse('Delivery charge has changed. Please refresh and try again.', 400)
        }
      }

      const totalAmount = subtotal + verifiedDeliveryCharge
      amountInPaise = Math.round(totalAmount * 100)

      // Create Razorpay order first (before DB transaction)
      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `order_new`.substring(0, 40),
        notes: { userId: session.user.id },
      })

      // Create Order + OrderItems + Payment atomically
      const result = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            userId: session.user.id,
            totalAmount,
            deliveryCharge: verifiedDeliveryCharge,
            selectedCourierId: hasPhysical ? selectedCourierId : undefined,
            selectedCourierName: hasPhysical ? selectedCourierName : undefined,
            paymentStatus: 'PENDING',
            shippingStatus: allDigital ? 'DELIVERED' : 'PENDING',
            shippingAddress: (hasPhysical ? shippingAddress : {}) as object,
            orderItems: {
              create: items.map(item => {
                const product = products.find(p => p.id === item.productId)!
                return {
                  productId: item.productId,
                  quantity: item.quantity,
                  price: Number(product.price),
                }
              }),
            },
          },
          select: { id: true },
        })

        // Decrement stock for non-digital items
        for (const item of items) {
          const product = products.find(p => p.id === item.productId)!
          if (!product.isDigital) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            })
          }
        }

        // Create Payment record
        const payment = await tx.payment.create({
          data: {
            userId: session.user.id,
            amount: totalAmount,
            type: 'PRODUCT',
            razorpayOrderId: razorpayOrder.id,
            status: 'PENDING',
            orderId: newOrder.id,
          },
        })

        return { orderId: newOrder.id, paymentId: payment.id, razorpayOrderId: razorpayOrder.id }
      }, { maxWait: 8000, timeout: 15000 })

      return successResponse({
        razorpayOrderId: result.razorpayOrderId,
        amount: amountInPaise,
        currency: 'INR',
        paymentId: result.paymentId,
        orderId: result.orderId,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      })

    } else {
      const { studyMaterialId } = parsed.data

      const material = await prisma.studyMaterial.findUnique({
        where: { id: studyMaterialId },
      })

      if (!material) {
        return errorResponse('Study material not found', 404)
      }
      if (material.type === 'FREE') {
        return errorResponse('This material is free', 400)
      }
      if (!material.price) {
        return errorResponse('Price not set for this material', 400)
      }

      const existingPayment = await prisma.payment.findFirst({
        where: {
          userId: session.user.id,
          studyMaterialId,
          status: 'PAID',
        },
      })
      if (existingPayment) {
        return errorResponse('Already purchased', 400)
      }

      amountInPaise = Math.round(Number(material.price) * 100)
      receiptId = `ebook_${studyMaterialId}`
      metadata = { studyMaterialId, userId: session.user.id }
    }

    // SESSION and EBOOK flows: create Razorpay order + Payment (no DB order needed)
    // PRODUCT flow returns early above, so this only runs for SESSION/EBOOK
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptId!.substring(0, 40),
      notes: metadata,
    })

    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        amount: amountInPaise / 100,
        type,
        razorpayOrderId: razorpayOrder.id,
        status: 'PENDING',
        sessionId: type === 'SESSION' ? parsed.data.sessionId : null,
        orderId: null,
        studyMaterialId: type === 'EBOOK' ? parsed.data.studyMaterialId : null,
      },
    })

    return successResponse({
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      paymentId: payment.id,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })

  } catch (error) {
    console.error('[CREATE_ORDER_ERROR]', error)
    return serverErrorResponse()
  }
}
