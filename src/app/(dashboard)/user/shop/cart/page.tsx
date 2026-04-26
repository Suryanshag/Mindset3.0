import Link from 'next/link'
import { ArrowLeft, ShoppingCart } from 'lucide-react'

export default function CartPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/user/shop" className="p-1">
          <ArrowLeft size={18} className="text-text" />
        </Link>
        <h1 className="text-[16px] font-medium text-text">Cart</h1>
      </div>
      <div className="flex flex-col items-center py-16">
        <ShoppingCart size={28} className="text-text-faint mb-2" />
        <p className="text-[14px] text-text-muted">Your cart is empty</p>
        <Link
          href="/user/shop"
          className="mt-3 text-[13px] font-medium text-primary"
        >
          Browse products
        </Link>
      </div>
    </div>
  )
}
