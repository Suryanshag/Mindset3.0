import MobileProfileAddresses from '@/components/mobile/profile-addresses'
import BProfileAddresses from '@/components/dashboard/desktop/b-profile-addresses'

export default function ProfileAddressesPage() {
  return (
    <>
      <div className="lg:hidden">
        <MobileProfileAddresses />
      </div>
      <div className="hidden lg:block">
        <BProfileAddresses />
      </div>
    </>
  )
}
