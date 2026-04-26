'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/dashboard/page-header'
import { Loader2 } from 'lucide-react'

interface ProfileData {
  name: string
  phone: string
  dateOfBirth: string
  preferredLanguage: string
  emergencyContact: string
}

export default function PersonalInfoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, startSave] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
          setForm({
            name: u.name ?? '',
            phone: u.phone ?? '',
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
    startSave(async () => {
      try {
        const body: Record<string, unknown> = { name: form.name }
        if (form.phone) body.phone = form.phone
        if (form.dateOfBirth) body.dateOfBirth = form.dateOfBirth
        if (form.preferredLanguage) body.preferredLanguage = form.preferredLanguage
        if (form.emergencyContact) body.emergencyContact = form.emergencyContact

        const res = await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error ?? 'Failed to save')
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save')
      }
    })
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Personal info" back="/user/profile" />
        <div className="space-y-3.5 pt-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[72px] rounded-2xl bg-bg-card animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Personal info" back="/user/profile" />

      <div className="space-y-3.5 pt-5">
        {/* Form card */}
        <div
          className="bg-bg-card rounded-2xl p-4 lg:p-6 space-y-4"
          style={{ border: '0.5px solid var(--color-border)' }}
        >
          <Field
            label="Full name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            placeholder="Your full name"
          />
          <div className="lg:grid lg:grid-cols-2 lg:gap-4 space-y-4 lg:space-y-0">
            <Field
              label="Phone number"
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
        </div>

        {/* Error / success */}
        {error && (
          <p className="text-[13px] text-red-600 px-1">{error}</p>
        )}
        {success && (
          <p className="text-[13px] text-primary px-1">Saved successfully</p>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || !form.name.trim()}
          className="w-full lg:w-auto lg:px-10 h-[48px] rounded-full bg-primary text-white text-[14px] font-medium disabled:opacity-50 flex items-center justify-center transition-colors duration-150 lg:hover:bg-primary-soft"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : 'Save changes'}
        </button>
      </div>
    </div>
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
      <label className="block text-[12px] font-medium text-text-faint mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-3 rounded-xl bg-bg-app text-[14px] text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-primary/30"
        style={{ border: '0.5px solid var(--color-border)' }}
      />
    </div>
  )
}
