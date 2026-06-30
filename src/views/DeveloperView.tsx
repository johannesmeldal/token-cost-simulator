import { Code2 } from 'lucide-react'
import { useGovernanceStore } from '../store/useGovernanceStore'
import { useOrgStore } from '../store/useOrgStore'

export default function DeveloperView() {
  const { activeIdentity } = useGovernanceStore()
  const users = useOrgStore(s => s.users)
  const user = users.find(u => u.id === activeIdentity.userId)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-accent-green">
        <Code2 size={18} />
        <h1 className="text-lg font-semibold">Developer — {user?.name ?? 'Ukjent bruker'}</h1>
      </div>
      <p className="text-sm text-gray-400">Developer-dashboard lastes inn her.</p>
    </div>
  )
}
