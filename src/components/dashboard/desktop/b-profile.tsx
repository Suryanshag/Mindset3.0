import Link from 'next/link'
import Image from 'next/image'
import {
  UserCircle,
  Bell,
  Shield,
  MapPin,
  CreditCard,
  HelpCircle,
  Info,
  X,
} from 'lucide-react'
import { BCap, BCard, BChip } from './b-atoms'
import BPageHeader from './b-page-header'
import AvatarUpload from '@/components/dashboard/avatar-upload'
import SignOutButton from '@/components/dashboard/sign-out-button'

// Phase 3j — Profile main (Direction B port).
// Two-column: identity card (left) + settings rows + therapist (right).

type Props = {
  user: {
    name: string
    email: string
    image: string | null
    initials: string
  }
  therapist: {
    name: string
    specialty: string
    photo: string | null
    doctorId: string
    initials: string
  } | null
  stats: {
    sessions: number
    entries: number
    workshops: number
  }
}

const SETTINGS = [
  { label: 'Personal info', href: '/user/profile/personal', Icon: UserCircle, sub: 'Name, phone, date of birth' },
  { label: 'Notifications', href: '/user/profile/notifications', Icon: Bell, sub: 'What reaches you, and when' },
  { label: 'Privacy & data', href: '/user/profile/privacy', Icon: Shield, sub: 'Password, downloads, deletion' },
  { label: 'Addresses', href: '/user/profile/addresses', Icon: MapPin, sub: 'For shop deliveries' },
  { label: 'Payments', href: '/user/profile/payments', Icon: CreditCard, sub: 'Receipts and history' },
  { label: 'Help & support', href: '/user/profile/help', Icon: HelpCircle, sub: 'FAQ and contact' },
  { label: 'About', href: '/user/profile/about', Icon: Info, sub: 'Why we built this' },
] as const

export default function BProfile({ user, therapist, stats }: Props) {
  return (
    <>
      <BPageHeader
        title="Profile."
        breadcrumb={[
          { label: 'HOME', href: '/user' },
          { label: 'PROFILE' },
        ]}
        back="/user"
        sub="What we know about you and how to change it. Nothing more."
        ctas={['search']}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
        {/* LEFT — identity */}
        <div className="flex flex-col gap-3.5">
          <BCard padding={22} style={{ textAlign: 'center' }}>
            <div className="flex flex-col items-center">
              <AvatarUpload currentUrl={user.image} initials={user.initials} size={96} />
            </div>
            <p
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 18,
                fontWeight: 500,
                color: 'var(--text)',
                marginTop: 14,
              }}
            >
              {user.name}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{user.email}</p>
            <Link
              href="/user/profile/personal"
              style={{
                display: 'inline-block',
                fontFamily: 'var(--font-heading)',
                fontSize: 12,
                color: 'var(--primary)',
                marginTop: 14,
              }}
            >
              Edit profile ›
            </Link>
            <div
              style={{
                borderTop: '1px solid var(--border)',
                marginTop: 16,
                paddingTop: 14,
                textAlign: 'left',
              }}
            >
              <BCap>Your activity</BCap>
              <StatRow label="Sessions" value={stats.sessions.toString()} />
              <StatRow label="Journal entries" value={stats.entries.toString()} />
              <StatRow label="Workshops" value={stats.workshops.toString()} />
            </div>
          </BCard>

          {therapist && (
            <BCard padding={16}>
              <BCap>Your therapist</BCap>
              <div className="flex items-center gap-3 mt-3">
                {therapist.photo ? (
                  <Image
                    src={therapist.photo}
                    alt={therapist.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background:
                        'linear-gradient(160deg, var(--accent-tint), var(--accent))',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#fff',
                      fontFamily: 'var(--font-heading)',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {therapist.initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--text)',
                    }}
                  >
                    {therapist.name}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {therapist.specialty}
                  </p>
                </div>
              </div>
              <Link
                href={`/user/sessions/book?doctorId=${therapist.doctorId}`}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 13,
                  padding: '9px 14px',
                  borderRadius: 999,
                  background: 'var(--primary)',
                  color: '#fff',
                  marginTop: 12,
                  fontWeight: 500,
                }}
              >
                Book follow-up
              </Link>
            </BCard>
          )}
        </div>

        {/* RIGHT — settings rows */}
        <div className="flex flex-col gap-3.5">
          <BCard padding={0} style={{ overflow: 'hidden' }}>
            {SETTINGS.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr 24px',
                  gap: 14,
                  padding: '14px 20px',
                  alignItems: 'center',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--bg-paper)',
                    border: '1px solid var(--border)',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'var(--text-muted)',
                  }}
                >
                  <item.Icon size={16} strokeWidth={1.7} />
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--text)',
                    }}
                  >
                    {item.label}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {item.sub}
                  </p>
                </div>
                <span style={{ color: 'var(--text-faint)' }}>›</span>
              </Link>
            ))}
          </BCard>

          <BCard accent="var(--accent)" padding={14}>
            <BCap style={{ color: 'var(--accent-deep)' }}>Account</BCap>
            <div className="flex flex-wrap gap-2 mt-3">
              <Link
                href="/user/profile/privacy"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 12,
                  padding: '7px 14px',
                  borderRadius: 999,
                  background: 'transparent',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                }}
              >
                Download my data ›
              </Link>
              <Link
                href="/user/profile/delete"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 12,
                  padding: '7px 14px',
                  borderRadius: 999,
                  background: 'transparent',
                  color: 'var(--accent-deep)',
                  border: '1px solid var(--border)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <X size={14} /> Delete my account
              </Link>
            </div>
          </BCard>

          <SignOutButton />
        </div>
      </div>
    </>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
      <span>{label}</span>
      <span style={{ color: 'var(--text)', fontFamily: 'var(--font-heading)', fontWeight: 500 }}>
        {value}
      </span>
    </div>
  )
}
