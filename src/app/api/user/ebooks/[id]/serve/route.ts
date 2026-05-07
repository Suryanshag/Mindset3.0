import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { id } = await params
  const download = request.nextUrl.searchParams.get('download') === '1'

  const material = await prisma.studyMaterial.findUnique({
    where: { id, isPublished: true },
    select: { id: true, title: true, type: true, fileUrl: true },
  })

  if (!material) {
    return new Response('Not found', { status: 404 })
  }

  let paymentId: string | null = null

  if (material.type === 'PAID') {
    const payment = await prisma.payment.findFirst({
      where: {
        userId: session.user.id,
        type: 'EBOOK',
        status: 'PAID',
        studyMaterialId: material.id,
      },
      select: { id: true },
    })

    if (!payment) {
      return new Response('Not purchased', { status: 403 })
    }

    paymentId = payment.id
  }

  const pdfResponse = await fetch(material.fileUrl)
  if (!pdfResponse.ok) {
    return new Response('Failed to fetch file', { status: 502 })
  }

  const pdfBuffer = await pdfResponse.arrayBuffer()
  const disposition = download
    ? `attachment; filename="${material.title}.pdf"`
    : `inline; filename="${material.title}.pdf"`

  // Watermark paid content only — regenerated on every request (serverless-safe, no cache)
  if (material.type === 'PAID' && paymentId) {
    const userEmail = session.user.email ?? session.user.id
    const stamp = `${userEmail} · ${paymentId} · ${new Date().toISOString().split('T')[0]}`

    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    for (const page of pdfDoc.getPages()) {
      const { width, height } = page.getSize()
      page.drawText(stamp, {
        x: width / 2 - 180,
        y: height / 2,
        size: 14,
        font,
        color: rgb(0.75, 0.75, 0.75),
        opacity: 0.35,
        rotate: degrees(45),
      })
    }

    const stamped = await pdfDoc.save()
    return new Response(Buffer.from(stamped), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition,
        'Cache-Control': 'private, no-store',
      },
    })
  }

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': disposition,
      'Cache-Control': 'private, no-store',
    },
  })
}
