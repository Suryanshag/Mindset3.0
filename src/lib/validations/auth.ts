import { z } from 'zod'

// Phone is optional. Accepts a 10-digit Indian mobile or the same digits
// prefixed with +91 / 91 (spaces/hyphens allowed). The API normalises to 10 digits.
const phoneOptional = z
  .string()
  .optional()
  .refine(
    (v) => !v || v.trim() === '' || /^(?:\+?91)?[6-9]\d{9}$/.test(v.replace(/[\s-]/g, '')),
    'Enter a valid Indian mobile number'
  )

export const registerApiSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  phone: phoneOptional,
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .refine((p) => {
      const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/]
      return classes.filter((re) => re.test(p)).length >= 3
    }, 'Password must include 3 of: uppercase, lowercase, number, special character'),
})

// Honeypot is checked at the route boundary, not in the schema, so password
// managers / autofill can't break the form by stuffing a value into the
// hidden input. The route handler reads body.website_url directly.

export const registerSchema = registerApiSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})
