'use client'

// Client-side interactivity for the public /ngo-visits page (which has no
// per-visit detail route): an expandable description ("Read full") and a
// full-screen photo lightbox/slideshow. Kept here so page.tsx stays a
// server component (Prisma + next/image SSR) and only these pieces hydrate.

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { format } from 'date-fns'
import { MapPin, X, ChevronLeft, ChevronRight } from 'lucide-react'

// ── Expandable description ────────────────────────────────────────────
export function NgoReadMore({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const [clamped, setClamped] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el) setClamped(el.scrollHeight > el.clientHeight + 1)
  }, [text])

  return (
    <div>
      <p
        ref={ref}
        className="text-sm text-gray-600 leading-relaxed"
        style={
          expanded
            ? undefined
            : {
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }
        }
      >
        {text}
      </p>
      {(clamped || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="text-sm font-semibold mt-1.5"
          style={{ color: 'var(--teal)' }}
        >
          {expanded ? 'Show less' : 'Read full'}
        </button>
      )}
    </div>
  )
}

// ── Full-screen lightbox / slideshow ──────────────────────────────────
function Lightbox({
  photos,
  ngoName,
  startIndex,
  onClose,
}: {
  photos: string[]
  ngoName: string
  startIndex: number
  onClose: () => void
}) {
  const [i, setI] = useState(startIndex)
  const count = photos.length
  const next = useCallback(() => setI((p) => (p + 1) % count), [count])
  const prev = useCallback(() => setI((p) => (p - 1 + count) % count), [count])

  // Esc / arrow keys + lock background scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, next, prev])

  // Auto-advance slideshow only when there's more than one photo.
  useEffect(() => {
    if (count <= 1) return
    const t = setInterval(next, 3500)
    return () => clearInterval(t)
  }, [count, next])

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          color: '#fff',
        }}
      >
        <span className="font-heading" style={{ fontSize: 18, fontWeight: 700 }}>
          {ngoName}
        </span>
        <button type="button" onClick={onClose} aria-label="Close" style={{ color: '#fff' }}>
          <X size={26} />
        </button>
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 12px',
          minHeight: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[i]}
          alt={`${ngoName} — photo ${i + 1}`}
          style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
        />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              style={navBtnStyle('left')}
            >
              <ChevronLeft size={26} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              style={navBtnStyle('right')}
            >
              <ChevronRight size={26} />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16 }}
        >
          {photos.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Go to photo ${idx + 1}`}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: idx === i ? '#fff' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      )}
    </div>,
    document.body,
  )
}

function navBtnStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute',
    [side]: 8,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    borderRadius: '50%',
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
}

// ── Clickable cover (upcoming hero) ───────────────────────────────────
export function NgoCover({
  photos,
  ngoName,
  containerClassName,
  sizes,
}: {
  photos: string[]
  ngoName: string
  containerClassName?: string
  sizes?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View ${ngoName} photos`}
        className={`relative block w-full cursor-zoom-in ${containerClassName ?? ''}`}
      >
        <Image src={photos[0]} alt={ngoName} fill className="object-cover" sizes={sizes} />
      </button>
      {open && (
        <Lightbox photos={photos} ngoName={ngoName} startIndex={0} onClose={() => setOpen(false)} />
      )}
    </>
  )
}

// ── Past visit card (cover + thumbnails + lightbox + read more) ────────
type PastVisit = {
  id: string
  ngoName: string
  location: string
  description: string
  photos: string[]
  visitDate: string // ISO
}

export function NgoPastCard({ visit }: { visit: PastVisit }) {
  const [lightbox, setLightbox] = useState<number | null>(null)
  const photos = visit.photos

  return (
    <div className="card-premium overflow-hidden">
      {photos.length > 0 && (
        <button
          type="button"
          onClick={() => setLightbox(0)}
          aria-label={`View ${visit.ngoName} photos`}
          className="relative w-full h-64 bg-gray-100 block cursor-zoom-in text-left"
        >
          <Image
            src={photos[0]}
            alt={visit.ngoName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5">
            <h3 className="font-heading text-xl font-bold text-white">{visit.ngoName}</h3>
            <p className="text-sm text-white/80 flex items-center gap-1 mt-1">
              <MapPin size={14} />
              {visit.location}
            </p>
          </div>
        </button>
      )}

      <div className="p-5">
        {photos.length === 0 && (
          <>
            <h3 className="font-heading text-xl font-bold" style={{ color: 'var(--navy)' }}>
              {visit.ngoName}
            </h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1 mb-3">
              <MapPin size={14} />
              {visit.location}
            </p>
          </>
        )}
        <p
          className="text-xs font-semibold rounded-full inline-block px-3 py-1 mb-3"
          style={{ background: 'var(--cream)', color: 'var(--navy)' }}
        >
          {format(new Date(visit.visitDate), 'dd MMM yyyy')}
        </p>

        <NgoReadMore text={visit.description} />

        {photos.length > 1 && (
          <div className="flex gap-2 mt-4">
            {photos.slice(1, 4).map((photo, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setLightbox(i + 1)}
                aria-label={`View photo ${i + 2}`}
                className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 cursor-zoom-in"
              >
                <Image
                  src={photo}
                  alt={`${visit.ngoName} photo ${i + 2}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
                {i === 2 && photos.length > 4 && (
                  <span className="absolute inset-0 bg-black/50 text-white text-xs font-bold flex items-center justify-center">
                    +{photos.length - 4}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {lightbox !== null && (
        <Lightbox
          photos={photos}
          ngoName={visit.ngoName}
          startIndex={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}
