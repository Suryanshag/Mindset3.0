import type { Metadata } from 'next'
import SosFlow from './sos-flow'

// Phase 2 SOS triage surface — full-bleed inside MobileShell. No
// analytics, no tracking, no session-timeout. The page wraps SosFlow
// in a data-mobile-fullbleed marker so MobileShell drops its outer
// padding (the SOS background needs to bleed edge-to-edge).
//
// Authentication is enforced by the (dashboard)/layout.tsx parent —
// unauthed users land on /login with callbackUrl=/user/sos. For
// non-authed users a public /helplines page exists separately (and
// the /not-found page also surfaces helplines).

export const metadata: Metadata = {
  title: 'SOS · Get help now',
  robots: { index: false, follow: false },
}

export default function SosPage() {
  return (
    <div data-mobile-fullbleed data-no-mobile-header>
      <SosFlow />
    </div>
  )
}
