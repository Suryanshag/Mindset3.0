'use client'

import { usePathname } from 'next/navigation'
import Spine from '@/components/dashboard/spine'
import type { SpineSession } from '@/lib/queries/reflection'

type Props = {
  spineSessions: SpineSession[]
  children: React.ReactNode
}

export default function DesktopContent({ spineSessions, children }: Props) {
  const pathname = usePathname()

  // Reflection routes: /user or /user/sessions/[id]
  const isReflectionRoute =
    pathname === '/user' ||
    (pathname?.startsWith('/user/sessions/') && pathname !== '/user/sessions')

  const showRail = isReflectionRoute

  return (
    <div className={`desktop-shell min-h-dvh ${showRail ? 'with-rail' : 'no-rail'}`}>
      <Spine sessions={spineSessions} />

      <main className="bg-bg-app overflow-y-auto">
        <div className="mx-auto max-w-[720px] px-8 py-8">
          {children}
        </div>
      </main>

      {showRail && (
        <aside
          className="desktop-rail bg-bg-app overflow-y-auto"
          style={{ borderLeft: '0.5px solid var(--color-border)' }}
        >
          <div className="p-6" id="desktop-rail-content" />
        </aside>
      )}
    </div>
  )
}
