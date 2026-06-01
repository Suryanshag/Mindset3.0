import MobileCart from '@/components/mobile/cart'
import BCart from '@/components/dashboard/desktop/b-cart'

// Phase 3h — Cart is now a thin wrapper: mobile renders the existing
// MobileCart, desktop renders the new BCart. Both components manage
// their own CartProvider subscription.

export default function CartPage() {
  return (
    <>
      <div className="lg:hidden">
        <MobileCart />
      </div>

      <div className="hidden lg:block">
        <BCart />
      </div>
    </>
  )
}
