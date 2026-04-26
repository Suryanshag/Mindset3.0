import { prisma } from '@/lib/prisma'
import { createShipment, generateAWB } from '@/lib/shiprocket'

export async function createShipmentForOrder(
  orderId: string
): Promise<void> {
  console.log('[SHIPMENT] Creating shipment for order:', orderId)

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
      orderItems: {
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              weight: true,
            },
          },
        },
      },
    },
  })

  if (!order) {
    console.error('[SHIPMENT] Order not found:', orderId)
    return
  }

  if (order.shippingStatus !== 'PENDING') {
    console.log('[SHIPMENT] Already processed:', orderId)
    return
  }

  const addr = order.shippingAddress as {
    name: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    pincode: string
    phone?: string
  }

  const shippingAddress = {
    name: addr.name,
    addressLine1: addr.addressLine1,
    addressLine2: addr.addressLine2,
    city: addr.city,
    state: addr.state,
    pincode: addr.pincode,
    phone: addr.phone || order.user.phone || '9999999999',
    email: order.user.email,
  }

  const items = order.orderItems.map((item) => ({
    name: item.product.name,
    sku: item.product.sku ?? `SKU-${item.productId.slice(-6)}`,
    units: item.quantity,
    selling_price: Number(item.price),
  }))

  const totalWeight = order.orderItems.reduce((sum, item) => {
    return sum + (Number(item.product.weight ?? 0.5) * item.quantity)
  }, 0)

  try {
    const shipment = await createShipment({
      orderId: order.id,
      orderDate: order.createdAt,
      channelOrderId: order.id.slice(-12).toUpperCase(),
      billingAddress: shippingAddress,
      shippingAddress,
      items,
      totalAmount: Number(order.totalAmount),
      paymentMethod: 'Prepaid',
      subTotal: Number(order.totalAmount),
      length: 20,
      breadth: 15,
      height: 10,
      weight: Math.max(totalWeight, 0.1),
    })

    let awbCode = shipment.awb_code || null
    let courierName = shipment.courier_name || null

    // If user selected a specific courier, assign it via AWB generation
    if (order.selectedCourierId && shipment.shipment_id) {
      try {
        const awbResult = await generateAWB(shipment.shipment_id, order.selectedCourierId)
        if (awbResult.awb_code) {
          awbCode = awbResult.awb_code
          courierName = order.selectedCourierName || courierName
        }
        console.log('[SHIPMENT] Assigned courier:', order.selectedCourierId, 'AWB:', awbResult.awb_code)
      } catch (awbErr) {
        console.error('[SHIPMENT] AWB assignment failed, using auto-assigned courier:', awbErr)
      }
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        shiprocketOrderId: shipment.order_id,
        shiprocketShipmentId: shipment.shipment_id,
        awbCode,
        courierName,
        shippingStatus: 'PROCESSING',
      },
    })

    console.log('[SHIPMENT] Created successfully:', {
      orderId,
      shiprocketOrderId: shipment.order_id,
      awb: awbCode,
      courier: courierName,
    })
  } catch (err) {
    console.error('[SHIPMENT] Failed for order:', orderId, err)
  }
}
