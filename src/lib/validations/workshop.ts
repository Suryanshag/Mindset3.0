import { z } from 'zod'

/**
 * Accepts both legacy names (date, image, isPublished) and new names
 * (startsAt, coverImageUrl, published) so admin UI keeps working while
 * we migrate it to the new field names.
 */
export const createWorkshopSchema = z.object({
  title: z.string().min(2).max(200),
  subtitle: z.string().max(300).optional(),
  description: z.string().min(10).max(50000),
  // Legacy → new mapping
  image: z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),
  instructorName: z.string().max(200).optional(),
  date: z.string().datetime().optional(),
  startsAt: z.string().datetime().optional(),
  durationMin: z.number().int().min(1).default(60),
  priceCents: z.number().int().min(0).default(0),
  capacity: z.number().int().min(1).optional(),
  whatsappGroupUrl: z.string().url().optional(),
  isPublished: z.boolean().optional(),
  published: z.boolean().optional(),
}).refine(
  (d) => d.startsAt || d.date,
  { message: 'startsAt or date is required' }
)

/** Resolve legacy field names to the canonical new names. */
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
  }
}
