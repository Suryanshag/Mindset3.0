import Link from 'next/link'
import { ArrowLeft, Package } from 'lucide-react'

export default function OrdersPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/user/shop" className="p-1">
          <ArrowLeft size={18} className="text-text" />
        </Link>
        <h1 className="text-[16px] font-medium text-text">My orders</h1>
      </div>
      <div className="flex flex-col items-center py-16">
        <Package size={28} className="text-text-faint mb-2" />
        <p className="text-[14px] text-text-muted">No orders yet</p>
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
