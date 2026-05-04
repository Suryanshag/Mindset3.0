'use client'

import { useEffect, useRef, useState } from 'react'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'

const SUBJECTS = [
  'Book a session',
  'General inquiry',
  'Workshop or program',
  'NGO / Partnership',
  'Other',
]
const AGE_GROUPS = ['Under 18', '18–25', '26–35', '36–50', '50+']
const SUPPORT_MODES = ['Online session', 'In-person', 'Either works']
const FIRST_TIME = ['Yes, first time', 'No, I have been before']
const HEARD_FROM = ['Social media', 'Friend or family', 'Search engine', 'Healthcare provider', 'Other']

const MIN_FILL_TIME_MS = 2500

type Status = 'idle' | 'sending' | 'sent' | 'error'

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const mountedAtRef = useRef<number>(0)
  const { executeRecaptcha } = useGoogleReCaptcha()

  useEffect(() => {
    mountedAtRef.current = Date.now()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')

    const data = new FormData(e.currentTarget)

    // Honeypot — must be empty (real users can't see it)
    if (String(data.get('_website') ?? '').trim() !== '') {
      // Pretend success to avoid signaling rejection to bots
      setStatus('sent')
      return
    }

    // Timing check — anti-bot
    const elapsed = Date.now() - mountedAtRef.current
    if (elapsed < MIN_FILL_TIME_MS) {
      setStatus('error')
      setErrorMsg('Please take a moment to fill in the form before submitting.')
      return
    }

    // reCAPTCHA v3 token (silent). If executeRecaptcha is undefined (no site key
    // in env), token stays empty and the server falls back to honeypot + timing.
    let recaptchaToken = ''
    if (executeRecaptcha) {
      try {
        recaptchaToken = await executeRecaptcha('contact_form')
      } catch (err) {
        console.error('[recaptcha]', err)
      }
    }

    const payload = {
      name: String(data.get('name') ?? '').trim().slice(0, 100),
      email: String(data.get('email') ?? '').trim().slice(0, 200),
      phone: String(data.get('phone') ?? '').trim().slice(0, 20) || undefined,
      subject: String(data.get('subject') ?? '').slice(0, 100),
      message: String(data.get('message') ?? '').trim().slice(0, 2000),
      ageGroup: String(data.get('age_group') ?? '').slice(0, 50),
      supportMode: String(data.get('support_mode') ?? '').slice(0, 50),
      firstTime: String(data.get('first_time') ?? '').slice(0, 50),
      heardFrom: String(data.get('heard_from') ?? '').slice(0, 50),
      elapsedMs: elapsed,
      recaptchaToken,
    }

    if (!payload.name || payload.name.length < 2) {
      setStatus('error'); setErrorMsg('Please enter your name.'); return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      setStatus('error'); setErrorMsg('Please enter a valid email.'); return
    }
    if (!payload.subject) {
      setStatus('error'); setErrorMsg('Please select a topic.'); return
    }
    if (!payload.message || payload.message.length < 10) {
      setStatus('error'); setErrorMsg('Please share a bit more — at least 10 characters.'); return
    }
    if (!data.get('privacy')) {
      setStatus('error'); setErrorMsg('Please accept the privacy policy to continue.'); return
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Something went wrong. Please try again.')
      }
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Network error. Please try again.')
    }
  }

  if (status === 'sent') {
    return (
      <div
        className="rounded-2xl p-8 md:p-10 text-center"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div
          aria-hidden
          className="mx-auto mb-5 w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(11, 157, 169, 0.15)' }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'var(--teal)' }}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2
          className="font-heading text-2xl md:text-3xl font-bold mb-3"
          style={{ color: 'var(--navy)' }}
        >
          Message received.
        </h2>
        <p style={{ color: 'var(--navy)', opacity: 0.78 }}>
          Thank you for reaching out. Someone from our team will respond within 24 hours.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 contact-form"
      noValidate
      autoComplete="on"
    >
      {/* Honeypot — visually hidden, off-screen, not focusable. Bots tend to fill anything labelled. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>
          Website
          <input type="text" name="_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Name" required>
          <input name="name" type="text" maxLength={100} autoComplete="name" placeholder="Your name" disabled={status === 'sending'} required />
        </Field>
        <Field label="Email" required>
          <input name="email" type="email" maxLength={200} autoComplete="email" placeholder="you@example.com" disabled={status === 'sending'} required />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Phone" hint="optional">
          <input name="phone" type="tel" maxLength={20} autoComplete="tel" placeholder="+91 XXXXX XXXXX" disabled={status === 'sending'} />
        </Field>
        <Field label="How can we help?" required>
          <select name="subject" required disabled={status === 'sending'} defaultValue="">
            <option value="" disabled>Select a topic</option>
            {SUBJECTS.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Age group">
          <select name="age_group" disabled={status === 'sending'} defaultValue="">
            <option value="">Prefer not to say</option>
            {AGE_GROUPS.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </Field>
        <Field label="Preferred mode of support">
          <select name="support_mode" disabled defaultValue="">
            <option value="">No preference</option>
            {SUPPORT_MODES.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="First time seeking help?">
          <select name="first_time" disabled={status === 'sending'} defaultValue="">
            <option value="">Prefer not to say</option>
            {FIRST_TIME.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </Field>
        <Field label="How did you hear about us?">
          <select name="heard_from" disabled={status === 'sending'} defaultValue="">
            <option value="">Select</option>
            {HEARD_FROM.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </Field>
      </div>

      <Field label="Message" required>
        <textarea name="message" rows={5} maxLength={2000} placeholder="Tell us what's on your mind…" disabled={status === 'sending'} required />
      </Field>

      <label className="flex items-start gap-3 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          name="privacy"
          required
          disabled={status === 'sending'}
          className="mt-1 cursor-pointer"
          style={{ accentColor: 'var(--coral)' }}
        />
        <span style={{ color: 'var(--navy)', opacity: 0.85 }}>
          I&apos;ve read and accept the{' '}
          <a href="/privacy-policy" style={{ color: 'var(--teal)', textDecoration: 'underline' }}>
            privacy policy
          </a>
          .
        </span>
      </label>

      {status === 'error' && errorMsg && (
        <p
          role="alert"
          className="text-sm py-3 px-4 rounded-lg"
          style={{
            color: 'var(--coral)',
            background: 'rgba(249, 101, 83, 0.1)',
            border: '1px solid rgba(249, 101, 83, 0.3)',
          }}
        >
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{ background: 'var(--coral)' }}
      >
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>

      <p className="text-xs" style={{ color: 'var(--navy)', opacity: 0.55 }}>
        This site is protected by reCAPTCHA and the Google{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Privacy Policy</a>
        {' '}and{' '}
        <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Terms of Service</a>
        {' '}apply.
      </p>

      <style>{`
        .contact-form input[type="text"],
        .contact-form input[type="email"],
        .contact-form input[type="tel"],
        .contact-form select,
        .contact-form textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid var(--color-border);
          border-radius: 12px;
          background: var(--bg-card);
          color: var(--color-text);
          font-size: 0.95rem;
          font-family: inherit;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .contact-form input[type="text"]:focus,
        .contact-form input[type="email"]:focus,
        .contact-form input[type="tel"]:focus,
        .contact-form select:focus,
        .contact-form textarea:focus {
          outline: none;
          border-color: var(--coral);
          box-shadow: 0 0 0 3px rgba(249, 101, 83, 0.15);
        }
        .contact-form textarea { resize: vertical; min-height: 120px; }
        .contact-form select { appearance: none; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'><path d='M1 1.5L6 6.5L11 1.5' stroke='%231E445C' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></svg>"); background-repeat: no-repeat; background-position: right 1rem center; padding-right: 2.5rem; }
      `}</style>
    </form>
  )
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span
        className="block text-sm font-medium mb-2"
        style={{ color: 'var(--navy)' }}
      >
        {label}
        {required && <span style={{ color: 'var(--coral)' }}> *</span>}
        {hint && (
          <span style={{ opacity: 0.5, fontWeight: 400 }}> ({hint})</span>
        )}
      </span>
      {children}
    </label>
  )
}
