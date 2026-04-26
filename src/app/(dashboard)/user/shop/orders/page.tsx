import Link from 'next/link'
import { Package } from 'lucide-react'
import PageHeader from '@/components/dashboard/page-header'

export default function OrdersPage() {
  return (
    <div>
      <PageHeader title="My orders" back="/user/shop" />
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
