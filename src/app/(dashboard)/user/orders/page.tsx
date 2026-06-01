import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserOrders } from '@/lib/queries/orders'
import MobileOrdersView from '@/components/mobile/orders-list'
import BOrdersList from '@/components/dashboard/desktop/b-orders-list'

export default async function OrdersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const orders = await getUserOrders(session.user.id)

  return (
    <>
      <div className="lg:hidden">
        <MobileOrdersView orders={orders} />
      </div>
      <div className="hidden lg:block">
        <BOrdersList orders={orders} />
      </div>
    </>
  )
}
