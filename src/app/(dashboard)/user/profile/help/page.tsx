import MobileSettingsHelp from '@/components/mobile/settings-help'
import BProfileHelp from '@/components/dashboard/desktop/b-profile-help'

export default function HelpPage() {
  return (
    <>
      <div className="lg:hidden">
        <MobileSettingsHelp />
      </div>
      <div className="hidden lg:block">
        <BProfileHelp />
      </div>
    </>
  )
}
