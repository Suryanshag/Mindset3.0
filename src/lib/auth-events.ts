import { prisma } from '@/lib/prisma'
import type { AuthEventKind } from '@prisma/client'
import type { NextRequest } from 'next/server'

type AnyRequest = Request | NextRequest

function extractIp(req: AnyRequest | undefined): string | null {
  if (!req) return null
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) {
    const first = fwd.split(',')[0]?.trim()
    if (first) return first
  }
  const real = req.headers.get('x-real-ip')
  if (real) return real.trim()
  return null
}

function extractUserAgent(req: AnyRequest | undefined): string | null {
  if (!req) return null
  return req.headers.get('user-agent') ?? null
}

function maskEmail(value: string): string {
  const at = value.indexOf('@')
  if (at <= 0) return '***'
  const local = value.slice(0, at)
  const domain = value.slice(at + 1)
  const visible = local.charAt(0)
  return `${visible}${'*'.repeat(Math.max(2, local.length - 1))}@${domain}`
}

const FORBIDDEN_KEYS = new Set([
  'password',
  'newPassword',
  'currentPassword',
  'token',
  'resetToken',
  'verificationToken',
  'access_token',
  'refresh_token',
  'id_token',
  'secret',
  'apiKey',
])

function sanitizeMetadata(
  input: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!input) return undefined
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    if (FORBIDDEN_KEYS.has(key)) continue
    if (typeof value === 'string' && value.includes('@') && key.toLowerCase().includes('email')) {
      out[key] = maskEmail(value)
    } else {
      out[key] = value
    }
  }
  return out
}

export async function logAuthEvent(input: {
  userId?: string | null
  kind: AuthEventKind
  request?: AnyRequest
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    await prisma.authEvent.create({
      data: {
        userId: input.userId ?? null,
        kind: input.kind,
        ip: extractIp(input.request),
        userAgent: extractUserAgent(input.request)?.slice(0, 500) ?? null,
        metadata: sanitizeMetadata(input.metadata) as object | undefined,
      },
    })
  } catch (err) {
    console.error('[AUTH_EVENT] log failed', { kind: input.kind, error: err })
  }
}
