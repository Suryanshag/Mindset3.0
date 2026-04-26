import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import PageHeader from '@/components/dashboard/page-header'

export default function CartPage() {
  return (
    <div>
      <PageHeader title="Cart" back="/user/shop" />
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
