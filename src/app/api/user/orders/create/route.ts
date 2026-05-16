import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { createOrderSchema } from '@/lib/validations/order'
import { getServiceableCouriers, getPickupPincode } from '@/lib/shiprocket'
import { generateOrderNumber } from '@/lib/order-number'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)
    if (session.user.role !== 'USER' && session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const body = await req.json()
    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

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
        weight: true,
      },
    })

    if (products.length !== productIds.length) {
      return errorResponse('One or more products not found', 400)
    }

    // Validate each product
    for (const item of items) {
      const product = products.find(p => p.id === item.productId)!
      if (!product.isActive) {
        return errorResponse(`${product.name} is no longer available`, 400)
      }
      if (product.stock < item.quantity) {
        return errorResponse(`Insufficient stock for ${product.name}. Available: ${product.stock}`, 400)
      }
    }

    // Calculate subtotal from DB prices (never trust client)
    const subtotal = items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId)!
      return sum + Number(product.price) * item.quantity
    }, 0)

    // Calculate total weight for courier verification
    const totalWeight = items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId)!
      return sum + (Number(product.weight ?? 0.5) * item.quantity)
    }, 0)

    // Server-side verify: re-fetch courier rates to prevent price manipulation
    const pickupPostcode = getPickupPincode()
    if (!pickupPostcode) {
      return errorResponse('Shipping not configured. Please contact support.', 500)
    }

    const couriers = await getServiceableCouriers({
      pickupPostcode,
      deliveryPostcode: shippingAddress.pincode,
      weight: Math.max(totalWeight, 0.1),
      cod: 0,
    })

    const selectedCourier = couriers.find(c => c.courierId === selectedCourierId)
    if (!selectedCourier) {
      return errorResponse(
        'Selected courier is no longer available. Please select again.',
        400
      )
    }

    // Use server-verified rate
    const verifiedDeliveryCharge = selectedCourier.rate

    // Validate client sent roughly correct amount (±5% tolerance)
    const tolerance = verifiedDeliveryCharge * 0.05
    if (Math.abs(deliveryCharge - verifiedDeliveryCharge) > Math.max(tolerance, 1)) {
      console.warn('[ORDER] Delivery charge mismatch:', 'client:', deliveryCharge, 'server:', verifiedDeliveryCharge)
      return errorResponse('Delivery charge has changed. Please refresh and try again.', 400)
    }

    const totalAmount = subtotal + verifiedDeliveryCharge

    // Create order + order items + reduce stock in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const orderNumber = await generateOrderNumber(tx)
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          orderNumber,
          totalAmount,
          deliveryCharge: verifiedDeliveryCharge,
          selectedCourierId,
          selectedCourierName,
          paymentStatus: 'PENDING',
          shippingStatus: 'PENDING',
          shippingAddress: shippingAddress as object,
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
        select: {
          id: true,
          totalAmount: true,
        },
      })

      // Reduce stock for each product
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      }

      return newOrder
    }, { maxWait: 8000, timeout: 15000 })

    return successResponse({
      orderId: order.id,
      totalAmount: Number(order.totalAmount),
    }, 201)

  } catch (error) {
    console.error('[CREATE_ORDER_ERROR]', error)
    return serverErrorResponse()
  }
}
