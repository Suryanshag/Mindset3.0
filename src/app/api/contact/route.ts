import { NextRequest, NextResponse } from 'next/server'

// In-memory rate limit (best effort; resets on server restart, not shared across instances).
// For production-grade rate limiting use Redis / Upstash.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 min
const RATE_LIMIT_MAX = 5
const ipHits = new Map<string, number[]>()

function tooManyRequests(ip: string) {
  const now = Date.now()
  const arr = (ipHits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  if (arr.length >= RATE_LIMIT_MAX) {
    ipHits.set(ip, arr)
    return true
  }
  arr.push(now)
  ipHits.set(ip, arr)
  return false
}

const MAX = {
  name: 100,
  email: 200,
  phone: 20,
  subject: 100,
  message: 2000,
  enum: 50,
} as const

const MIN_FILL_TIME_MS = 2000

function clip(v: unknown, max: number): string {
  return typeof v === 'string' ? v.slice(0, max) : ''
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'

    if (tooManyRequests(ip)) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait a few minutes and try again.' },
        { status: 429 },
      )
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
    }

    // Honeypot — if present and non-empty, silently accept and drop
    if (typeof body._website === 'string' && body._website.trim() !== '') {
      return NextResponse.json({ message: 'ok' }, { status: 201 })
    }

    // Timing — clients should report how long the form was on screen
    const elapsedMs = typeof body.elapsedMs === 'number' ? body.elapsedMs : 0
    if (elapsedMs > 0 && elapsedMs < MIN_FILL_TIME_MS) {
      return NextResponse.json({ error: 'Submission too fast.' }, { status: 400 })
    }

    // reCAPTCHA v3 verification (only enforced when RECAPTCHA_SECRET_KEY is set).
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY
    if (recaptchaSecret) {
      const token = typeof body.recaptchaToken === 'string' ? body.recaptchaToken : ''
      if (!token) {
        return NextResponse.json({ error: 'Verification failed. Please reload and try again.' }, { status: 400 })
      }
      try {
        const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${encodeURIComponent(recaptchaSecret)}&response=${encodeURIComponent(token)}&remoteip=${encodeURIComponent(ip)}`,
        })
        const verify = (await verifyRes.json()) as { success: boolean; score?: number; action?: string; 'error-codes'?: string[] }
        // For v3: require success + score >= 0.5 + matching action
        if (!verify.success || (verify.score ?? 0) < 0.5 || (verify.action && verify.action !== 'contact_form')) {
          console.warn('[recaptcha] failed', { score: verify.score, action: verify.action, errors: verify['error-codes'] })
          return NextResponse.json({ error: 'Verification failed. Please reload and try again.' }, { status: 400 })
        }
      } catch (err) {
        console.error('[recaptcha verify]', err)
        return NextResponse.json({ error: 'Verification service unavailable. Please try again.' }, { status: 502 })
      }
    }

    const name = clip(body.name, MAX.name).trim()
    const email = clip(body.email, MAX.email).trim()
    const phone = clip(body.phone, MAX.phone).trim()
    const subject = clip(body.subject, MAX.subject).trim()
    const message = clip(body.message, MAX.message).trim()
    const ageGroup = clip(body.ageGroup, MAX.enum).trim()
    const supportMode = clip(body.supportMode, MAX.enum).trim()
    const firstTime = clip(body.firstTime, MAX.enum).trim()
    const heardFrom = clip(body.heardFrom, MAX.enum).trim()

    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 })
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }
    if (!subject || subject.length < 2) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    }
    if (!message || message.length < 10) {
      return NextResponse.json({ error: 'Message must be at least 10 characters' }, { status: 400 })
    }

    // Anti-spam: reject messages with too many links
    const linkCount = (message.match(/https?:\/\//gi) ?? []).length
    if (linkCount > 3) {
      return NextResponse.json({ error: 'Message contains too many links.' }, { status: 400 })
    }

    // Send to Google Sheet via Apps Script Web App.
    const sheetUrl = process.env.GOOGLE_APPS_SCRIPT_CONTACT_URL
    if (sheetUrl) {
      const sheetSecret = process.env.GOOGLE_APPS_SCRIPT_SECRET ?? ''
      void fetch(sheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(sheetSecret ? { secret: sheetSecret } : {}),
          timestamp: new Date().toISOString(),
          name,
          email,
          phone,
          subject,
          message,
          ageGroup,
          supportMode,
          firstTime,
          heardFrom,
        }),
      }).catch((err) => console.error('[CONTACT_SHEET_SYNC]', err))
    } else {
      console.warn('[CONTACT] GOOGLE_APPS_SCRIPT_CONTACT_URL not set — submission discarded')
    }

    return NextResponse.json({ message: 'Message sent successfully' }, { status: 201 })
  } catch (error) {
    console.error('[CONTACT_ERROR]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
