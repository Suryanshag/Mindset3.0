import MobileSettingsPrivacy from '@/components/mobile/settings-privacy'
import BProfilePrivacy from '@/components/dashboard/desktop/b-profile-privacy'

export default function PrivacyPage() {
  return (
    <>
      <div className="lg:hidden">
        <MobileSettingsPrivacy />
      </div>
      <div className="hidden lg:block">
        <BProfilePrivacy />
      </div>
    </>
  )
}
