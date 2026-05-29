import { auth } from '@/lib/auth'
import Image from 'next/image'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CalendarDays, MapPin, HeartHandshake } from 'lucide-react'
import PageHeader from '@/components/dashboard/page-header'
import { formatSessionDateLong } from '@/lib/format-date'
import NgoRegisterButton from '@/components/ngo/register-button'

export default async function NgoVisitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [visit, myRegistration, totalCount, whatsappLink] = await Promise.all([
    prisma.ngoVisit.findUnique({ where: { id } }),
    prisma.ngoJoinRequest.findUnique({
      where: { userId_ngoVisitId: { userId: session.user.id, ngoVisitId: id } },
    }),
    prisma.ngoJoinRequest.count({
      where: { ngoVisitId: id, status: { not: 'CANCELLED' } },
    }),
    prisma.whatsappLink.findFirst({ select: { link: true, label: true } }),
  ])

  if (!visit || !visit.isPublished) notFound()

  const isPast = visit.visitDate < new Date()
  const isRegistered = !!myRegistration
  const isFull = visit.capacity != null && totalCount >= visit.capacity
  const spotsLeft = visit.capacity != null ? Math.max(0, visit.capacity - totalCount) : null
  const firstPhoto = visit.photos[0] ?? null
  const initial = visit.ngoName[0]?.toUpperCase() ?? '?'

  return (
    <div>
      <PageHeader title="NGO Visit" back="/user/discover/ngo-visits" />

      <div className="space-y-4 pt-5 pb-24">
        {firstPhoto ? (
          <div className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden">
            <Image
              fill
              src={firstPhoto}
              alt={visit.ngoName}
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div
            className="relative w-full aspect-[3/2] rounded-2xl flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, var(--color-accent-tint) 0%, var(--color-accent) 100%)',
            }}
          >
            <span className="text-[88px] font-medium text-white opacity-90">{initial}</span>
          </div>
        )}

        <div>
          <h2 className="text-[22px] font-medium text-text leading-tight">{visit.ngoName}</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
            <div className="flex items-center gap-1.5">
              <CalendarDays size={13} className="text-text-faint" />
              <p className="text-[13px] text-text-muted">{formatSessionDateLong(visit.visitDate)}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="text-text-faint" />
              <p className="text-[13px] text-text-muted">{visit.location}</p>
            </div>
          </div>
        </div>

        <div
          className="bg-bg-card rounded-2xl p-4 lg:p-5"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <p className="text-[14px] text-text leading-relaxed whitespace-pre-wrap">
            {visit.description}
          </p>
        </div>

        {visit.photos.length > 1 && (
          <div className="grid grid-cols-3 gap-2">
            {visit.photos.slice(1, 4).map((photo, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                <Image
                  fill
                  src={photo}
                  alt={`${visit.ngoName} photo ${i + 2}`}
                  sizes="(max-width: 768px) 33vw, 200px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
        )}

        {isRegistered && totalCount > 0 && (
          <p className="text-[12px] text-text-muted">
            {totalCount} {totalCount === 1 ? 'person' : 'people'} joining
          </p>
        )}

        {visit.capacity != null && !isPast && !isRegistered && (
          <p className="text-[12px] text-text-muted">
            {isFull
              ? 'All spots are filled'
              : `${spotsLeft} of ${visit.capacity} ${spotsLeft === 1 ? 'spot' : 'spots'} left`}
          </p>
        )}

        {isPast ? (
          <div
            className="bg-bg-card rounded-2xl p-5 text-center"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <p className="text-[14px] text-text-muted">This visit has already happened.</p>
          </div>
        ) : isRegistered ? (
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'var(--color-primary-tint)',
              border: '1px solid var(--color-primary)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <HeartHandshake size={18} className="text-primary" />
              <p className="text-[16px] font-medium text-primary">You're registered!</p>
            </div>
            {whatsappLink?.link ? (
              <>
                <a
                  href={whatsappLink.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full px-4 py-3 rounded-xl text-white font-medium text-[14px] mt-1"
                  style={{ background: '#25D366' }}
                >
                  Join the WhatsApp group →
                </a>
                <p className="text-[12px] text-text-muted mt-3">
                  We'll send reminders before the visit. See you there.
                </p>
              </>
            ) : (
              <p className="text-[13px] text-text-muted mt-1">
                We'll email you reminders before the visit. See you there.
              </p>
            )}
          </div>
        ) : isFull ? (
          <div
            className="bg-bg-card rounded-2xl p-5 text-center"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <p className="text-[14px] text-text-muted">
              All spots are filled for this visit.
            </p>
          </div>
        ) : (
          <NgoRegisterButton ngoVisitId={visit.id} />
        )}
      </div>
    </div>
  )
}
