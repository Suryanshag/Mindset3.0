import MobileEditProfile from '@/components/mobile/edit-profile'
import BProfilePersonal from '@/components/dashboard/desktop/b-profile-personal'

export default function PersonalInfoPage() {
  return (
    <>
      <div className="lg:hidden">
        <MobileEditProfile />
      </div>
      <div className="hidden lg:block">
        <BProfilePersonal />
      </div>
    </>
  )
}
