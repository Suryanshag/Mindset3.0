import { z } from 'zod'

export const addToCartSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1).max(100),
})

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(100),
})

export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().cuid(),
    quantity: z.number().int().min(1).max(100),
  })).min(1),
  shippingAddress: z.object({
    name: z.string().min(2).max(100),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
    addressLine1: z.string().min(5).max(200),
    addressLine2: z.string().max(200).optional(),
    city: z.string().min(2).max(100),
    state: z.string().min(2).max(100),
    pincode: z.string().regex(/^\d{6}$/, 'Invalid PIN code'),
  }),
  selectedCourierId: z.coerce.number().int().positive().finite(),
  selectedCourierName: z.string().min(1),
  deliveryCharge: z.coerce.number().min(0).finite(),
})
