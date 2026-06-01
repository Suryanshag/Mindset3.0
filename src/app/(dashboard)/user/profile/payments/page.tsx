import MobileProfilePayments from '@/components/mobile/profile-payments'
import BProfilePayments from '@/components/dashboard/desktop/b-profile-payments'

export default function ProfilePaymentsPage() {
  return (
    <>
      <div className="lg:hidden">
        <MobileProfilePayments />
      </div>
      <div className="hidden lg:block">
        <BProfilePayments />
      </div>
    </>
  )
}
