import MobileProfileAbout from '@/components/mobile/profile-about'
import BProfileAbout from '@/components/dashboard/desktop/b-profile-about'

export default function AboutPage() {
  return (
    <>
      <div className="lg:hidden">
        <MobileProfileAbout />
      </div>
      <div className="hidden lg:block">
        <BProfileAbout />
      </div>
    </>
  )
}
