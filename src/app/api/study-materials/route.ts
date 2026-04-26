import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const materials = await prisma.studyMaterial.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        type: true,
        price: true,
        coverImage: true,
        fileUrl: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(materials)
  } catch (error) {
    console.error('Failed to fetch study materials:', error)
    return NextResponse.json({ error: 'Failed to fetch study materials' }, { status: 500 })
  }
}
