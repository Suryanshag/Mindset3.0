import { z } from 'zod'

/**
 * Workshop validation.
 * Accepts both legacy names (date, image, isPublished) and new names
 * (startsAt, coverImageUrl, published) so older payloads keep working.
 *
 * Presenter handling: caller may either pass an existing `presenterId`
 * OR a `newPresenter` object — admin form supports inline create.
 */

const presenterInlineSchema = z.object({
  name: z.string().min(2).max(120),
  title: z.string().min(2).max(200),
  tier: z.enum(['PROFESSIONAL', 'ASSOCIATE']),
  bio: z.string().max(2000).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('').transform(() => undefined)),
})

export const createWorkshopSchema = z.object({
  title: z.string().min(2).max(200),
  subtitle: z.string().max(300).optional(),
  description: z.string().min(10).max(50000),

  // Legacy → new mapping for image
  image: z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),

  // Legacy: free-text instructor name. Kept so admin can still send it during transition.
  instructorName: z.string().max(200).optional(),

  // Legacy → new mapping for date
  date: z.string().datetime().optional(),
  startsAt: z.string().datetime().optional(),

  durationMin: z.number().int().min(15).max(480).default(60),
  priceCents: z.number().int().min(0).default(0),
  capacity: z.number().int().min(1).max(10000).optional(),
  whatsappGroupUrl: z.string().url().optional(),

  // Legacy → new mapping for published
  isPublished: z.boolean().optional(),
  published: z.boolean().optional(),

  type: z.enum(['WORKSHOP', 'CIRCLE']).default('WORKSHOP'),
  status: z.enum(['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED']).optional(),
  presenterId: z.string().cuid().optional(),
  newPresenter: presenterInlineSchema.optional(),
  meetLink: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  minCapacity: z.number().int().min(1).max(10000).default(5),
  presenterSplitPct: z.number().int().min(0).max(100).default(70),
}).refine(
  (d) => d.startsAt || d.date,
  { message: 'startsAt or date is required' }
)

/** Resolve legacy field names to canonical names. */
export function resolveWorkshopFields(d: z.infer<typeof createWorkshopSchema>) {
  return {
    title: d.title,
    subtitle: d.subtitle,
    description: d.description,
    coverImageUrl: d.coverImageUrl ?? d.image ?? undefined,
    instructorName: d.instructorName,
    startsAt: new Date((d.startsAt ?? d.date)!),
    durationMin: d.durationMin,
    priceCents: d.priceCents,
    capacity: d.capacity,
    whatsappGroupUrl: d.whatsappGroupUrl,
    published: d.published ?? d.isPublished ?? false,
    type: d.type,
    meetLink: d.meetLink,
    minCapacity: d.minCapacity,
    presenterSplitPct: d.presenterSplitPct,
  }
}
