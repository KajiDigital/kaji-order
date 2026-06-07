export const dynamic = 'force-dynamic'

import { getPlatformSettings } from '@/app/lib/platform'
import { AdminSettingsClient } from '@/app/components/admin/AdminSettingsClient'

export default async function AdminSettingsPage() {
  const settings = await getPlatformSettings()

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Platform Settings</h1>
      <AdminSettingsClient initial={settings} />
    </div>
  )
}
