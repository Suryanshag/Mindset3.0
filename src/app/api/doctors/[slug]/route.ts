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

    // Filter out slots that fall within any active leave range. Slots
    // stay in the DB (non-destructive) — we just hide them from public
    // booking while doctor is on leave.
    const leaves = await prisma.doctorLeave.findMany({
      where: {
        doctorId: doctor.id,
        endDate: { gte: new Date() },
      },
      select: { startDate: true, endDate: true },
    })

    const filteredSlots = leaves.length === 0
      ? doctor.slots
      : doctor.slots.filter((s) => !isOnLeave(s.date, leaves))

    return NextResponse.json({ ...doctor, slots: filteredSlots })
  } catch (error) {
    console.error('[DOCTOR_DETAIL_ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch doctor' }, { status: 500 })
  }
}

function isOnLeave(
  slotDate: Date,
  leaves: { startDate: Date; endDate: Date }[]
): boolean {
  const dayStart = new Date(slotDate)
  dayStart.setHours(0, 0, 0, 0)
  return leaves.some((l) => {
    const ls = new Date(l.startDate)
    ls.setHours(0, 0, 0, 0)
    const le = new Date(l.endDate)
    le.setHours(23, 59, 59, 999)
    return dayStart >= ls && dayStart <= le
  })
}
