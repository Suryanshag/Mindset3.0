'use client'

import { signOut } from 'next-auth/react'

export default function SignOutButton() {
  return (
    <div className="flex justify-end">
      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className="text-[13px] text-red-500 font-normal py-3 px-1 hover:underline"
      >
        Sign out
      </button>
    </div>
  )
}
