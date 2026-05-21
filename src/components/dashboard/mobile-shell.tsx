import BottomNav from '@/components/dashboard/bottom-nav'
import MobileHeader from '@/components/mobile/header'

// MobileShell ports two opt-outs via CSS :has() against data attributes.
// Modern Chrome/Safari (the only browsers we ship to in TWA + iOS PWA)
// support :has() natively.
//
// `data-mobile-fullbleed` — page renders edge-to-edge; shell drops its
// left/right/top padding. See globals.css §mobile-shell-fullbleed.
//
// `data-no-mobile-header` — page renders its own header (or no header
// at all). Default is shell-rendered MobileHeader for SOS visibility
// across every authenticated route. See globals.css §mobile-shell-noheader.
//
// Pages currently opting out of the shell header:
//   /user        — three engagement states render their own header
//                  with state-specific bell visibility
//   /user/sos    — back-button chrome instead of full header

type MobileShellProps = {
  children: React.ReactNode
  name: string
  unreadCount?: number
}

export default function MobileShell({
  children,
  name,
  unreadCount = 0,
}: MobileShellProps) {
  return (
    <div className="min-h-dvh bg-bg-app">
      {/* Safe-area top spacer */}
      <div style={{ height: 'env(safe-area-inset-top)' }} />

      {/* Default MobileHeader. The CSS rule in globals.css hides this
          on pages that include a `data-no-mobile-header` element. */}
      <div className="mobile-shell-header">
        <MobileHeader name={name} unreadCount={unreadCount} />
      </div>

      <main className="mobile-shell-main px-4 pb-24 pt-4">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
