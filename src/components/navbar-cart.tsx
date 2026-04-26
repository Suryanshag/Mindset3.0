'use client'

import { useSession } from 'next-auth/react'
import { useCart } from '@/lib/cart-context'
import { ShoppingCart } from 'lucide-react'
import Link from 'next/link'

export default function NavbarCart() {
  const { data: session } = useSession()
  const { totalItems } = useCart()

  if (!session?.user || session.user.role !== 'USER') return null

  return (
    <Link
      href="/user/cart"
      className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      aria-label={`Cart (${totalItems} items)`}
    >
      <ShoppingCart className="w-6 h-6" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {totalItems > 9 ? '9+' : totalItems}
        </span>
      )}
    </Link>
  )
}
