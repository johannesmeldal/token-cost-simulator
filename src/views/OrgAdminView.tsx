import { Shield } from 'lucide-react'

export default function OrgAdminView() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-accent-purple">
        <Shield size={18} />
        <h1 className="text-lg font-semibold">Org Admin — Dashboard</h1>
      </div>
      <p className="text-sm text-gray-400">Dashboards og admin-panel lastes inn her.</p>
    </div>
  )
}
