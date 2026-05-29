import { z } from 'zod'

// Payment enums
export const paymentStatusSchema = z.enum(['PENDING', 'PAID', 'FAILED'])
export const paymentTypeSchema = z.enum(['SESSION', 'PRODUCT', 'WORKSHOP', 'EBOOK'])

// Order/Shipping enums
export const shippingStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'RETURNED',
])
export const paymentStatusOrderSchema = z.enum(['PENDING', 'PAID', 'FAILED'])

// Session enums
export const sessionStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])

// Utility: Safe enum parsing for query parameters
export function parseEnumParam<T extends z.ZodEnum<any>>(
  value: string | null | undefined,
  schema: T
): z.infer<T> | undefined {
  if (!value) return undefined
  const result = schema.safeParse(value)
  return result.success ? result.data : undefined
}
