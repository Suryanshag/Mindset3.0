'use client'

import { createContext, useContext, type ReactNode } from 'react'

// Phase 3a — Shell context. DesktopContent (which already receives
// unreadNotificationCount from the server shell) provides it here so
// the BPageHeader on every sub-page can read it without each page
// having to thread the prop through. Cart count is handled separately
// via the existing CartProvider context.

type ShellContextValue = {
  unreadCount: number
}

const ShellContext = createContext<ShellContextValue>({ unreadCount: 0 })

export function BShellProvider({
  unreadCount,
  children,
}: {
  unreadCount: number
  children: ReactNode
}) {
  return (
    <ShellContext.Provider value={{ unreadCount }}>
      {children}
    </ShellContext.Provider>
  )
}

export function useShellContext(): ShellContextValue {
  return useContext(ShellContext)
}
