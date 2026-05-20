import { z } from 'zod'

// Single source of truth for the password policy. Both the server-side Zod
// validators (registerApiSchema, reset-password route handler) and the
// client-side strength visuals (PasswordStrength + PasswordStrengthBars)
// consume from here.
//
// Locked by owner Decision 4 (docs/phase-1/diff-auth.md §J): "Bar visual
// without server-policy semantics is forbidden." A 'Strong' label on a
// password the server rejects would be a UX-disaster bug. Sharing this
// module across client + server prevents that drift.
//
// Policy: minimum 10 characters AND at least 3 of {lowercase, uppercase,
// digit, non-alphanumeric}.

const MIN_LENGTH = 10
const STRONG_LENGTH = 14
const CLASS_REGEXES = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/] as const

export const PASSWORD_MIN_LENGTH = MIN_LENGTH

export const passwordSchema = z
  .string()
  .min(MIN_LENGTH, `Password must be at least ${MIN_LENGTH} characters`)
  .refine(
    (p) => CLASS_REGEXES.filter((re) => re.test(p)).length >= 3,
    'Password must include 3 of: uppercase, lowercase, number, special character'
  )

export type PasswordScore = {
  /** 0 = empty/way-too-short, 1 = weak, 2 = fair, 3 = good, 4 = strong. */
  score: 0 | 1 | 2 | 3 | 4
  label: 'Too short' | 'Weak' | 'Fair' | 'Good' | 'Strong'
  /** True iff the password would pass the server's passwordSchema. */
  meetsPolicy: boolean
}

/**
 * Returns a deterministic score + label for the given candidate password.
 *
 * The `meetsPolicy` flag mirrors `passwordSchema.safeParse(value).success`
 * (verified by construction — same MIN_LENGTH and CLASS_REGEXES constants).
 *
 * Score-to-label rules:
 *   0  "Too short"  empty or shorter than MIN_LENGTH
 *   1  "Weak"       at least MIN_LENGTH but fewer than 3 classes
 *   2  "Fair"       meets policy, but lacks length OR class breadth
 *   3  "Good"       meets policy and (length >= STRONG_LENGTH XOR all 4 classes)
 *   4  "Strong"     meets policy AND length >= STRONG_LENGTH AND all 4 classes
 */
export function scorePassword(value: string): PasswordScore {
  if (!value || value.length < MIN_LENGTH) {
    return { score: 0, label: 'Too short', meetsPolicy: false }
  }

  const classCount = CLASS_REGEXES.filter((re) => re.test(value)).length
  const meetsPolicy = classCount >= 3
  if (!meetsPolicy) {
    return { score: 1, label: 'Weak', meetsPolicy: false }
  }

  const longEnough = value.length >= STRONG_LENGTH
  const allClasses = classCount === 4
  if (longEnough && allClasses) {
    return { score: 4, label: 'Strong', meetsPolicy: true }
  }
  if (longEnough || allClasses) {
    return { score: 3, label: 'Good', meetsPolicy: true }
  }
  return { score: 2, label: 'Fair', meetsPolicy: true }
}
