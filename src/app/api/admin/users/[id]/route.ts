import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
        sessions: {
          orderBy: { date: 'desc' },
          select: {
            id: true,
            date: true,
            status: true,
            paymentStatus: true,
            meetLink: true,
            doctor: {
              select: {
                user: { select: { name: true } },
                designation: true,
              },
            },
          },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            totalAmount: true,
            paymentStatus: true,
            shippingStatus: true,
            awbCode: true,
            createdAt: true,
            orderItems: {
              select: {
                quantity: true,
                price: true,
                product: { select: { name: true } },
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            type: true,
            status: true,
            razorpayPaymentId: true,
            createdAt: true,
          },
        },
        assignments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
            createdAt: true,
            doctor: {
              select: { user: { select: { name: true } } },
            },
          },
        },
      },
    })

    if (!user) {
      return errorResponse('User not found', 404)
    }

    return successResponse(user)
  } catch (error) {
    console.error('[ADMIN_USER_GET]', error)
    return serverErrorResponse()
  }
}
