import type { Metadata } from 'next'
import BreatheFlow from './breathe-flow'

// Phase 4 — Breathing exercise page. Mobile-first; frontend-only.
//
// MobileShell renders the standard header here (no data-no-mobile-header
// marker) so SOS access is preserved while the user breathes. The
// breathe-flow page wraps content in data-mobile-fullbleed so the
// shell's padding doesn't break the edge-to-edge soft-blue background.

export const metadata: Metadata = {
  title: 'Breathe · Mindset',
  robots: { index: false, follow: false },
}

export default function BreathePage() {
  return <BreatheFlow />
}
