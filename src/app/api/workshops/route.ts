import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const workshops = await prisma.workshop.findMany({
      where: { published: true },
      select: {
        id: true,
        title: true,
        subtitle: true,
        description: true,
        coverImageUrl: true,
        instructorName: true,
        startsAt: true,
        durationMin: true,
        priceCents: true,
        capacity: true,
      },
      orderBy: { startsAt: 'desc' },
    })
    // Include legacy field names for public workshops page compat
    const mapped = workshops.map((w) => ({
      ...w,
      date: w.startsAt,
      image: w.coverImageUrl,
    }))
    return NextResponse.json(mapped)
  } catch (error) {
    console.error('Failed to fetch workshops:', error)
    return NextResponse.json({ error: 'Failed to fetch workshops' }, { status: 500 })
  }
}
