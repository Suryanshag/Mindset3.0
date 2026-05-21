import BottomNav from '@/components/dashboard/bottom-nav'

// Pages opt into edge-to-edge rendering by wrapping their content in
// `<div data-mobile-fullbleed>` (or any element with that attribute).
// The CSS rule in globals.css §mobile-shell-fullbleed neutralizes the
// main's padding via :has(). Modern Chrome/Safari support :has()
// natively (the only browsers TWA + iOS Safari run on).
//
// Pages that don't set the marker get the default `px-4 pt-4` chrome,
// which preserves Phase 1's layout for every existing mobile route.

export default function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg-app">
      {/* Safe-area top spacer */}
      <div style={{ height: 'env(safe-area-inset-top)' }} />

      <main className="mobile-shell-main px-4 pb-24 pt-4">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
