import BottomNav from '@/components/dashboard/bottom-nav'

export default function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg-app">
      {/* Safe-area top spacer */}
      <div style={{ height: 'env(safe-area-inset-top)' }} />

      <main className="px-4 pb-24 pt-4">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
