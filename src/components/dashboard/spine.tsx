'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import type { SpineSession, SpineTherapist } from '@/lib/queries/reflection'
import type { EngagementState } from '@/lib/queries/dashboard'

// Phase 1 — Direction B spine.
// Layout:
//   • Wordmark
//   • 7-item top nav (Today / Sessions / Practice / Reflection /
//     Discover / Library / Shop). Active item gets a tint + accent dot.
//     Notifications and Cart are NOT in this nav — they live as
//     per-page header icons (added in Phase 3). Profile is the user
//     pill at the bottom of the spine.
//   • "Your therapist" mini-card (server-fetched, omitted for users
//     with no past sessions yet).
//   • Push to bottom: "If today is heavy" helpline block (replaces the
//     interim SOS pill from the prior sprint; routes still preserve
//     /user/sos as the dedicated crisis page).
//   • User pill (avatar + name + email, links to /user/profile).
//
// `sessions` and `engagementState` props are kept on the interface so
// DesktopContent doesn't change shape between phases, even though this
// version of the spine doesn't render the per-month session ledger any
// more. The chapter-book lives at /user/reflection now.

const SPACES = [
  { href: '/user', label: 'Today' },
  { href: '/user/sessions', label: 'Sessions' },
  { href: '/user/practice', label: 'Practice' },
  // Reflection points at /user/reflection/today for now (Phase 3b — no
  // separate chapter-book index route). When the BReflection page lands,
  // this href moves to /user/reflection without other changes.
  { href: '/user/reflection/today', label: 'Reflection' },
  { href: '/user/discover', label: 'Discover' },
  { href: '/user/library', label: 'Library' },
  { href: '/user/shop', label: 'Shop' },
] as const

const HELPLINES = [
  { name: 'iCall', phone: '9152987821' },
  { name: 'KIRAN', phone: '1800-599-0019' },
] as const

type Props = {
  sessions?: SpineSession[]
  therapist?: SpineTherapist | null
  engagementState?: EngagementState
  unreadNotificationCount?: number
}

