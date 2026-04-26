import Spine from '@/components/dashboard/spine'

export default function DesktopShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="desktop-shell min-h-dvh">
      <Spine />

      <main className="bg-bg-app overflow-y-auto">
        <div className="mx-auto max-w-[720px] px-8 py-8">
          {children}
        </div>
      </main>

      {/* Rail — empty in sprint 7, filled in sprint 8 */}
      <aside className="desktop-rail bg-bg-app overflow-y-auto" style={{ borderLeft: '0.5px solid var(--color-border)' }}>
        <div className="flex items-center justify-center h-full">
          <span className="text-text-faint text-[13px]">&mdash;</span>
        </div>
      </aside>
    </div>
  )
}
