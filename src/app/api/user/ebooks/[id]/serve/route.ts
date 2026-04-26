import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { id } = await params

  const material = await prisma.studyMaterial.findUnique({
    where: { id, isPublished: true },
    select: { id: true, title: true, type: true, fileUrl: true },
  })

  if (!material) {
    return new Response('Not found', { status: 404 })
  }

  // For paid materials, verify the user has purchased it
  if (material.type === 'PAID') {
    const payment = await prisma.payment.findFirst({
      where: {
        userId: session.user.id,
        type: 'EBOOK',
        status: 'PAID',
        studyMaterialId: material.id,
      },
    })

    if (!payment) {
      return new Response('Not purchased', { status: 403 })
    }
  }

  // Fetch the PDF from Cloudinary (server-side only)
  const pdfResponse = await fetch(material.fileUrl)

  if (!pdfResponse.ok) {
    return new Response('Failed to fetch file', { status: 502 })
  }

  const pdfBuffer = await pdfResponse.arrayBuffer()

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${material.title}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
