import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const visits = await prisma.ngoVisit.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        ngoName: true,
        location: true,
        description: true,
        photos: true,
        visitDate: true,
      },
      orderBy: { visitDate: 'desc' },
    })
    return NextResponse.json(visits)
  } catch (error) {
    console.error('Failed to fetch NGO visits:', error)
    return NextResponse.json({ error: 'Failed to fetch NGO visits' }, { status: 500 })
  }
}
