import { prisma } from '@/lib/prisma'

// Serialized shape: Decimal → string, Date → ISO string. Matches the
// JSON wire format that GET /api/user/orders returns today, so the
// existing component interfaces (totalAmount: string, createdAt: string,
// price: string) keep working byte-for-byte. Server components call this
// directly; the API route stays around for any caller that still uses it.

export type UserOrderItem = {
  quantity: number
  price: string
  product: { name: string; image: string | null; isDigital: boolean }
}

export type UserOrder = {
  id: string
  orderNumber: string | null
  totalAmount: string
  deliveryCharge: string
  paymentStatus: string
  shippingStatus: string
  awbCode: string | null
  courierName: string | null
  createdAt: string
  shippingAddress: unknown
  orderItems: UserOrderItem[]
}

export async function getUserOrders(userId: string): Promise<UserOrder[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    select: {
      id: true,
      orderNumber: true,
      totalAmount: true,
      deliveryCharge: true,
      paymentStatus: true,
      shippingStatus: true,
      awbCode: true,
      courierName: true,
      createdAt: true,
      shippingAddress: true,
      orderItems: {
        select: {
          quantity: true,
          price: true,
          product: {
            select: { name: true, image: true, isDigital: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    totalAmount: o.totalAmount.toString(),
    deliveryCharge: o.deliveryCharge.toString(),
    paymentStatus: o.paymentStatus,
    shippingStatus: o.shippingStatus,
    awbCode: o.awbCode,
    courierName: o.courierName,
    createdAt: o.createdAt.toISOString(),
    shippingAddress: o.shippingAddress,
    orderItems: o.orderItems.map((oi) => ({
      quantity: oi.quantity,
      price: oi.price.toString(),
      product: oi.product,
    })),
  }))
}
