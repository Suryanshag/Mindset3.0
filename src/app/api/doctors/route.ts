import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        photo: true,
        designation: true,
        type: true,
        specialization: true,
        experience: true,
        sessionPrice: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ success: true, data: doctors })
  } catch (error) {
    console.error('Failed to fetch doctors:', error)
    return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 })
  }
}
