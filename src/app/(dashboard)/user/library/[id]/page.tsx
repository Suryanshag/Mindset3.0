import { auth } from '@/lib/auth'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { BookOpen } from 'lucide-react'
import PageHeader from '@/components/dashboard/page-header'
import LibraryDetailActions from '@/components/library/library-detail-actions'

export default async function LibraryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [material, payment] = await Promise.all([
    prisma.studyMaterial.findUnique({
      where: { id, isPublished: true },
      select: { id: true, title: true, type: true, price: true, coverImage: true },
    }),
    prisma.payment.findFirst({
      where: {
        userId: session.user.id,
        studyMaterialId: id,
        type: 'EBOOK',
        status: 'PAID',
      },
      select: { id: true },
    }),
  ])

  if (!material) {
    return (
      <div>
        <PageHeader title="Not Available" back="/user/library" />
        <div className="flex flex-col items-center py-16 text-center px-6">
          <BookOpen size={32} className="text-text-faint mb-3" />
          <p className="text-[15px] text-text-muted">
            This material isn&apos;t available anymore.
          </p>
          <Link
            href="/user/library"
            className="mt-4 text-[13px] font-medium text-primary"
          >
            Browse the library
          </Link>
        </div>
      </div>
    )
  }

  const isFree = material.type === 'FREE'
  const isOwned = isFree || !!payment
  const price = Number(material.price ?? 0)

  return (
    <div>
      <PageHeader title={material.title} back="/user/library" />

      <div className="pt-3.5 space-y-4 pb-40 lg:pb-6 lg:max-w-[480px] lg:mx-auto">
        {/* Cover image */}
        <div
          className="relative w-full aspect-[3/4] rounded-2xl bg-bg-card overflow-hidden flex items-center justify-center"
          style={{ border: '1px solid var(--color-border)' }}
        >
          {material.coverImage ? (
            <Image
              fill
              src={material.coverImage}
              alt={material.title}
              sizes="(max-width: 768px) 100vw, 480px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <BookOpen size={48} className="text-text-faint" />
          )}
        </div>

        {/* Price / type label */}
        <div className="flex items-center gap-3">
          {isFree ? (
            <span className="text-[13px] font-medium px-2.5 py-1 rounded-full bg-primary-tint text-primary">
              Free
            </span>
          ) : isOwned ? (
            <>
              <span className="text-[13px] font-medium px-2.5 py-1 rounded-full bg-primary-tint text-primary">
                Owned
              </span>
              <span
                className="text-[13px] font-medium px-2.5 py-1 rounded-full text-text-muted"
                style={{ border: '1px solid var(--color-border)' }}
              >
                Digital
              </span>
            </>
          ) : (
            <>
              <p className="text-[22px] font-bold text-text">
                ₹{price.toLocaleString('en-IN')}
              </p>
              <span
                className="text-[13px] font-medium px-2.5 py-1 rounded-full text-text-muted"
                style={{ border: '1px solid var(--color-border)' }}
              >
                Digital
              </span>
            </>
          )}
        </div>

        {/* CTA — handled by client component */}
        <LibraryDetailActions
          materialId={id}
          title={material.title}
          price={price}
          isOwned={isOwned}
          isFree={isFree}
        />
      </div>
    </div>
  )
}
