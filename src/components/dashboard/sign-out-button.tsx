'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="flex items-center gap-3 w-full px-4 py-3.5 bg-bg-card rounded-2xl text-left"
      style={{ border: '0.5px solid var(--color-border)' }}
    >
      <LogOut size={18} className="text-red-500 shrink-0" />
      <span className="text-[14px] text-red-500">Sign out</span>
    </button>
  )
}
