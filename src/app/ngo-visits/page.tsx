import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import { format } from 'date-fns'
import { MapPin } from 'lucide-react'
import Navbar from '@/components/Navbar'
import MarketingFooter from '@/components/marketing-footer'
import { NgoJoinCta } from './join-cta'

// Marketing chrome match: this page now wears the same Navbar + WP-style
// block-blog-hero header + block-footer that /workshops, /products,
// /doctors, /team, /study-materials all use. Body cards stay React-
// rendered (we keep server-side Prisma + next/image), but they live
// inside the same wp-block-group container the other marketing pages
// emit, so spacing / typography inherit from globals.css the same way.

export const metadata = {
  title: 'NGO Visits — Mindset',
  description: 'See our community outreach visits and join upcoming drives.',
  alternates: { canonical: '/ngo-visits' },
}

export default async function NgoVisitsPage() {
  const now = new Date()
  const visitSelect = {
    id: true,
    ngoName: true,
    location: true,
    description: true,
    photos: true,
    visitDate: true,
    capacity: true,
  } as const

  const [upcoming, past] = await Promise.all([
    prisma.ngoVisit.findFirst({
      where: { isPublished: true, visitDate: { gte: now } },
      select: visitSelect,
      orderBy: { visitDate: 'asc' },
    }),
    prisma.ngoVisit.findMany({
      where: { isPublished: true, visitDate: { lt: now } },
      select: visitSelect,
      orderBy: { visitDate: 'desc' },
    }),
  ])

  const upcomingFilled =
    upcoming && upcoming.capacity != null
      ? await prisma.ngoJoinRequest.count({
          where: { ngoVisitId: upcoming.id, status: { not: 'CANCELLED' } },
        })
      : 0

  const allVisits = [...(upcoming ? [upcoming] : []), ...past]
  const totalVisits = allVisits.length

  const capacityHint = upcoming
    ? upcoming.capacity != null
      ? `${upcomingFilled} of ${upcoming.capacity} spots filled`
      : 'Open registration'
    : null

  return (
    <>
      <Navbar light />
      <main className="wp-block-group is-layout-flow wp-block-group-is-layout-flow">
        <div className="entry-content wp-block-post-content is-layout-flow wp-block-post-content-is-layout-flow">
          {/* WP-style hero — matches /workshops byte-for-byte (selectors,
              shapes, container). Inherits font, color, spacing from
              globals.css §block-blog-hero. */}
          <section className="block-blog-hero">
            <div className="block-blog-hero__container container">
              <div className="block-blog-hero__heading-wrapper">
                <h1 className="block-blog-hero__heading">NGO Visits</h1>
                <h2 className="block-blog-hero__subheading">
                  Our community outreach brings mental health awareness to those
                  who need it most. See our impact and join our next drive.
                </h2>
              </div>
            </div>
            <div className="block-blog-hero__shapes">
              <div className="block-blog-hero__shape block-blog-hero__shape--1" data-shape-animate>
                <img width="173" height="193" decoding="async" src="/images/decoration/blog-shape-1.svg" alt="" />
              </div>
              <div className="block-blog-hero__shape block-blog-hero__shape--2" data-shape-animate>
                <img width="179" height="194" decoding="async" src="/images/decoration/blog-shape-2.svg" alt="" />
              </div>
              <div className="block-blog-hero__shape block-blog-hero__shape--3" data-shape-animate>
                <img width="219" height="215" decoding="async" src="/images/decoration/blog-shape-3.svg" alt="" />
              </div>
              <div className="block-blog-hero__shape block-blog-hero__shape--4" data-shape-animate>
                <img width="182" height="194" decoding="async" src="/images/decoration/blog-shape-4.svg" alt="" />
              </div>
              <div className="block-blog-hero__shape block-blog-hero__shape--5" data-shape-animate>
                <img width="170" height="136" decoding="async" src="/images/decoration/blog-shape-5.svg" alt="" />
              </div>
            </div>
          </section>

          {/* Body container — same `container` width as /workshops listing
              so cards sit on the same gutter. Cards remain React-rendered
              so we keep next/image optimisation for the NGO photos. */}
          <section className="block-blog-listing">
            <div className="block-blog-listing__container container">
              {/* Stats Bar — brand-token coloured. Same --coral / --teal /
                  --amber are used across the marketing site (defined in
                  globals.css :root), so these chips read as the same
                  palette as the WP-style blocks above and below. */}
              {totalVisits > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
                  <div className="card-premium p-6 text-center">
                    <p
                      className="font-heading text-3xl md:text-4xl font-bold"
                      style={{ color: 'var(--coral)' }}
                    >
                      {totalVisits}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Visits Completed</p>
                  </div>
                  <div className="card-premium p-6 text-center">
                    <p
                      className="font-heading text-3xl md:text-4xl font-bold"
                      style={{ color: 'var(--teal)' }}
                    >
                      {new Set(allVisits.map((v) => v.location)).size}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Locations Covered</p>
                  </div>
                  <div className="card-premium p-6 text-center hidden md:block">
                    <p
                      className="font-heading text-3xl md:text-4xl font-bold"
                      style={{ color: 'var(--amber)' }}
                    >
                      {new Set(allVisits.map((v) => v.ngoName)).size}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">NGO Partners</p>
                  </div>
                </div>
              )}

              {/* Hero — the next upcoming drive, with a register CTA. The
                  CTA is auth-aware: signed-in users land on the dashboard
                  detail page, guests hit login with a callback to it. */}
              {upcoming ? (
                <div className="card-premium overflow-hidden mb-12">
                  <div className="grid md:grid-cols-2">
                    {upcoming.photos.length > 0 ? (
                      <div className="relative h-56 md:h-auto md:min-h-[280px] bg-gray-100">
                        <Image
                          src={upcoming.photos[0]}
                          alt={upcoming.ngoName}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    ) : (
                      <div className="hidden md:block" style={{ background: 'var(--cream)' }} />
                    )}

                    <div className="p-6 md:p-8 flex flex-col">
                      <span
                        className="text-xs font-semibold rounded-full inline-block px-3 py-1 mb-3 self-start"
                        style={{ background: 'var(--coral)', color: 'white' }}
                      >
                        Coming up · {format(new Date(upcoming.visitDate), 'dd MMM yyyy')}
                      </span>
                      <h2
                        className="font-heading text-2xl md:text-3xl font-bold"
                        style={{ color: 'var(--navy)' }}
                      >
                        {upcoming.ngoName}
                      </h2>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1 mb-3">
                        <MapPin size={14} />
                        {upcoming.location}
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                        {upcoming.description}
                      </p>
                      {capacityHint && (
                        <p className="text-sm font-medium mt-4" style={{ color: 'var(--teal)' }}>
                          {capacityHint}
                        </p>
                      )}
                      <div className="mt-5">
                        <NgoJoinCta visitId={upcoming.id} label="Register" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card-premium p-8 md:p-12 text-center mb-12">
                  <h2
                    className="font-heading text-2xl md:text-3xl font-bold mb-2"
                    style={{ color: 'var(--navy)' }}
                  >
                    Next drive coming soon
                  </h2>
                  <p className="text-base text-gray-600 max-w-lg mx-auto">
                    Follow us on Instagram for updates on our next community
                    outreach drive.
                  </p>
                </div>
              )}

              {/* Past visits — static gallery, no registration. */}
              {past.length > 0 && (
                <>
                  <h2
                    className="font-heading text-xl md:text-2xl font-bold mb-5"
                    style={{ color: 'var(--navy)' }}
                  >
                    Past visits
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {past.map((visit) => (
                      <div key={visit.id} className="card-premium overflow-hidden">
                        {visit.photos.length > 0 && (
                          <div className="relative w-full h-64 bg-gray-100">
                            <Image
                              src={visit.photos[0]}
                              alt={visit.ngoName}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            <div className="absolute bottom-4 left-5 right-5">
                              <h3 className="font-heading text-xl font-bold text-white">
                                {visit.ngoName}
                              </h3>
                              <p className="text-sm text-white/80 flex items-center gap-1 mt-1">
                                <MapPin size={14} />
                                {visit.location}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="p-5">
                          {visit.photos.length === 0 && (
                            <>
                              <h3
                                className="font-heading text-xl font-bold"
                                style={{ color: 'var(--navy)' }}
                              >
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
                          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                            {visit.description}
                          </p>

                          {visit.photos.length > 1 && (
                            <div className="flex gap-2 mt-4">
                              {visit.photos.slice(1, 4).map((photo, i) => (
                                <div
                                  key={i}
                                  className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100"
                                >
                                  <Image
                                    src={photo}
                                    alt={`${visit.ngoName} photo ${i + 2}`}
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      <MarketingFooter />
    </>
  )
}