export default function Spine({ therapist }: Props) {
  const pathname = usePathname()
  const { data: authSession } = useSession()

  const userName = authSession?.user?.name ?? 'You'
  const userEmail = authSession?.user?.email ?? ''
  const userImage = authSession?.user?.image ?? null
  const userInitials = userName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  function isActive(href: string) {
    if (href === '/user') return pathname === '/user'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const therapistFirstName = therapist?.name.split(' ').slice(-1)[0] ?? ''
  const sinceMonth = therapist?.sinceDate
    ? therapist.sinceDate.toLocaleDateString('en-IN', { month: 'long' })
    : null

  return (
    <aside
      className="spine sticky top-0 h-dvh flex flex-col overflow-hidden"
      style={{ borderRight: '1px solid var(--border)' }}
    >
      {/* Wordmark */}
      <div className="px-[22px] pt-[22px] pb-4">
        <Wordmark />
      </div>

      {/* Top nav */}
      <nav className="px-[14px] pb-2">
        {SPACES.map(({ href, label }) => {
          const on = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-lg transition-colors duration-150"
              style={{
                padding: '9px 10px',
                fontSize: 13.5,
                marginBottom: 1,
                background: on ? 'rgba(45,90,79,0.08)' : 'transparent',
                color: on ? 'var(--primary)' : 'var(--text)',
                fontWeight: on ? 500 : 400,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: on ? 'var(--primary)' : 'var(--text-faint)',
                  opacity: on ? 1 : 0.4,
                }}
              />
              <span className="flex-1">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Therapist mini-card */}
      {therapist && (
        <>
          <div
            className="mx-[22px] my-3.5"
            style={{ borderTop: '1px solid var(--border)' }}
          />
          <div className="px-[22px]">
            <Cap>Your therapist</Cap>
            <div className="flex items-center gap-2.5 mt-2.5">
              {therapist.photo ? (
                <Image
                  src={therapist.photo}
                  alt={therapist.name}
                  width={34}
                  height={34}
                  className="rounded-full object-cover shrink-0"
                  style={{ border: '1px solid var(--border)' }}
                />
              ) : (
                <div
                  className="w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background:
                      'linear-gradient(160deg, var(--accent-tint), var(--accent))',
                    border: '1px solid var(--border)',
                  }}
                >
                  <span
                    className="text-white"
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {therapistFirstName[0] ?? ''}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <p
                  className="truncate"
                  style={{
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: 'var(--text)',
                    lineHeight: 1.2,
                  }}
                >
                  {therapist.name}
                </p>
                <p
                  className="truncate"
                  style={{
                    fontSize: 10.5,
                    color: 'var(--text-faint)',
                    lineHeight: 1.2,
                    marginTop: 2,
                  }}
                >
                  {therapist.sessionCount} session
                  {therapist.sessionCount === 1 ? '' : 's'}
                  {sinceMonth ? ` · since ${sinceMonth}` : ''}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Spacer pushes the bottom blocks down */}
      <div className="flex-1" />

      {/* "If today is heavy" — helpline block */}
      <div
        className="px-[22px] pt-4 pb-3"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <Cap style={{ color: 'var(--accent-deep)', marginBottom: 6 }}>
          If today is heavy
        </Cap>
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--text-muted)',
            lineHeight: 1.55,
          }}
        >
          {HELPLINES.map((h, i) => (
            <div key={h.phone}>
              {h.name} ·{' '}
              <a
                href={`tel:${h.phone}`}
                style={{
                  color: 'var(--text-muted)',
                  textDecoration: 'underline',
                  textUnderlineOffset: 2,
                }}
              >
                {h.phone}
              </a>
              {i < HELPLINES.length - 1 ? <br /> : null}
            </div>
          ))}
        </div>
        <Link
          href="/user/sos"
          className="inline-block mt-2"
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--accent-deep)',
            textDecoration: 'underline',
            textUnderlineOffset: 2,
          }}
        >
          More options →
        </Link>
      </div>

      {/* User pill — bottom */}
      <Link
        href="/user/profile"
        className="flex items-center gap-2.5 px-[18px] py-3"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        {userImage ? (
          <Image
            src={userImage}
            alt=""
            width={30}
            height={30}
            className="rounded-full object-cover shrink-0"
          />
        ) : (
          <div
            className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0"
            style={{
              background:
                'linear-gradient(135deg, var(--accent-tint), var(--accent))',
              color: '#fff',
              fontFamily: 'var(--font-heading)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {userInitials}
          </div>
        )}
        <div className="min-w-0">
          <p
            className="truncate"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text)',
              lineHeight: 1.15,
            }}
          >
            {userName}
          </p>
          {userEmail && (
            <p
              className="truncate"
              style={{
                fontSize: 11,
                color: 'var(--text-faint)',
                lineHeight: 1.15,
              }}
            >
              {userEmail}
            </p>
          )}
        </div>
      </Link>
    </aside>
  )
}

// Hand-set rotated wordmark, same letter pattern as the B design.
function Wordmark({ size = 22 }: { size?: number }) {
  const letters = 'Mindset'.split('')
  const rots = [-1.5, 1.2, -0.8, 1.5, -1, 0.8, -1.2]
  const ys = [0, -0.5, 0.4, -0.6, 0.3, -0.4, 0.5]
  return (
    <span
      style={{
        fontFamily: 'var(--font-heading)',
        fontSize: size,
        color: 'var(--text)',
        lineHeight: 1,
        display: 'inline-flex',
        letterSpacing: '0.02em',
      }}
    >
      {letters.map((l, i) => (
        <span
          key={i}
          style={{ transform: `rotate(${rots[i]}deg) translateY(${ys[i]}px)` }}
        >
          {l}
        </span>
      ))}
    </span>
  )
}

// Small "cap" label — the design's recurring uppercase Barlow caption.
function Cap({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        fontSize: 10.5,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        fontWeight: 500,
        color: 'var(--text-faint)',
        fontFamily: 'var(--font-heading)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
