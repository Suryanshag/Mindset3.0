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
const GOOD_LENGTH = 12
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
 * Strength bar labels — UI-only, downstream of meetsPolicy. Owner-reviewed
 * and locked 2026-05-20. Future label-threshold changes require owner
 * approval. Server policy (meetsPolicy) changes require security review.
 *
 *   Too short    : length < MIN_LENGTH (10)
 *   Weak         : length ≥ MIN_LENGTH (10) AND < 3 character classes
 *                  (fails meetsPolicy on the class-count requirement)
 *   Fair         : meets policy, length 10–11 with exactly 3 classes
 *   Good         : meets policy, length 12–13 with exactly 3 classes
 *   Strong       : meets policy AND (all 4 character classes at any length
 *                  ≥ MIN_LENGTH, OR length ≥ STRONG_LENGTH (14) with ≥ 3 classes)
 *
 * meetsPolicy (gate for server acceptance, NEVER tightened in UI):
 *   length ≥ MIN_LENGTH (10) AND ≥ 3 of [upper, lower, digit, symbol]
 *
 * Rationale for the Strong threshold: users perceive "all 4 character
 * classes at the policy-minimum length" as fully maxed on the variety
 * axis. The threshold treats that as Strong rather than insisting on
 * both length and variety being maxed simultaneously. NIST 800-63B
 * concurs: length is the primary security driver; variety is secondary.
 * `MyDog2026!` (10 chars, 4 classes) therefore reads Strong; so does
 * `MyVeryLongPassword12345` (24 chars, 3 classes — no symbol).
 *
 * The `meetsPolicy` flag mirrors `passwordSchema.safeParse(value).success`
 * (verified by construction — same MIN_LENGTH and CLASS_REGEXES constants).
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

  const allClasses = classCount === 4
  // Hitting either ceiling — all 4 character classes (variety maxed) OR
  // length >= STRONG_LENGTH (length maxed) — reads as Strong to the user.
  if (allClasses || value.length >= STRONG_LENGTH) {
    return { score: 4, label: 'Strong', meetsPolicy: true }
  }
  // Past the GOOD_LENGTH threshold but still missing one stop on either
  // ceiling — readable progression on the bar without overpromising.
  if (value.length >= GOOD_LENGTH) {
    return { score: 3, label: 'Good', meetsPolicy: true }
  }
  return { score: 2, label: 'Fair', meetsPolicy: true }
}
