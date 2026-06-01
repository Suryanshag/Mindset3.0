'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { BCap, BCard } from './b-atoms'
import BPageHeader from './b-page-header'

// Phase 3j — Personal info (Direction B port).
// Same fetch + PATCH pattern; only the chrome changes.

type ProfileData = {
  name: string
  phone: string
  dateOfBirth: string
  preferredLanguage: string
  emergencyContact: string
}

export default function BProfilePersonal() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, startSave] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [originalPhone, setOriginalPhone] = useState('')
  const [form, setForm] = useState<ProfileData>({
    name: '',
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
    <>
      <BPageHeader
        title="Personal info."
        breadcrumb={[
          { label: 'PROFILE', href: '/user/profile' },
          { label: 'PERSONAL INFO' },
        ]}
        back="/user/profile"
        sub="Name, phone, date of birth, emergency contact."
        ctas={['search']}
      />

      <BCard padding={28}>
        <BCap>Your details</BCap>
        {loading ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>Loading…</p>
        ) : (
          <div className="mt-4 space-y-4">
            <Field
              label="Full name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder="Your full name"
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field
                label={originalPhone ? 'Phone (required)' : 'Phone'}
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                placeholder="9876543210"
                type="tel"
              />
              <Field
                label="Date of birth"
                value={form.dateOfBirth}
                onChange={(v) => setForm({ ...form, dateOfBirth: v })}
                type="date"
              />
            </div>
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

            {error && <p style={{ fontSize: 13, color: '#9A3412' }}>{error}</p>}
            {success && <p style={{ fontSize: 13, color: 'var(--primary)' }}>Saved.</p>}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 13.5,
                padding: '11px 22px',
                borderRadius: 999,
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                fontWeight: 500,
                opacity: saving || !form.name.trim() ? 0.5 : 1,
                cursor: saving || !form.name.trim() ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save changes'}
            </button>
          </div>
        )}
      </BCard>

      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 13,
          color: 'var(--text-faint)',
        }}
      >
        Your phone is used for session reminders only — never for marketing.
      </p>
    </>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          color: 'var(--text-faint)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '11px 14px',
          borderRadius: 8,
          background: 'var(--bg-paper)',
          fontSize: 14,
          color: 'var(--text)',
          border: '1px solid var(--border)',
          outline: 'none',
          fontFamily: 'inherit',
        }}
      />
    </div>
  )
}
