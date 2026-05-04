'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/cart-context'

export default function CartHeaderIcon() {
  const { totalItems } = useCart()
  const display = totalItems > 9 ? '9+' : totalItems

  return (
    <Link href="/user/cart" className="relative shrink-0 p-1.5">
      <ShoppingBag size={22} strokeWidth={1.5} className="text-text-muted" />
      {totalItems > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[9px] font-medium text-white flex items-center justify-center">
          {display}
        </span>
      )}
    </Link>
  )
}
