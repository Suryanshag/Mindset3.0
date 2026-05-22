'use client'

// Phase 6 — Mobile EditProfile. Ported from app/flows.jsx EditProfile
// component (design lines 243-294). Reuses Sprint Bug 3 sticky-phone
// validation from the desktop personal/page.tsx: once a phone is on
// file, the edit form blocks clearing it. Avatar upload + pronouns +
// Mindset-preferences rows from the design are out of scope this phase.

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IconArrowLeft, IconCalendar } from './icons'
import { Avatar } from './ui'

type ProfileData = {
  name: string
  email: string
  phone: string
  dateOfBirth: string
  preferredLanguage: string
  emergencyContact: string
}

export default function MobileEditProfile() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, startSave] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [originalPhone, setOriginalPhone] = useState('')
  const [form, setForm] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    preferredLanguage: '',
    emergencyContact: '',
  })

  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const u = res.data
          const phone = u.phone ?? ''
          setOriginalPhone(phone)
          setForm({
            name: u.name ?? '',
            email: u.email ?? '',
            phone,
            dateOfBirth: u.dateOfBirth
              ? new Date(u.dateOfBirth).toISOString().split('T')[0]
              : '',
            preferredLanguage: u.preferredLanguage ?? '',
            emergencyContact: u.emergencyContact ?? '',
          })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function handleSave() {
    setError(null)
    setSuccess(false)

    // Sticky-phone (Sprint Bug 3, Option B): once a user has a phone on
    // file, the edit form blocks clearing it. They can change it (zod
    // validates the new value) but not blank it from here. Other optional
    // fields are freely clearable.
    if (originalPhone && !form.phone.trim()) {
      setError('Phone cannot be cleared. To remove it, contact support.')
      return
    }

    startSave(async () => {
      try {
        const body: Record<string, unknown> = {
          name: form.name,
          dateOfBirth: form.dateOfBirth,
          preferredLanguage: form.preferredLanguage,
          emergencyContact: form.emergencyContact,
        }
        if (form.phone.trim()) body.phone = form.phone.trim()

        const res = await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error ?? 'Failed to save')

        if (data.data?.phone) setOriginalPhone(data.data.phone)

        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save')
      }
    })
  }

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
      <header
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Link
          href="/user/profile"
          aria-label="Back"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-card)',
            color: 'var(--text)',
          }}
        >
          <IconArrowLeft size={18} sw={1.8} />
        </Link>
        <div className="ms-display" style={{ fontSize: 22, flex: 1 }}>
          Edit profile
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading || !form.name.trim()}
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: 'var(--primary)',
            opacity: saving || loading || !form.name.trim() ? 0.5 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </header>

      {loading ? (
        <section style={{ padding: '14px 20px 0' }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: 56,
                marginTop: 16,
                borderRadius: 12,
                background: 'var(--bg-card)',
                opacity: 0.55,
              }}
            />
          ))}
        </section>
      ) : (
        <>
          <section
            style={{
              padding: '14px 20px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Avatar name={form.name || 'User'} size={92} color="var(--accent)" />
          </section>

          <section style={{ padding: '20px 20px 0' }}>
            <Field
              label="Name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
            />
            <Field label="Email" value={form.email} readOnly />
            <Field
              label={originalPhone ? 'Phone (required)' : 'Phone'}
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
              type="tel"
            />
            <Field
              label="Date of birth"
              value={form.dateOfBirth}
              onChange={(v) => setForm({ ...form, dateOfBirth: v })}
              type="date"
              icon={<IconCalendar size={14} sw={1.8} />}
            />
            <Field
              label="Preferred language"
              value={form.preferredLanguage}
              onChange={(v) => setForm({ ...form, preferredLanguage: v })}
              placeholder="e.g. English, Hindi"
            />
            <Field
              label="Emergency contact"
              value={form.emergencyContact}
              onChange={(v) => setForm({ ...form, emergencyContact: v })}
              placeholder="Name — phone number"
            />
          </section>

          {(error || success) && (
            <section style={{ padding: '14px 20px 0' }}>
              {error && (
                <div style={{ fontSize: 13, color: '#B23B2E' }}>{error}</div>
              )}
              {success && (
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--primary)',
                    fontWeight: 700,
                  }}
                >
                  Saved
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon,
  readOnly,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  type?: string
  icon?: React.ReactNode
  readOnly?: boolean
}) {
  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingBottom: 8,
          borderBottom: '1.5px solid var(--border-strong)',
        }}
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          style={{
            flex: 1,
            marginTop: 6,
            padding: '6px 0',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 16,
            fontWeight: 700,
            color: readOnly ? 'var(--text-muted)' : 'var(--text)',
          }}
        />
        {icon && <span style={{ color: 'var(--text-muted)' }}>{icon}</span>}
      </div>
    </div>
  )
}
