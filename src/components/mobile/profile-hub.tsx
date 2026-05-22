'use client'

// Phase 6 — Mobile Settings hub. Renders at /user/profile on mobile;
// desktop keeps the existing two-column layout. Top section ports the
// EditProfile design's avatar block; below are settings sub-screens
// grouped into two cards: design rows (Notifications/Privacy/Language/
// Help) on top, existing functional rows (Addresses/Payments/About) on
// the bottom, then Sign out.

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Card } from './ui'
import { SettingsRow } from './settings-shell'
import {
  IconUser,
  IconBell,
  IconShield,
  IconCompass,
  IconChat,
  IconMapPin,
  IconShop,
  IconCloseSmall,
  IconChevR,
} from './icons'
import { Avatar } from './ui'

type MobileProfileHubProps = {
  user: {
    name: string
    email: string
    image: string | null
  }
  therapist: {
    name: string
    specialty: string
    photo: string | null
    doctorId: string
  } | null
}

export default function MobileProfileHub({
  user,
  therapist,
}: MobileProfileHubProps) {
  return (
    <div
      className="screen-scroll"
      style={{
        background: 'var(--bg-app)',
        minHeight: '100%',
        overflowY: 'auto',
        paddingBottom: 110,
      }}
    >
      <header style={{ padding: '14px 20px' }}>
        <div className="ms-display" style={{ fontSize: 22 }}>
          Settings
        </div>
      </header>

      {/* Avatar + name block */}
      <section
        style={{
          padding: '14px 20px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar
          name={user.name}
          src={user.image ?? undefined}
          size={84}
          color="var(--accent)"
        />
        <div
          className="ms-display"
          style={{ fontSize: 20, marginTop: 12, color: 'var(--text)' }}
        >
          {user.name}
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            marginTop: 2,
          }}
        >
          {user.email}
        </div>
        <Link
          href="/user/profile/personal"
          style={{
            marginTop: 14,
            padding: '8px 18px',
            borderRadius: 999,
            background: 'var(--primary)',
            color: 'var(--on-dark)',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Edit profile
        </Link>
      </section>

      {/* Therapist card — keeps the existing dashboard feature */}
      {therapist && (
        <section style={{ padding: '22px 20px 0' }}>
          <Card padding={14}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 10,
              }}
            >
              Your therapist
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar
                name={therapist.name}
                src={therapist.photo ?? undefined}
                size={42}
                color="var(--accent)"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  {therapist.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {therapist.specialty}
                </div>
              </div>
              <Link
                href={`/user/sessions/book?doctorId=${therapist.doctorId}`}
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  background: 'var(--primary)',
                  color: 'var(--on-dark)',
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                Book
              </Link>
            </div>
          </Card>
        </section>
      )}

      {/* Design's settings rows */}
      <section style={{ padding: '22px 20px 0' }}>
        <Card padding={0}>
          <SettingsRow
            icon={<IconUser size={18} sw={1.8} />}
            label="Edit profile"
            sub="Name, phone, date of birth"
            href="/user/profile/personal"
            trailing={<IconChevR size={16} sw={1.8} />}
          />
          <SettingsRow
            icon={<IconBell size={18} sw={1.8} />}
            label="Notifications"
            sub="What reaches you, and when"
            href="/user/profile/notifications"
            trailing={<IconChevR size={16} sw={1.8} />}
          />
          <SettingsRow
            icon={<IconShield size={18} sw={1.8} />}
            label="Privacy & data"
            sub="Password, downloads, deletion"
            href="/user/profile/privacy"
            trailing={<IconChevR size={16} sw={1.8} />}
          />
          <SettingsRow
            icon={<IconCompass size={18} sw={1.8} />}
            label="Language"
            sub="English"
            href="/user/profile/language"
            trailing={<IconChevR size={16} sw={1.8} />}
            last
          />
        </Card>
      </section>

      {/* Functional rows preserved from existing /user/profile */}
      <section style={{ padding: '14px 20px 0' }}>
        <Card padding={0}>
          <SettingsRow
            icon={<IconMapPin size={18} sw={1.8} />}
            label="Addresses"
            sub="Manage delivery addresses"
            href="/user/profile/addresses"
            trailing={<IconChevR size={16} sw={1.8} />}
          />
          <SettingsRow
            icon={<IconShop size={18} sw={1.8} />}
            label="Payments"
            sub="Receipts and history"
            href="/user/profile/payments"
            trailing={<IconChevR size={16} sw={1.8} />}
            last
          />
        </Card>
      </section>

      {/* Help */}
      <section style={{ padding: '14px 20px 0' }}>
        <Card padding={0}>
          <SettingsRow
            icon={<IconChat size={18} sw={1.8} />}
            label="Help & support"
            sub="FAQ and contact"
            href="/user/profile/help"
            trailing={<IconChevR size={16} sw={1.8} />}
            last
          />
        </Card>
      </section>

      {/* Sign out — full-width pill, danger-styled */}
      <section style={{ padding: '22px 20px 0' }}>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 18,
            background: 'var(--bg-card)',
            color: '#B23B2E',
            fontSize: 14,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <IconCloseSmall size={16} sw={2} />
          Sign out
        </button>
      </section>
    </div>
  )
}
