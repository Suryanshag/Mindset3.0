import { NextRequest } from 'next/server'
import { handlers } from '@/lib/auth'
import { authLimiter } from '@/lib/arcjet'
import { handleArcjetDenial } from '@/lib/arcjet-protect'

export const GET = handlers.GET

export async function POST(req: NextRequest) {
  const decision = await authLimiter.protect(req)
  const denied = handleArcjetDenial(decision)
  if (denied) return denied

  return handlers.POST(req)
}
