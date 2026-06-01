import Image from 'next/image'
import { BCap, BCard, BChip } from './b-atoms'
import BPageHeader from './b-page-header'
import LibraryDetailActions from '@/components/library/library-detail-actions'

// Phase 3g — Library item detail (Direction B port).
// Acts as the "before you open it" landing for an ebook/PDF/audio piece.
// The existing LibraryDetailActions client component drives the
// purchase / open flow unchanged. The design's in-app chapter reader,
// font controls, and highlight tools are out of scope here — our model
// just hands the user a download/external open via that action.

type Props = {
  material: {
    id: string
    title: string
    type: 'FREE' | 'PAID'
    price: number
    coverImage: string | null
  }
  isOwned: boolean
}

export default function BLibraryReader({ material, isOwned }: Props) {
  const isFree = material.type === 'FREE'
  const titleTrunc = material.title.slice(0, 30).toUpperCase()
  const breadcrumb = [
    { label: 'LIBRARY', href: '/user/library' },
    { label: titleTrunc },
  ]
  const sub = isFree
    ? 'Free · in your library'
    : isOwned
      ? 'Purchased · in your library'
      : `₹${material.price.toLocaleString('en-IN')} · digital`

  return (
    <>
      <BPageHeader title={material.title} breadcrumb={breadcrumb} back="/user/library" sub={sub} ctas={['search']} />

      {/* Status row */}
      <div className="flex gap-2 items-center">
        <BChip kind={isFree ? 'primary' : 'workshop'}>
          {isFree ? 'FREE' : `₹${material.price.toLocaleString('en-IN')}`}
        </BChip>
        {isOwned && <BChip kind="primary">IN YOUR LIBRARY</BChip>}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-faint)',
          }}
        >
          DIGITAL · YOURS TO KEEP
        </span>
      </div>

      {/* 2-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
        {/* LEFT — cover + about */}
        <BCard padding={0} style={{ overflow: 'hidden' }}>
          <div
            style={{
              position: 'relative',
              background: 'var(--bg-paper)',
              aspectRatio: '4 / 3',
              borderBottom: '1px solid var(--border)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {material.coverImage ? (
              <Image
                fill
                src={material.coverImage}
                alt={material.title}
                sizes="(max-width: 1024px) 100vw, 720px"
                style={{ objectFit: 'contain' }}
                unoptimized
              />
            ) : (
              <span
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)' }}
              >
                [ COVER ]
              </span>
            )}
          </div>
          <div style={{ padding: '28px 36px' }}>
            <BCap>About this reading</BCap>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 18,
                color: 'var(--text)',
                marginTop: 14,
                lineHeight: 1.75,
              }}
            >
              {material.title}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--text-muted)',
                marginTop: 14,
                lineHeight: 1.7,
              }}
            >
              {isOwned
                ? 'This is in your library. Open it any time — you keep the file even if you cancel your account.'
                : isFree
                  ? "This piece is free. Add it to your library to keep a copy you can open later."
                  : 'A digital reading from Mindset. One-time purchase, yours to keep.'}
            </p>
          </div>
        </BCard>

        {/* RIGHT — actions + meta */}
        <div className="flex flex-col gap-3.5">
          <BCard padding={16}>
            <BCap>{isOwned ? 'Open' : isFree ? 'Add to library' : 'Buy this reading'}</BCap>
            <div style={{ marginTop: 12 }}>
              <LibraryDetailActions
                materialId={material.id}
                title={material.title}
                price={material.price}
                isOwned={isOwned}
                isFree={isFree}
              />
            </div>
            {!isFree && !isOwned && (
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--text-faint)',
                  marginTop: 8,
                  textAlign: 'center',
                  letterSpacing: '0.06em',
                }}
              >
                SECURED BY RAZORPAY · NO RECURRING CHARGE
              </p>
            )}
          </BCard>

          <BCard padding={16}>
            <BCap>How to read</BCap>
            <ul
              style={{
                marginTop: 10,
                paddingLeft: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontFamily: 'var(--font-serif)',
                fontSize: 13.5,
                color: 'var(--text-muted)',
                lineHeight: 1.55,
              }}
            >
              <li>Open it in any PDF reader — your phone, tablet, or laptop.</li>
              <li>You can highlight and annotate locally; nothing is sent to us.</li>
              <li>Re-download any time from your library page.</li>
            </ul>
          </BCard>

          <BCard accent="var(--accent)" padding={14}>
            <BCap style={{ color: 'var(--accent-deep)' }}>By the editors</BCap>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 12.5,
                color: 'var(--text-muted)',
                marginTop: 8,
                lineHeight: 1.55,
              }}
            >
              Mindset readings are slow. We don&rsquo;t algorithmically rank
              them, we don&rsquo;t recommend by mood, and we keep editing
              them as we learn.
            </p>
          </BCard>
        </div>
      </div>
    </>
  )
}
