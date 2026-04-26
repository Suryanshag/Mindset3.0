import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const doctor = await prisma.doctor.findUnique({
      where: { slug, isActive: true },
      select: {
        id: true,
        slug: true,
        photo: true,
        designation: true,
        type: true,
        specialization: true,
        qualification: true,
        experience: true,
        bio: true,
        sessionPrice: true,
        user: { select: { name: true } },
        slots: {
          where: { isBooked: false, date: { gte: new Date() } },
          orderBy: { date: 'asc' },
          select: { id: true, date: true, isBooked: true },
        },
      },
    })

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    return NextResponse.json(doctor)
  } catch (error) {
    console.error('[DOCTOR_DETAIL_ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch doctor' }, { status: 500 })
  }
}
