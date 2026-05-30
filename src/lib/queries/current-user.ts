import { cache } from 'react'
import { prisma } from '@/lib/prisma'

/**
 * Returns the union of User fields needed by the dashboard layout (just
 * emailVerified + consentedAt) and the /user home page (name/image/phone/
 * etc.) so both call sites can share a single query per request via React
 * cache(). `consentedAt` is read by the layout to gate Google-OAuth users
 * who haven't completed the DPDP consent flow — adding it here avoids a
 * second round-trip on every dashboard render.
 */
export const getCurrentUserBasics = cache(async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
      phone: true,
      dateOfBirth: true,
      preferredLanguage: true,
      emergencyContact: true,
      emailVerified: true,
      consentedAt: true,
    },
  })
})
