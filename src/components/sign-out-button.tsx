'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart-context'

export default function SignOutButton() {
  const router = useRouter()
  const { clearCart } = useCart()

  const handleSignOut = async () => {
    await clearCart()
    await signOut({ redirect: false })
    router.replace('/login')
  }

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
    >
      Sign Out
    </button>
  )
}
