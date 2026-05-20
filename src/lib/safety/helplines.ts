// Mental health helplines — single source of truth.
//
// Consumers: src/components/auth/helpline-modal.tsx today; /user/sos (Phase 6),
// post-session safety surfaces, and any future SOS UI in later phases.
//
// Phone numbers verified 2026-05-20 against TISS (iCall), Vandrevala Foundation,
// PIB government release (KIRAN), and AASRA official sources. iCall hours per
// the current TISS website; if these change, update here, not in callers.
//
// NOT YET MIGRATED to this module (kept as hand-curated copy for now):
//   - src/app/terms-of-use/page.tsx (legal page; static listing)
//   - src/app/not-found.tsx (single iCall reference)
// If a number changes, those two need a parallel edit until they adopt this module.

export type Helpline = {
  /** Stable identifier, used in keys and analytics. */
  id: 'icall' | 'vandrevala' | 'kiran' | 'aasra'
  /** Public display name. */
  name: string
  /** Hours of operation in human-readable form. */
  hours: string
  /** Phone number digits only, suitable for `tel:` href (no spaces, no dashes). */
  phone: string
  /** Phone number formatted for display. */
  display: string
  /** Optional WhatsApp number in E.164 format (e.g., "+919152987821"), suitable for wa.me/<digits>. */
  whatsapp?: string
  /** One-line context shown alongside the name. */
  blurb: string
}

export const HELPLINES: readonly Helpline[] = [
  {
    id: 'icall',
    name: 'iCall Helpline',
    hours: 'Mon–Sat, 10 AM – 8 PM',
    phone: '9152987821',
    display: '9152987821',
    whatsapp: '+919152987821',
    blurb: 'TISS-affiliated psychosocial counselling (English, Hindi, regional).',
  },
  {
    id: 'vandrevala',
    name: 'Vandrevala Foundation',
    hours: '24/7',
    phone: '18602662345',
    display: '1860-2662-345',
    whatsapp: '+911860266234',
    blurb: 'Free 24/7 mental health support; phone, chat, and email.',
  },
  {
    id: 'kiran',
    name: 'KIRAN Mental Health Helpline',
    hours: '24/7',
    phone: '18005990019',
    display: '1800-599-0019',
    blurb: 'Government of India toll-free, 13 languages.',
  },
  {
    id: 'aasra',
    name: 'AASRA',
    hours: '24/7',
    phone: '9820466726',
    display: '+91 9820466726',
    blurb: 'Crisis intervention and suicide prevention; trained volunteers.',
  },
] as const

/**
 * Returns the helpline by id, or undefined.
 * Prefer importing HELPLINES directly when listing all four.
 */
export function getHelpline(id: Helpline['id']): Helpline | undefined {
  return HELPLINES.find((h) => h.id === id)
}

/** Strip the leading `+` from a WhatsApp number for use in wa.me URLs. */
export function whatsappHref(whatsapp: string): string {
  return `https://wa.me/${whatsapp.replace(/^\+/, '').replace(/\D/g, '')}`
}
